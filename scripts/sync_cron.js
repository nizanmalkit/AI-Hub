const fs = require('fs');
const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');
const admin = require('firebase-admin');

const parser = new Parser();

// 1. Setup Environment Configuration (Read env OR .env.local for local testing)
const config = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
};

// Fallback to .env.local if variables are missing
if (!config.geminiApiKey || !config.privateKey) {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        const trimmedKey = key.trim();
        if (trimmedKey === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' && !config.projectId) config.projectId = value;
        if (trimmedKey === 'FIREBASE_CLIENT_EMAIL' && !config.clientEmail) config.clientEmail = value;
        if (trimmedKey === 'FIREBASE_PRIVATE_KEY' && !config.privateKey) config.privateKey = value;
        if (trimmedKey === 'GEMINI_API_KEY' && !config.geminiApiKey) config.geminiApiKey = value;
        if (trimmedKey === 'NEXT_PUBLIC_BASE_URL' && (!config.baseUrl || config.baseUrl === "http://localhost:3000")) config.baseUrl = value;
      }
    });
  } catch (e) {
    // Ignore if file doesnt exist
  }
}

async function run() {
  console.log("--- 🛰️ Starting Background Sync Cron ---");

  if (!config.geminiApiKey) {
    console.error("❌ GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  if (!config.privateKey || !config.clientEmail) {
    console.error("❌ Firebase Admin credentials are not set.");
    process.exit(1);
  }

  // 2. Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.projectId || "ai-hub-76eca",
      clientEmail: config.clientEmail,
      privateKey: config.privateKey.replace(/\\n/g, '\n')
    })
  });

  const db = admin.firestore();
  console.log("✅ Firebase Admin Initialized");

  // 3. Fetch Active Sources
  const sourcesSnap = await db.collection("sources").where("is_active", "==", true).get();
  if (sourcesSnap.empty) {
    console.log("No active sources found to sync.");
    return;
  }

  const scrapedItems = [];
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

  console.log(`\nScraping items since: ${new Date(twentyFourHoursAgo).toISOString()}`);

  for (const doc of sourcesSnap.docs) {
    const source = doc.data();
    const sourceId = doc.id;
    const sourceName = source.name || "Unknown Source";
    const sourceUrl = source.url;

    console.log(`Scraping Source: ${sourceName}`);
    try {
      const feed = await parser.parseURL(sourceUrl);
      if (feed.items) {
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
      }
    } catch (error) {
      console.error(`  ❌ Failed to scrape ${sourceName}:`, error.message);
    }
  }

  console.log(`\nTotal New Items: ${scrapedItems.length}`);

  if (scrapedItems.length === 0) {
    console.log("No new items found in the last 24 hours. Exiting.");
    return;
  }

  console.log("Processing with Gemini AI...");

  // 4. Query Gemini
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const prompt = `
  You are an expert AI aggregator. Below are the latest updates from various tech sources fetched in the last 24 hours.
  
  Your task is to:
  1. Group related items together.
  2. Select at most the TOP 5 most useful/significant developments.
  3. For each selected item, write a 3-sentence summary in English.
  4. Categorize into: "LLM Updates", "Tutorials", "Policy", "Open Source", or "General AI".
  5. Score importance (1 to 10).
  6. Extract 3-5 keywords or tags.
  7. Provide accurate Hebrew translations for Title and 3-sentence summary.
  
  Output MUST be a STRICTLY valid JSON array of objects with schema:
  {
    "source_id": "string",
    "original_title": "string",
    "title_he": "string",
    "original_url": "string",
    "ai_summary": "string",
    "ai_summary_he": "string",
    "category": "string",
    "importance_score": number,
    "keywords": ["string"]
  }

  Input Data:
  ${JSON.stringify(scrapedItems, null, 2)}
  `;

  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const updates = JSON.parse(aiResponse.text);
    console.log(`Gemini curated ${updates.length} items.`);

    // 5. Batch Write to Firestore
    const batch = db.batch();
    for (const update of updates) {
      const postRef = db.collection("posts").doc();
      batch.set(postRef, {
        ...update,
        published_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`✅ Successfully added ${updates.length} curated posts to Firestore.`);

    // 6. Chain Newsletter Dispatch
    const cleanBaseUrl = config.baseUrl.replace(/\/$/, "");
    if (cleanBaseUrl && cleanBaseUrl !== "http://localhost:3000") {
      console.log(`Triggering newsletter at: ${cleanBaseUrl}/api/cron/newsletter`);
      
      const res = await fetch(`${cleanBaseUrl}/api/cron/newsletter`, { method: "POST" });
      if (!res.ok) {
        console.error(`❌ Newsletter trigger failed with Status ${res.status}`);
      } else {
        console.log("✅ Sequential newsletter dispatch triggered.");
      }
    } else {
      console.warn("⚠️ skipping newsletter trigger: NEXT_PUBLIC_BASE_URL defaults to localhost.");
    }

  } catch (error) {
    console.error("❌ Sync Logic Error:", error);
  }

  console.log("--- 🏁 Sync Cron Finished ---");
}

run();
