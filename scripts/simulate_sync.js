const fs = require('fs');
const Parser = require('rss-parser');

const parser = new Parser();

const sources = [
  { name: 'Simon Willison Blog', url: 'https://simonwillison.net/atom/entries/' },
  { name: 'MIT Tech Review - AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml' },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'The Verge - AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' }
];

async function run() {
  console.log("--- 🛰️ Simulating Scrape Logic ---");
  
  const scrapedItems = [];
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

  console.log(`Current Time: ${new Date(now).toISOString()}`);
  console.log(`Checking items since: ${new Date(twentyFourHoursAgo).toISOString()}\n`);

  for (const source of sources) {
    console.log(`Scraping Source: ${source.name} (${source.url})`);
    try {
      const feed = await parser.parseURL(source.url);
      console.log(`  Items in feed: ${feed.items ? feed.items.length : 0}`);
      
      let sourceNewItems = 0;
      if (feed.items) {
        for (const item of feed.items) {
          const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
          if (pubDate >= twentyFourHoursAgo) {
            sourceNewItems++;
            scrapedItems.push({
              source_name: source.name,
              title: item.title,
              pubDate: new Date(pubDate).toISOString()
            });
          }
        }
      }
      console.log(`  -> New items found: ${sourceNewItems}`);
    } catch (error) {
      console.error(`  ❌ Failed to scrape ${source.name}:`, error.message);
    }
    console.log("");
  }

  console.log(`Total New Items across all sources: ${scrapedItems.length}`);
  if (scrapedItems.length > 0) {
    console.log("\nSample Items:");
    scrapedItems.slice(0, 5).forEach(item => {
      console.log(`- [${item.pubDate}] [${item.source_name}] ${item.title}`);
    });
  }
}

run();
