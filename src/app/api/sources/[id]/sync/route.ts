import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";
import * as admin from "firebase-admin";
// @ts-ignore
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Set timeout limit for Vercel to 60 seconds

const parser = new Parser();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sourceId = params.id;

  try {
    console.log(`Manual sync triggered for source: ${sourceId}`);

    // 1. Fetch Source Details
    const sourceDoc = await db.collection("sources").doc(sourceId).get();
    if (!sourceDoc.exists) {
      return NextResponse.json({ status: "error", message: "Source not found." }, { status: 404 });
    }

    const source = sourceDoc.data();
    const sourceName = source?.name || "Unknown Source";
    const sourceUrl = source?.url;

    if (!sourceUrl) {
      return NextResponse.json({ status: "error", message: "Source URL is missing." }, { status: 400 });
    }

    // 2. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "GEMINI_API_KEY not configured." }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey });

    // 3. Scrape Feed (72h window)
    const now = Date.now();
    const threeDaysAgo = now - (72 * 60 * 60 * 1000);
    const feed = await parser.parseURL(sourceUrl);
    
    const candidates = [];
    for (const item of feed.items) {
      const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
      if (pubDate >= threeDaysAgo) {
        candidates.push({
          source_id: sourceId,
          source_name: sourceName,
          title: item.title || "No Title",
          description: item.summary || item.contentSnippet || item.content || "",
          link: item.link || sourceUrl,
          pubDate: new Date(pubDate).toISOString()
        });
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        message: `No new items found in the last 72 hours for ${sourceName}.`,
        addedCount: 0
      });
    }

    // 4. Deduplication: Check existing posts
    const existingUrlsSet = new Set<string>();
    const recentPostsSnapshot = await db.collection("posts")
      .where("source_id", "==", sourceId)
      .orderBy("published_at", "desc")
      .limit(50) // Check last 50 for this specific source
      .get();
    
    for (const postDoc of recentPostsSnapshot.docs) {
      const data = postDoc.data();
      if (data.original_url) existingUrlsSet.add(data.original_url);
    }

    const uniqueCandidates = candidates.filter(c => !existingUrlsSet.has(c.link));

    if (uniqueCandidates.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        message: `All ${candidates.length} items found are already in your feed.`,
        addedCount: 0
      });
    }

    // 5. AI Curation via Gemini
    const prompt = `
    You are an expert AI aggregator. Below are the latest updates from "${sourceName}" fetched in the last 72 hours.
    
    Your task is to:
    1. Select the most significant items (up to 5).
    2. For each, write a 3-sentence summary highlighting why it matters.
    3. Categorize into: "LLM Updates", "Tutorials", "Policy", "Open Source", or "General AI".
    4. Score importance (1 to 10).
    
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
    ${JSON.stringify(uniqueCandidates, null, 2)}`;

    const aiResponse = await (ai as any).models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const responseText = aiResponse.text;
    if (!responseText) throw new Error("Empty response from Gemini.");
    
    const updates = JSON.parse(responseText);

    if (!Array.isArray(updates) || updates.length === 0) {
       return NextResponse.json({ status: "success", message: "Gemini didn't find items worth posting.", addedCount: 0 });
    }

    // 6. Batch Write
    const batch = db.batch();
    for (const update of updates) {
      const postRef = db.collection("posts").doc();
      batch.set(postRef, {
        ...update,
        published_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    return NextResponse.json({ 
      status: "success", 
      message: `Successfully added ${updates.length} new items from ${sourceName}.`,
      addedCount: updates.length
    });

  } catch (error: any) {
    console.error("Manual Source Sync Error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
