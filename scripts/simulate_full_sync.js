const fs = require('fs');
const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');

const parser = new Parser();

const sources = [
  { id: 'simon', name: 'Simon Willison Blog', url: 'https://simonwillison.net/atom/entries/' },
  { id: 'mit', name: 'MIT Tech Review - AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' },
  { id: 'vb', name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { id: 'openai', name: 'OpenAI News', url: 'https://openai.com/news/rss.xml' },
  { id: 'ars', name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/ai/feed/' },
  { id: 'theverge', name: 'The Verge - AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { id: 'tc', name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' }
];

async function run() {
  console.log("--- 🕵️‍♂️ Simulating FULL Sync (Scrape + Gemini) ---");

  // 1. Load Env
  const env = {};
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        env[key.trim()] = value;
      }
    });
  } catch (e) {
    console.error("Failed to read .env.local", e);
    return;
  }

  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env.local");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. Scrape
  const scrapedItems = [];
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

  console.log(`Checking items since: ${new Date(twentyFourHoursAgo).toISOString()}\n`);

  for (const source of sources) {
    console.log(`Scraping: ${source.name}`);
    try {
      const feed = await parser.parseURL(source.url);
      if (feed.items) {
        for (const item of feed.items) {
          const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
          if (pubDate >= twentyFourHoursAgo) {
            scrapedItems.push({
              source_id: source.id,
              source_name: source.name,
              title: item.title || "No Title",
              description: item.summary || item.contentSnippet || item.content || "",
              link: item.link || source.url,
              pubDate: new Date(pubDate).toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to Scraped ${source.name}:`, error.message);
    }
  }

  console.log(`\nTotal Scraped Items: ${scrapedItems.length}`);

  if (scrapedItems.length === 0) {
    console.log("No new items found. Exiting.");
    return;
  }

  console.log("Processing with Gemini...");

  const prompt = `
  You are an expert AI aggregator. Below are the latest updates from various tech sources fetched in the last 24 hours.
  
  Your task is to:
  1. Read all updates.
  2. Group related items together.
  3. Select at most the TOP 5 most useful/significant developments.
  4. For each selected item, write a 3-sentence summary in English.
  5. Categorize into: "LLM Updates", "Tutorials", "Policy", "Open Source", or "General AI".
  6. Score importance (1 to 10).
  7. Extract at least 3-5 keywords or tags describing exact topics.
  8. Provide accurate Hebrew translations for BOTH the Title and the 3-sentence summary.
  
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

    const text = aiResponse.text;
    console.log("\n--- 🤖 Gemini Response Output ---");
    console.log(text);

    const parsed = JSON.parse(text);
    console.log(`\nSuccessfully parsed ${parsed.length} curated updates from Gemini.`);

    fs.writeFileSync('scripts/output_simulate.json', JSON.stringify(parsed, null, 2));
    console.log("Saved output to scripts/output_simulate.json");

  } catch (error) {
    console.error("\n❌ Gemini Error or Parse Issue:", error);
  }
}

run();
