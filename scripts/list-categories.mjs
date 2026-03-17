import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Locate Service Account
const serviceAccountPath = path.resolve("C:/Users/nizan/.gemini/antigravity/scratch/AI-Hub/aihub-web/service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Credentials not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkCategories() {
  console.log("Reading posts...");
  const snapshot = await db.collection("posts").get();
  const categories = new Set();
  
  if (snapshot.empty) {
    console.log("No posts found in database.");
    return;
  }

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    categories.add(data.category);
  });

  console.log("\n📊 Active Categories in Firestore:");
  categories.forEach(c => console.log(`- ${c || "Empty/None"}`));
}

checkCategories().catch(console.error);
