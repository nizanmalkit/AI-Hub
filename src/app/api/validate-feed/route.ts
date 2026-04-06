import { NextRequest, NextResponse } from "next/server";

// Common RSS feed path patterns to try if the main URL isn't a valid feed
const RSS_PATH_PATTERNS = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml", "/blog/feed", "/blog/rss.xml", "/feed/rss", "/index.xml"];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ valid: false, message: "URL is required." }, { status: 400 });
    }

    // Try the provided URL first
    const result = await tryParseRSS(url);
    if (result.valid) {
      return NextResponse.json({ valid: true, message: `Valid feed: "${result.title}" (${result.itemCount} items)` });
    }

    // If the direct URL failed, try common RSS path patterns
    const baseUrl = url.replace(/\/+$/, ""); // trim trailing slashes
    for (const pattern of RSS_PATH_PATTERNS) {
      const candidateUrl = baseUrl + pattern;
      const candidateResult = await tryParseRSS(candidateUrl);
      if (candidateResult.valid) {
        return NextResponse.json({
          valid: false,
          suggestedUrl: candidateUrl,
          message: `The URL you provided isn't a valid RSS feed, but we found one at: ${candidateUrl} ("${candidateResult.title}", ${candidateResult.itemCount} items)`
        });
      }
    }

    // Nothing worked
    return NextResponse.json({
      valid: false,
      message: "Could not find a valid RSS/Atom feed at this URL or any common feed paths. Please provide a direct RSS/Atom feed URL."
    });
  } catch (error) {
    console.error("Validate feed error:", error);
    return NextResponse.json({ valid: false, message: "Server error during validation." }, { status: 500 });
  }
}

async function tryParseRSS(url: string): Promise<{ valid: boolean; title?: string; itemCount?: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AI-Hub-Feed-Validator/1.0" }
    });
    clearTimeout(timeout);

    if (!res.ok) return { valid: false };

    const text = await res.text();

    // Quick heuristic: valid RSS/Atom feeds contain these XML markers
    const isRSS = text.includes("<rss") || text.includes("<feed") || text.includes("<channel>");
    if (!isRSS) return { valid: false };

    // Extract title
    const titleMatch = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "Untitled Feed";

    // Count items
    const itemCount = (text.match(/<item[\s>]/gi) || []).length + (text.match(/<entry[\s>]/gi) || []).length;

    return { valid: true, title, itemCount };
  } catch {
    return { valid: false };
  }
}
