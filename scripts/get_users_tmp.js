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

    // 3. Query Users
    const snap = await db.collection('users').get();
    const users = [];
    snap.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Execution Error:", error);
  }
}

run();
