const admin = require('firebase-admin');

// Initialize Firebase Admin (uses same logic as sync_cron)
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-hub-76eca";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

if (!privateKey || !clientEmail) {
  // Try fallback to local file reading if needed, but in this setup we assume env works for temporary runs if populated.
  console.error("Missing credentials for admin. Please ensure env vars are loaded.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey
  })
});

const db = admin.firestore();

async function check() {
  const activeSubscribersSnap = await db.collection("users")
    .where("emailNotifications", "==", true)
    .get();

  console.log(`\nFound ${activeSubscribersSnap.size} subscribers with emailNotifications: true`);
  
  activeSubscribersSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Email: ${data.email || 'N/A'}, Language: ${data.language || 'en'}`);
  });
}

check();
