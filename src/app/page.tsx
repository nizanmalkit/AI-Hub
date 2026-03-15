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
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl heading-text mb-2">Curated Insights</h1>
          <p className="text-muted text-lg max-w-2xl">
            The most important developments in Artificial Intelligence, aggregated and summarized automatically by Gemini.
          </p>
        </div>
        
        {/* Sync Trigger action */}
        <SyncButton />
      </div>

      {/* Masonry Grid replacement (CSS Columns) */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="glass-card p-6 break-inside-avoid relative group">
            
            {/* Importance Badge */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-accent/40 border-2 border-primary">
               {post.importance_score}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-white/80 border border-white/10">
                <Tag className="w-3 h-3 text-accent" />
                {post.category}
              </span>
              <span className="text-xs text-muted/80">
                Score: {post.importance_score}/10
              </span>
            </div>

            <p className="text-white/90 leading-relaxed mb-6 font-medium text-sm md:text-base">
              {post.ai_summary}
            </p>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
               <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Source</span>
                  <span className="text-sm text-white/80 truncate max-w-[150px]">{post.source_name}</span>
               </div>
               
               <a 
                 href={post.original_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
               >
                 Original
                 <ExternalLink className="w-3 h-3" />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
