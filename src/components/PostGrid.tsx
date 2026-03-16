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
// Map categories to distinct minimal colors
const categoryColors: Record<string, string> = {
  "LLM Updates": "border-red-600 text-red-700",
  "Tutorials": "border-blue-600 text-blue-700",
  "Policy": "border-black text-black",
  "Open Source": "border-emerald-600 text-emerald-700",
  "Default": "border-gray-500 text-gray-500"
};

const categoryIconColors: Record<string, string> = {
  "LLM Updates": "text-red-600",
  "Tutorials": "text-blue-600",
  "Policy": "text-black",
  "Open Source": "text-emerald-600",
  "Default": "text-gray-600"
};

export default function PostGrid({ initialPosts }: { initialPosts: AIPost[] }) {
  const [sortOption, setSortOption] = useState<"score-desc" | "date-desc" | "date-asc">("score-desc");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = useMemo(() => {
    const cats = new Set(initialPosts.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [initialPosts]);

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...initialPosts];
    if (filterCategory !== "All") result = result.filter(p => p.category === filterCategory);
    result.sort((a, b) => {
      if (sortOption === "score-desc") return b.importance_score - a.importance_score;
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      if (sortOption === "date-desc") return dateB - dateA;
      if (sortOption === "date-asc") return dateA - dateB;
      return 0;
    });
    return result;
  }, [initialPosts, sortOption, filterCategory]);

  return (
    <div className="space-y-8">
      
      {/* Newspaper Header Style Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-black pb-4">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-xs uppercase tracking-wider">Filter News</span>
          <select 
            className="text-xs bg-transparent border-b border-black px-1 py-0.5 focus:outline-none focus:border-red-600 font-medium text-gray-900"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-xs uppercase tracking-wider">Sort By</span>
          <select 
            className="text-xs bg-transparent border-b border-black px-1 py-0.5 focus:outline-none focus:border-red-600 font-medium text-gray-900"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
          >
            <option value="score-desc">Ranking</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="py-20 text-center border-t border-black">
           <p className="font-serif text-gray-500">No headlines match the selected topic.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-6">
          {filteredAndSortedPosts.map((post) => {
            const colorClass = categoryColors[post.category] || categoryColors["Default"];
            let formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today";
            const isExpanded = expandedPosts[post.id] || false;

            return (
              <div key={post.id} className="glass-card break-inside-avoid relative flex flex-col h-full hover:bg-red-50/20 group">
                
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${colorClass}`}>
                    {post.category}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500">
                    {formattedDate}
                  </span>
                </div>

                {/* Headline using Serif Font */}
                <h3 className="font-serif font-black text-xl text-black leading-snug mb-3">
                  {post.original_title || "Aggregated Headlines"}
                </h3>

                {/* Summary with 3 line clamp */}
                <p className={`text-gray-800 leading-relaxed mb-1 font-medium text-sm ${isExpanded ? '' : 'line-clamp-3 overflow-hidden'}`}>
                  {post.ai_summary}
                </p>

                <button 
                  onClick={() => toggleExpand(post.id)}
                  className="text-[9px] font-black uppercase tracking-wider text-red-600 hover:underline mb-4 flex items-center gap-1 text-left"
                >
                  {isExpanded ? 'Show Less ▴' : 'Read Summary ▾'}
                </button>

                <div className="pt-3 border-t border-dotted border-gray-300 flex items-baseline justify-between mt-auto">
                  <span className="text-[10px] font-bold text-gray-600 tracking-wide">
                    {post.source_name}
                  </span>
                  <a 
                    href={post.original_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-wider text-black hover:text-red-600 flex items-center gap-1"
                  >
                    Read
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Rank Indicator */}
                <div className="absolute top-0 right-0 font-serif font-black text-gray-200 text-3xl select-none group-hover:text-red-100 transition-colors -z-10 mt-1">
                  #{post.importance_score}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
