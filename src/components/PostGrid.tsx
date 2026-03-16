"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Tag, Calendar, ArrowUpDown, Filter } from "lucide-react";

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
};

// Map categories to specific accent colors to make the UI less boring
const categoryColors: Record<string, string> = {
  "LLM Updates": "bg-blue-100 text-blue-700 border-blue-200",
  "Tutorials": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Policy": "bg-amber-100 text-amber-700 border-amber-200",
  "Open Source": "bg-purple-100 text-purple-700 border-purple-200",
  "Default": "bg-gray-100 text-gray-700 border-gray-200"
};

const categoryIconColors: Record<string, string> = {
  "LLM Updates": "text-blue-600",
  "Tutorials": "text-emerald-600",
  "Policy": "text-amber-600",
  "Open Source": "text-purple-600",
  "Default": "text-gray-600"
};

export default function PostGrid({ initialPosts }: { initialPosts: AIPost[] }) {
  const [sortOption, setSortOption] = useState<"score-desc" | "date-desc" | "date-asc">("score-desc");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Get unique categories for the filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(initialPosts.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [initialPosts]);

  // Apply filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...initialPosts];

    // Filter
    if (filterCategory !== "All") {
      result = result.filter(p => p.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === "score-desc") {
        return b.importance_score - a.importance_score;
      }
      
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      
      if (sortOption === "date-desc") return dateB - dateA;
      if (sortOption === "date-asc") return dateA - dateB;
      
      return 0;
    });

    return result;
  }, [initialPosts, sortOption, filterCategory]);

  return (
    <div className="space-y-6">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-widest text-[10px]">Filter</span>
          <select 
            className="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium text-gray-800"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-widest text-[10px]">Sort by</span>
          <select 
            className="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium text-gray-800"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
          >
            <option value="score-desc">Highest Score</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
        </div>

      </div>

      {/* Grid */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="py-20 text-center glass-card border-dashed">
           <p className="text-gray-500 font-medium">No insights match the selected filters.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredAndSortedPosts.map((post) => {
            const colorClass = categoryColors[post.category] || categoryColors["Default"];
            const iconColorClass = categoryIconColors[post.category] || categoryIconColors["Default"];
            
            // Format Date safely
            let formattedDate = "Unknown Date";
            if (post.published_at) {
              formattedDate = new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            return (
              <div key={post.id} className="glass-card p-6 break-inside-avoid relative group flex flex-col h-full hover:-translate-y-1">
                
                {/* Importance Badge */}
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white ${post.importance_score >= 9 ? 'bg-indigo-600 text-white' : 'bg-black text-white'}`}>
                  {post.importance_score}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${colorClass}`}>
                    <Tag className={`w-3.5 h-3.5 ${iconColorClass}`} />
                    {post.category}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
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
            )
          })}
        </div>
      )}
    </div>
  );
}
