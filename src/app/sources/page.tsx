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
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl heading-text mb-3">Manage Sources</h1>
        <p className="text-gray-500 text-lg max-w-2xl font-medium">
          Configure the RSS feeds, YouTube channels, and Social media accounts that the AI monitors daily.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        
        {/* Source List */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-gray-900 pb-2 border-b border-gray-100">Active Sources ({sources.length})</h2>
          
          {sources.length === 0 ? (
            <div className="p-8 glass-card border-dashed text-center text-gray-500 font-medium">
              No sources found. Add your first source on the right.
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="glass-card p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors">
                      {getPlatformIcon(source.platform_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight mb-0.5">{source.name}</h3>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-500 hover:text-black transition-colors truncate max-w-[200px] md:max-w-md block">
                        {source.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${source.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{source.platform_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Source Form */}
        <div className="glass-card p-6 sticky top-24">
          <h2 className="text-base font-heading font-bold text-gray-900 flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Plus className="w-5 h-5 text-black" />
            Add New Source
          </h2>

          <form action={addSource} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-500">Source Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="e.g. AI Engineering Repo"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="url" className="text-xs font-bold uppercase tracking-widest text-gray-500">Endpoint URL</label>
              <input 
                type="url" 
                id="url" 
                name="url" 
                required 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="platform_type" className="text-xs font-bold uppercase tracking-widest text-gray-500">Platform Type</label>
              <select 
                id="platform_type" 
                name="platform_type" 
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:bg-white transition-all"
              >
                <option value="blog">Blog / RSS</option>
                <option value="youtube">YouTube Channel</option>
                <option value="podcast">Podcast Feed</option>
                <option value="social">Social Media Profile</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg shadow-sm border border-transparent hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              Add Source
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
