import { adminDb as db } from "@/utils/firebase/admin";
import SyncButton from "@/components/SyncButton";
import PostGrid from "@/components/PostGrid";

// Types matching the PRD Schema
type AIPost = {
  id: string;
  source_id: string;
  original_title: string;
  original_url: string;
  ai_summary: string;
  category: string;
  importance_score: number;
  published_at: string;
  source_name?: string;
  source_type?: string;
};

export const revalidate = 60; // Revalidate page every 60 seconds

// Dummy fallback data if Firestore is empty
const dummyPosts: AIPost[] = [
  {
    id: "1",
    source_id: "s1",
    original_title: "Gemini 1.5 Pro Available Globally",
    original_url: "https://blog.google/technology/ai",
    ai_summary: "Google announced that Gemini 1.5 Pro is now available to all developers in 200+ countries. It features a massive 2 million token context window. This marks a significant leap in large-scale context processing for enterprise apps.",
    category: "LLM Updates",
    importance_score: 10,
    published_at: new Date().toISOString(),
    source_name: "Google AI Blog",
    source_type: "blog"
  },
  {
    id: "2",
    source_id: "s2",
    original_title: "How to master RAG architectures",
    original_url: "https://youtube.com/watch",
    ai_summary: "A deep dive into advanced Retreival-Augmented Generation techniques. The speaker explains how to handle semantic chunking effectively. Great insights for reducing hallucination rates in production.",
    category: "Tutorials",
    importance_score: 8,
    published_at: new Date(Date.now() - 86400000).toISOString(),
    source_name: "AI Engineering YouTube",
    source_type: "youtube"
  },
  {
    id: "3",
    source_id: "s3",
    original_title: "The State of AI Act Compliance",
    original_url: "https://techpolicy.com",
    ai_summary: "The EU AI Act officially comes into force, introducing strict compliance tiers. Startups are given a 12-month grace period to classify their risk models. Fines for non-compliance can reach up to 7% of global revenue.",
    category: "Policy",
    importance_score: 9,
    published_at: new Date(Date.now() - 172800000).toISOString(),
    source_name: "Tech Policy Tracker",
    source_type: "blog"
  }
];


async function getPosts(): Promise<AIPost[]> {
  try {
    const postsSnapshot = await db.collection("posts")
      .orderBy("published_at", "desc")
      .limit(60)
      .get();
      
    if (postsSnapshot.empty) return dummyPosts;

    const posts = [];
    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      if (data.archived === true) continue; // Skip archived posts

      let sourceName = "Unknown Source";
      let sourceType = "blog";

      if (data.source_id) {
         const sourceDoc = await db.collection("sources").doc(data.source_id).get();
         if (sourceDoc.exists) {
            const sData = sourceDoc.data();
            sourceName = sData?.name || "Unknown Source";
            sourceType = sData?.type || "blog";
         }
      }

      posts.push({
        id: doc.id,
        ...data,
        published_at: data.published_at?.toDate ? data.published_at.toDate().toISOString() : new Date().toISOString(),
        source_name: sourceName,
        source_type: sourceType
      } as AIPost);
    }
    return posts;
  } catch (e) {
    // Silently fall back to dummy data in development if credentials aren't set
    // console.log("Error fetching posts, falling back to dummy data");
    return dummyPosts;
  }
}

export default async function Dashboard() {
  const posts = await getPosts();

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Dynamic Grid with Sort & Filter */}
      <PostGrid initialPosts={posts} />
    </div>
  );
}
