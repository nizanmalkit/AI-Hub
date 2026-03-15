import { adminDb as db } from "@/utils/firebase/admin";
import { revalidatePath } from "next/cache";
import { Globe, Youtube, Rss, Plus } from "lucide-react";

type Source = {
  id: string;
  name: string;
  url: string;
  platform_type: "blog" | "youtube" | "podcast" | "social";
  is_active: boolean;
  added_by: string;
};

// Next.js Server Action to add a source securely
async function addSource(formData: FormData) {
  "use server";
  
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const platform_type = formData.get("platform_type") as string;

  if (!name || !url || !platform_type) return;

  await db.collection("sources").add({
    name,
    url,
    platform_type,
    is_active: true,
    created_at: new Date(),
    added_by: "manual",
  });

  revalidatePath("/sources");
}

async function getSources(): Promise<Source[]> {
  try {
    const snapshot = await db.collection("sources").orderBy("name", "asc").get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Source[];
  } catch (e) {
    // console.log("Failed to fetch sources, falling back to empty list due to missing credentials");
    return [];
  }
}

export default async function SourcesPage() {
  const sources = await getSources();

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case "youtube": return <Youtube className="w-4 h-4 text-red-500" />;
      case "blog":
      case "podcast": return <Rss className="w-4 h-4 text-orange-500" />;
      default: return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl heading-text mb-2">Manage Sources</h1>
        <p className="text-muted text-lg">
          Configure the RSS feeds, YouTube channels, and Social media accounts that the AI monitors daily.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        
        {/* Source List */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-white/90">Active Sources ({sources.length})</h2>
          
          {sources.length === 0 ? (
            <div className="p-8 glass-card text-center text-muted">
              No sources found. Add your first source on the right.
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="glass-card p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                      {getPlatformIcon(source.platform_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">{source.name}</h3>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-accent transition-colors truncate max-w-[200px] md:max-w-md block">
                        {source.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${source.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-muted/60 uppercase">{source.platform_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Source Form */}
        <div className="glass-card p-6 sticky top-24">
          <h2 className="text-lg font-heading font-semibold text-white/90 flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-accent" />
            Add New Source
          </h2>

          <form action={addSource} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-white/70">Source Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                className="w-full bg-primary/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-muted/50"
                placeholder="e.g. AI Engineering Repo"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="url" className="text-sm font-medium text-white/70">Endpoint URL</label>
              <input 
                type="url" 
                id="url" 
                name="url" 
                required 
                className="w-full bg-primary/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-muted/50"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="platform_type" className="text-sm font-medium text-white/70">Platform Type</label>
              <select 
                id="platform_type" 
                name="platform_type" 
                required
                className="w-full bg-primary/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none"
              >
                <option value="blog">Blog / RSS</option>
                <option value="youtube">YouTube Channel</option>
                <option value="podcast">Podcast Feed</option>
                <option value="social">Social Media Profile</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full mt-2 bg-gradient-to-r from-accent to-purple-600 hover:from-accent/90 hover:to-purple-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              Add Source
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
