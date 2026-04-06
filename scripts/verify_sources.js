const fs = require('fs');
const admin = require('firebase-admin');

async function run() {
  try {
    const env = {};
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

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
        clientEmail: env['FIREBASE_CLIENT_EMAIL'],
        privateKey: env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n')
      })
    });

    const db = admin.firestore();

    console.log("--- 🕵️‍♂️ Verifying Sources & Scraping Status ---");

    const sourcesSnap = await db.collection('sources').get();
    console.log(`Total Sources configured: ${sourcesSnap.size}`);
    
    let activeCount = 0;
    sourcesSnap.forEach(doc => {
      const s = doc.data();
      if (s.is_active) activeCount++;
      console.log(`- [${s.is_active ? 'ACTIVE' : 'INACTIVE'}] ${s.name || 'Unknown'} (${s.url})`);
    });

    console.log(`\nActive Sources Total: ${activeCount}`);

  } catch (error) {
    console.error("Execution Error:", error);
  }
}

run();
