const fs = require('fs');
const admin = require('firebase-admin');

async function run() {
  try {
    // 1. Parse .env.local
    const env = {};
    if (!fs.existsSync('.env.local')) {
      console.error(".env.local not found");
      process.exit(1);
    }
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

    const privateKey = env['FIREBASE_PRIVATE_KEY'];
    const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
    const projectId = env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];

    if (!privateKey || !clientEmail || !projectId) {
      console.error("Missing credentials in .env.local", { privateKey: !!privateKey, clientEmail: !!clientEmail, projectId: !!projectId });
      process.exit(1);
    }

    // 2. Initialize Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });

    const db = admin.firestore();

    console.log("--- 🕵️‍♂️ Verifying Cron Data ---");

    // 3. Query Subscribers
    const subscribersSnap = await db.collection('users')
      .where("emailNotifications", "==", true)
      .get();
    
    console.log(`Active Subscribers: ${subscribersSnap.size}`);
    subscribersSnap.forEach(doc => {
      const u = doc.data();
      console.log(`- ${u.email} (Language: ${u.language || 'en'})`);
    });

    // 4. Query Posts from Last 36 Hours (to cover this morning and yesterday)
    const now = Date.now();
    const thirtySixHoursAgo = new Date(now - 36 * 60 * 60 * 1000);
    
    console.log(`\nQuerying posts since: ${thirtySixHoursAgo.toISOString()}`);

    const postsSnap = await db.collection('posts')
      .where("published_at", ">=", thirtySixHoursAgo)
      .orderBy("published_at", "desc")
      .get();

    console.log(`Posts found in last 36h: ${postsSnap.size}`);
    postsSnap.forEach(doc => {
      const p = doc.data();
      const pubDate = p.published_at && p.published_at.toDate ? p.published_at.toDate().toISOString() : "Unknown";
      console.log(`- [${pubDate}] ${p.original_title || p.title_he}`);
    });

  } catch (error) {
    console.error("Execution Error:", error);
  }
}

run();
