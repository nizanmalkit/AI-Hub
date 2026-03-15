import { adminDb as db } from "@/utils/firebase/admin"; // We use admin to fetch server-side
import SyncButton from "@/components/SyncButton";
import { ExternalLink, Tag } from "lucide-react";

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

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="glass-card p-6 break-inside-avoid relative group flex flex-col h-full">
            
            {/* Importance Badge */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">
               {post.importance_score}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-700 border border-gray-200">
                <Tag className="w-3.5 h-3.5 text-black" />
                {post.category}
              </span>
              <span className="text-xs font-medium text-gray-500">
                Score: {post.importance_score}/10
              </span>
            </div>

            <p className="text-gray-800 leading-relaxed mb-8 font-medium text-base">
              {post.ai_summary}
            </p>

            <div className="pt-5 border-t border-gray-100 flex items-center justify-between mt-auto">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Source</span>
                  <span className="text-sm text-gray-900 font-semibold truncate max-w-[150px]">{post.source_name}</span>
               </div>
               
               <a 
                 href={post.original_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors flex items-center gap-2 text-xs font-semibold border border-gray-200"
               >
                 Original
                 <ExternalLink className="w-3.5 h-3.5" />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
