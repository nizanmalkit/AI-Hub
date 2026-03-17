import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";

export async function GET(request: Request) {
  try {
    const postsSnap = await db.collection("posts")
      .orderBy("published_at", "desc")
      .limit(100) // Lower bounds to avoid pulling entire DB
      .get();

    const timelineMap: { [key: string]: { date: string; posts: number; [key: string]: any } } = {};
    const keywordTally: { [key: string]: number } = {};
    const categoryTally: { [key: string]: number } = {};

    postsSnap.docs.forEach(doc => {
      const data = doc.data();
      const pubDate = data.published_at?.toDate() || new Date();
      const dateStr = pubDate.toISOString().split("T")[0]; // YYYY-MM-DD

      // 1. Timeline Tally
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, posts: 0 };
      }
      timelineMap[dateStr].posts += 1;

      // 2. Category Tally
      const cat = data.category || "General AI";
      categoryTally[cat] = (categoryTally[cat] || 0) + 1;

      // 3. Keyword Tally
      if (Array.isArray(data.keywords)) {
        data.keywords.forEach((kw: string) => {
          const cleanKw = kw.trim();
          if (cleanKw) {
            keywordTally[cleanKw] = (keywordTally[cleanKw] || 0) + 1;
          }
        });
      }
    });

    // Format Timeline in Chronological Order
    const timeline = Object.values(timelineMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Format Top Keywords as Array
    const topKeywords = Object.entries(keywordTally)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Format Categories as Array
    const categories = Object.entries(categoryTally)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      status: "success",
      data: {
        timeline,
        topKeywords,
        categories
      }
    });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
