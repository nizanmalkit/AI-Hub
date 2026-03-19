import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";
import * as admin from "firebase-admin";
// @ts-ignore - Ignore missing types during compile if any
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Set timeout limit for Vercel to 60 seconds


const parser = new Parser();

export async function POST(request: Request) {
  try {
    console.log("Next.js /api/sync triggered");

    // 1. Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Next.js environment variables (.env.local)");
    }
    const ai = new GoogleGenAI({ apiKey });

    // 1.5. Read Sync Frequency Setting
    const configSnap = await db.collection("settings").doc("sync_config").get();
    const frequency = configSnap.exists ? configSnap.data()?.frequency : "manual";
    console.log(`Current Sync Frequency Rule: ${frequency}`);

    // 2. Fetch Active Sources
    const sourcesSnapshot = await db.collection("sources")
      .where("is_active", "==", true)
      .get();

    if (sourcesSnapshot.empty) {
      return NextResponse.json({ status: "success", message: "No active sources found to sync." });
    }

    const scrapedItems: any[] = [];
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    // 3. Scrape Feeds
    for (const doc of sourcesSnapshot.docs) {
      const source = doc.data();
      const sourceId = doc.id;
      const sourceName = source.name || "Unknown Source";
      const sourceUrl = source.url;

      console.log(`Scraping Source: ${sourceName} (${sourceUrl})`);

      try {
        const feed = await parser.parseURL(sourceUrl);
        
        for (const item of feed.items) {
          const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
          
          if (pubDate >= twentyFourHoursAgo) {
            scrapedItems.push({
              source_id: sourceId,
              source_name: sourceName,
              title: item.title || "No Title",
              description: item.summary || item.contentSnippet || item.content || "",
              link: item.link || sourceUrl,
              pubDate: new Date(pubDate).toISOString()
            });
          }
        }
      } catch (scrapeError) {
        console.error(`Failed to scrape ${sourceName}:`, scrapeError);
        // Continue to next source
      }
    }

    if (scrapedItems.length === 0) {
      return NextResponse.json({ status: "success", message: "No new items found in the last 24 hours." });
    }

    console.log(`Processing ${scrapedItems.length} items with Gemini`);

    // 4. Construct Prompt
    const prompt = `
    You are an expert AI aggregator. Below are the latest updates from various tech sources fetched in the last 24 hours.
    
    Your task is to:
    1. Read all updates.
    2. Group related items together.
    3. Select at most the TOP 5 most useful/significant developments.
    4. For each selected item, write a 3-sentence summary in English.
    5. Categorize into: "LLM Updates", "Tutorials", "Policy", "Open Source", or "General AI".
    6. Score importance (1 to 10).
    7. Extract at least 3-5 keywords or tags describing exact topics (e.g. "RAG", "VectorDB", "Agents").
    8. Provide accurate Hebrew translations for BOTH the Title and the 3-sentence summary that flow naturally for right-to-left readers.
    
    Output MUST be a STRICTLY valid JSON array of objects with schema:
    {
      "source_id": "string (match input source_id)",
      "original_title": "string (English title)",
      "title_he": "string (Accurate Hebrew translation of the title)",
      "original_url": "string",
      "ai_summary": "string (3 sentence explanation in English)",
      "ai_summary_he": "string (3 sentence explanation in Hebrew)",
      "category": "string",
      "importance_score": number,
      "keywords": ["string"]
    }

    Input Data:
    ${JSON.stringify(scrapedItems, null, 2)}
    `;

    // 5. Query Gemini
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const responseText = aiResponse.text;
    if (!responseText) throw new Error("Empty response from Gemini.");

    const updates = JSON.parse(responseText);

    // 6. Batch Write to Firestore
    const batch = db.batch();
    for (const update of updates) {
      const postRef = db.collection("posts").doc();
      batch.set(postRef, {
        ...update,
        published_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`Successfully added ${updates.length} curated posts to Firestore.`);

    // 🏆 7. Smart Archival Maintenance (Items older than 30 days)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const staleSnap = await db.collection("posts")
        .where("published_at", "<", thirtyDaysAgo)
        .limit(100)
        .get();

      if (!staleSnap.empty) {
        const archiveBatch = db.batch();
        let archiveCount = 0;
        staleSnap.docs.forEach(doc => {
          if (doc.data().archived !== true) {
            archiveBatch.update(doc.ref, { archived: true });
            archiveCount++;
          }
        });
        if (archiveCount > 0) {
          await archiveBatch.commit();
          console.log(`Archived ${archiveCount} old posts.`);
        }
      }
    } catch (archiveError) {
      console.error("Failed archival cycle:", archiveError);
    }

    // 🏆 8. Chain Newsletter Dispatch
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // Strip trailing slash to avoid double-slashes
      
      if (cleanBaseUrl === "http://localhost:3000") {
        console.warn("⚠️ [Sync API] NEXT_PUBLIC_BASE_URL is not set. Defaulting to localhost:3000. In production (Vercel), this trigger WILL FAIL.");
      } else {
        console.log(`[Sync API] Triggering newsletter at: ${cleanBaseUrl}/api/cron/newsletter`);
      }

      const chainResponse = await fetch(`${cleanBaseUrl}/api/cron/newsletter`, { method: "POST" });
      
      if (!chainResponse.ok) {
        console.error(`❌ Sequential newsletter trigger failed with Status ${chainResponse.status}`);
      } else {
        console.log("✅ Automatically triggered sequential newsletter dispatch.");
      }
    } catch (chainError) {
      console.error("❌ Failed to chain newsletter trigger:", chainError);
    }



    return NextResponse.json({ 
      status: "success", 
      message: `Curated and posted ${updates.length} items successfully.` 
    });

  } catch (error) {
    console.error("Sync API Logic Error", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
