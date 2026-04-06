import Parser from 'rss-parser';

const parser = new Parser();

const urls = [
  'https://deepmind.com/blog/feed/basic/',
  'https://huggingface.co/blog/feed.xml',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCY6K6p_6Y146743J6_aX5xQ',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg'
];

async function test() {
  const now = Date.now();
  const threeDaysAgo = now - (72 * 60 * 60 * 1000);
  console.log(`Now: ${new Date(now).toISOString()}`);
  console.log(`72h ago: ${new Date(threeDaysAgo).toISOString()}`);

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    try {
      const feed = await parser.parseURL(url);
      console.log(`  Success! Total items: ${feed.items.length}`);
      const latestItem = feed.items[0];
      const pubDate = latestItem.pubDate ? new Date(latestItem.pubDate).getTime() : now;
      console.log(`  Latest item date: ${new Date(pubDate).toISOString()}`);
      
      const newItems = feed.items.filter(item => {
        const d = item.pubDate ? new Date(item.pubDate).getTime() : now;
        return d >= threeDaysAgo;
      });
      console.log(`  New items (last 72h): ${newItems.length}`);
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
}

test();
