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
  published_at: FirebaseFirestore.Timestamp;
  source_name?: string; // Hydrated
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
    published_at: { toDate: () => new Date() } as any,
    source_name: "Google AI Blog"
  },
  {
    id: "2",
    source_id: "s2",
    original_title: "How to master RAG architectures",
    original_url: "https://youtube.com/watch",
    ai_summary: "A deep dive into advanced Retreival-Augmented Generation techniques. The speaker explains how to handle semantic chunking effectively. Great insights for reducing hallucination rates in production.",
    category: "Tutorials",
    importance_score: 8,
    published_at: { toDate: () => new Date(Date.now() - 86400000) } as any,
    source_name: "AI Engineering YouTube"
  },
    {
    id: "3",
    source_id: "s3",
    original_title: "The State of AI Act Compliance",
    original_url: "https://techpolicy.com",
    ai_summary: "The EU AI Act officially comes into force, introducing strict compliance tiers. Startups are given a 12-month grace period to classify their risk models. Fines for non-compliance can reach up to 7% of global revenue.",
    category: "Policy",
    importance_score: 9,
    published_at: { toDate: () => new Date(Date.now() - 172800000) } as any,
    source_name: "Tech Policy Tracker"
  }
];


async function getPosts(): Promise<AIPost[]> {
  try {
    const postsSnapshot = await db.collection("posts")
      .orderBy("importance_score", "desc")
      .limit(20)
      .get();
      
    if (postsSnapshot.empty) return dummyPosts;

    const posts = [];
    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      // Hydrate source name
      let sourceName = "Unknown Source";
      if (data.source_id) {
         const sourceDoc = await db.collection("sources").doc(data.source_id).get();
         if (sourceDoc.exists) sourceName = sourceDoc.data()?.name || "Unknown Source";
      }

      posts.push({
        id: doc.id,
        ...data,
        source_name: sourceName
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
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl heading-text mb-3">Curated Insights</h1>
          <p className="text-gray-500 text-lg max-w-2xl font-medium">
            The most important developments in Artificial Intelligence, aggregated and summarized automatically by Gemini.
          </p>
        </div>
        
        {/* Sync Trigger action */}
        <SyncButton />
      </div>

      {/* Dynamic Grid with Sort & Filter */}
      <PostGrid initialPosts={posts} />
    </div>
  );
}
