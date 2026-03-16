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
  "LLM Updates": "bg-red-50 text-red-700 border-red-200",
  "Tutorials": "bg-blue-50 text-blue-700 border-blue-200",
  "Policy": "bg-slate-100 text-slate-700 border-slate-200",
  "Open Source": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Default": "bg-gray-50 text-gray-700 border-gray-200"
};

const categoryIconColors: Record<string, string> = {
  "LLM Updates": "text-red-600",
  "Tutorials": "text-blue-600",
  "Policy": "text-slate-600",
  "Open Source": "text-emerald-600",
  "Default": "text-gray-600"
};

export default function PostGrid({ initialPosts }: { initialPosts: AIPost[] }) {
  const [sortOption, setSortOption] = useState<"score-desc" | "date-desc" | "date-asc">("score-desc");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [columns, setColumns] = useState<1 | 2 | 3>(3);

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
      
      {/* Modern Header Style Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wide text-slate-500">Topic:</span>
            <select 
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium text-slate-700"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wide text-slate-500">Sort:</span>
            <select 
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium text-slate-700"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
            >
              <option value="score-desc">Ranking</option>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Column Layout Switcher */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-semibold text-xs tracking-wide text-slate-500">Layout:</span>
          <div className="flex border border-slate-200 rounded-md overflow-hidden divide-x divide-slate-200">
            {[1, 2, 3].map((num) => (
              <button 
                key={num}
                onClick={() => setColumns(num as 1 | 2 | 3)}
                className={`px-3 py-1 text-[11px] font-bold transition-colors ${columns === num ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {num} Col
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="py-20 text-center border-t border-slate-200">
           <p className="text-slate-500">No headlines match the selected topic.</p>
        </div>
      ) : (
        <div className={`gap-8 space-y-6 ${
          columns === 1 
            ? "columns-1" 
            : columns === 2 
              ? "columns-1 md:columns-2" 
              : "columns-1 md:columns-2 lg:columns-3"
        }`}>
          {filteredAndSortedPosts.map((post) => {
            const colorClass = categoryColors[post.category] || categoryColors["Default"];
            let formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today";
            const isExpanded = expandedPosts[post.id] || false;

            return (
              <div key={post.id} className="glass-card break-inside-avoid relative flex flex-col h-full hover:border-indigo-600/30 group">
                
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                    {post.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formattedDate}
                  </span>
                </div>

                {/* Headline using Sans Font */}
                <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.original_title || "Aggregated Headlines"}
                </h3>

                {/* Summary with 3 line clamp */}
                <p className={`text-slate-600 leading-relaxed font-medium text-sm mb-2 ${isExpanded ? '' : 'line-clamp-3 overflow-hidden'}`}>
                  {post.ai_summary}
                </p>

                <button 
                  onClick={() => toggleExpand(post.id)}
                  className="text-xs font-bold text-indigo-600 hover:underline mb-4 flex items-center gap-1 text-left"
                >
                  {isExpanded ? 'Show Less ▴' : 'Read Summary ▾'}
                </button>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-slate-800">
                    {post.source_name}
                  </span>
                  <a 
                    href={post.original_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    Read
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Rank Indicator */}
                <div className="absolute top-0 right-0 font-black text-slate-100/80 text-3xl select-none group-hover:text-indigo-50 transition-colors -z-10 mt-2 mr-2">
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
