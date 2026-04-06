import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// @ts-ignore - Ignore missing types if they aren't fully populated inside the functions env workspace
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

admin.initializeApp();

const parser = new Parser();

// Core synchronization logic shared by both HTTP and Scheduled triggers
async function runSync() {
  functions.logger.info("Executing Sync Task started", {structuredData: true});
    
  // 1. Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const db = admin.firestore();

  // 2. Fetch Active Sources
  const sourcesSnapshot = await db.collection("sources")
    .where("is_active", "==", true)
    .get();

  if (sourcesSnapshot.empty) {
    functions.logger.info("No active sources found.");
    return { status: "success", message: "No active sources to sync." };
  }

  const scrapedItems: any[] = [];
  const now = Date.now();
  const threeDaysAgo = now - (72 * 60 * 60 * 1000);

  // Track which sources returned data
  const sourcesWithData = new Map<string, string>(); // sourceId -> sourceName

  // 3. Scrape Feeds
  for (const doc of sourcesSnapshot.docs) {
    const source = doc.data();
    const sourceId = doc.id;
    const sourceName = source.name || "Unknown Source";
    const sourceUrl = source.url;

    functions.logger.info(`Scraping Source: ${sourceName} (${sourceUrl})`);

    try {
      const feed = await parser.parseURL(sourceUrl);
      let sourceItemCount = 0;
      
      for (const item of feed.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
        
        if (pubDate >= threeDaysAgo) {
          scrapedItems.push({
            source_id: sourceId,
            source_name: sourceName,
            title: item.title || "No Title",
            description: item.summary || item.contentSnippet || item.content || "",
            link: item.link || sourceUrl,
            pubDate: new Date(pubDate).toISOString()
          });
          sourceItemCount++;
        }
      }

      if (sourceItemCount > 0) {
        sourcesWithData.set(sourceId, sourceName);
      }
    } catch (scrapeError) {
      functions.logger.error(`Failed to scrape ${sourceName}:`, scrapeError);
    }
  }

  if (scrapedItems.length === 0) {
    functions.logger.info("No new items found in the last 72 hours.");
    return { status: "success", message: "No new updates found to process." };
  }

  functions.logger.info(`Processing ${scrapedItems.length} items from ${sourcesWithData.size} sources with Gemini`);

  // ── Deduplication: Check existing posts ──
  // Fetch all original_url values from recent posts to avoid re-ingesting
  const existingUrlsSet = new Set<string>();
  const recentPostsSnapshot = await db.collection("posts")
    .orderBy("published_at", "desc")
    .limit(500)
    .get();
  
  for (const postDoc of recentPostsSnapshot.docs) {
    const postData = postDoc.data();
    if (postData.original_url) {
      existingUrlsSet.add(postData.original_url);
    }
  }
  functions.logger.info(`Found ${existingUrlsSet.size} existing post URLs for dedup`);

  // 4. Construct Prompt
  const prompt = `
  You are an expert AI aggregator. Below are the latest updates from various tech sources fetched in the last 72 hours.
  
  Your task is to:
  1. Read all updates.
  2. Group related items together.
  3. Select the TOP 15 to 20 most significant developments.
  4. Ensure you include at least one significant update from as many different sources as possible to maintain a diverse feed.
  5. For each selected item, write a 3-sentence summary highlighting why it matters.
  6. Categorize into: "LLM Updates", "Tutorials", "Policy", "Open Source", or "General AI".
  7. Score importance (1 to 10).
  
  Output MUST be a STRICTLY valid JSON array of objects with schema:
  {
    "source_id": "string",
    "source_name": "string",
    "original_title": "string",
    "original_url": "string",
    "ai_summary": "string",
    "category": "string",
    "importance_score": number
  }
  
  Here are the updates to process:
  ${JSON.stringify(scrapedItems, null, 2)}`;

  const aiResponse = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const responseText = aiResponse.text;
  if (!responseText) throw new Error("Empty response from Gemini.");

  let updates: any[] = JSON.parse(responseText);

  // ── Diversity Enforcement: At least 1 item per source that returned data ──
  const representedSourceIds = new Set(updates.map((u: any) => u.source_id));
  
  for (const [sourceId, sourceName] of sourcesWithData) {
    if (!representedSourceIds.has(sourceId)) {
      // Find the best item from this source in scrapedItems (most recent)
      const sourceItems = scrapedItems
        .filter(item => item.source_id === sourceId)
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      if (sourceItems.length > 0) {
        const best = sourceItems[0];
        functions.logger.info(`Diversity enforcement: adding item from missing source "${sourceName}"`);
        updates.push({
          source_id: best.source_id,
          source_name: best.source_name,
          original_title: best.title,
          original_url: best.link,
          ai_summary: best.description.substring(0, 300) || `Latest update from ${sourceName}.`,
          category: "General AI",
          importance_score: 5
        });
      }
    }
  }

  // ── Dedup filter: remove items whose original_url already exists in Firestore ──
  const beforeDedup = updates.length;
  updates = updates.filter((u: any) => !existingUrlsSet.has(u.original_url));
  const dedupRemoved = beforeDedup - updates.length;
  if (dedupRemoved > 0) {
    functions.logger.info(`Dedup removed ${dedupRemoved} already-existing posts`);
  }

  if (updates.length === 0) {
    functions.logger.info("All curated items were duplicates. Nothing to write.");
    return { status: "success", message: "All items already exist. No new posts added." };
  }

  // 5. Batch Write
  const batch = db.batch();
  for (const update of updates) {
    const postRef = db.collection("posts").doc();
    batch.set(postRef, {
      ...update,
      published_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  functions.logger.info(`Successfully posted ${updates.length} items (${dedupRemoved} duplicates skipped)`);
  return { status: "success", message: `Curated and posted ${updates.length} items (${dedupRemoved} duplicates skipped).` };
}

// 1. Manual HTTP Trigger Webhook
export const executeSync = functions.https.onRequest(async (request, response) => {
  try {
    const result = await runSync();
    response.send(result);
  } catch (error) {
    functions.logger.error("Sync Logic Error", error);
    response.status(500).send({ status: "error", message: String(error) });
  }
});

// 2. Automated Trigger - Runs Daily at 7:00 AM
export const scheduledSync = functions.pubsub
  .schedule("0 7 * * *")
  .timeZone("UTC") // Can be adjusted to user's locale
  .onRun(async (context) => {
    functions.logger.info("Running daily scheduled synchronization task.");
    try {
      await runSync();
    } catch (error) {
      functions.logger.error("Error running scheduled sync", error);
    }
  });
