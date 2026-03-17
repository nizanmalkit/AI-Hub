"use client";

import { useState, useMemo, useEffect } from "react";
import { ExternalLink, Tag, Calendar, ArrowUpDown, Filter, Heart, Search, Archive } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/utils/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useLanguage } from "@/context/LanguageContext";

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
  title_he?: string;
  ai_summary_he?: string;
};

// Map categories to distinct minimal colors
const categoryColors: Record<string, string> = {
  "LLM Updates": "bg-red-50 text-red-700 border-red-200",
  "Tutorials": "bg-blue-50 text-blue-700 border-blue-200",
  "Policy": "bg-slate-100 text-slate-700 border-slate-200",
  "Open Source": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Default": "bg-gray-50 text-gray-700 border-gray-200"
};

export default function PostGrid({ initialPosts }: { initialPosts: AIPost[] }) {
  const [sortOption, setSortOption] = useState<"score-desc" | "date-desc" | "date-asc">("date-desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [columns, setColumns] = useState<1 | 2 | 3>(3);
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchivedOnly, setShowArchivedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Fetch Bookmarks on mount
  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    async function fetchBookmarks() {
      try {
        const uid = user?.uid;
        if (!uid) return;
        
        const docRef = doc(db, "users", uid, "settings", "bookmarks");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSavedIds(docSnap.data().savedIds || []);
        }
      } catch (error) {
        console.warn("No bookmarks found yet.");
      }
    }
    fetchBookmarks();
  }, [user]);

  // Fetch Archived on mount
  useEffect(() => {
    if (!user) {
      setArchivedIds([]);
      return;
    }
    async function fetchArchived() {
      try {
        const uid = user?.uid;
        if (!uid) return;

        const docRef = doc(db, "users", uid, "settings", "archived");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArchivedIds(docSnap.data().archivedIds || []);
        }
      } catch (error) {
        console.warn("No archives found yet.");
      }
    }
    fetchArchived();
  }, [user]);

  const handleToggleBookmark = async (postId: string) => {
    if (!user) return alert("Please sign in to save bookmarks!");

    const isBookmarked = savedIds.includes(postId);
    const newSaved = isBookmarked 
      ? savedIds.filter(id => id !== postId) 
      : [...savedIds, postId];

    setSavedIds(newSaved);

    try {
      const docRef = doc(db, "users", user.uid, "settings", "bookmarks");
      await setDoc(docRef, { savedIds: newSaved }, { merge: true });
    } catch (error) {
      console.error("Failed to update bookmark:", error);
    }
  };

  const handleToggleArchived = async (postId: string) => {
    if (!user) return alert("Please sign in to archive items!");

    const isArchived = archivedIds.includes(postId);
    const newArchived = isArchived 
      ? archivedIds.filter(id => id !== postId) 
      : [...archivedIds, postId];

    setArchivedIds(newArchived);

    try {
      const docRef = doc(db, "users", user.uid, "settings", "archived");
      await setDoc(docRef, { archivedIds: newArchived }, { merge: true });
    } catch (error) {
      console.error("Failed to update archive:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const categories = ["LLM Updates", "Tutorials", "Policy", "Open Source"];
  const sourceTypes = ["blog", "youtube", "podcast", "social"];

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...initialPosts];

    // Filter by Archived status first
    if (showArchivedOnly) {
      result = result.filter(p => archivedIds.includes(p.id));
    } else {
      result = result.filter(p => !archivedIds.includes(p.id));
    }

    if (showSavedOnly) {
      result = result.filter(p => savedIds.includes(p.id));
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    if (selectedTypes.length > 0) {
      result = result.filter(p => selectedTypes.includes(p.source_type || "blog"));
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const title = (language === "he" && p.title_he ? p.title_he : p.original_title).toLowerCase();
        const summary = (language === "he" && p.ai_summary_he ? p.ai_summary_he : p.ai_summary).toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

    result.sort((a, b) => {
      if (sortOption === "score-desc") return b.importance_score - a.importance_score;
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      if (sortOption === "date-desc") return dateB - dateA;
      if (sortOption === "date-asc") return dateA - dateB;
      return 0;
    });
    return result;
  }, [initialPosts, sortOption, selectedCategories, selectedTypes, showSavedOnly, savedIds, archivedIds, showArchivedOnly, searchQuery, language]);
  
  const featuredPost = useMemo(() => {
    if (filteredAndSortedPosts.length === 0) return null;
    const sortedByScore = [...filteredAndSortedPosts].sort((a, b) => {
      if (b.importance_score !== a.importance_score) {
        return b.importance_score - a.importance_score;
      }
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
    return sortedByScore[0];
  }, [filteredAndSortedPosts]);

  const gridPosts = useMemo(() => {
    if (!featuredPost) return filteredAndSortedPosts;
    return filteredAndSortedPosts.filter(p => p.id !== featuredPost.id);
  }, [filteredAndSortedPosts, featuredPost]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center border-b border-slate-200 pb-2 mb-4">
        <h1 className="text-sm font-bold uppercase tracking-wider text-slate-800">{t("headlineFeed")}</h1>
      </div>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                showFilters || (selectedCategories.length + selectedTypes.length + (showSavedOnly ? 1 : 0)) > 0 
                  ? "bg-[#006c49]/10 border-[#006c49]/30 text-[#005f40] font-bold" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {t("filters")} {(selectedCategories.length + selectedTypes.length + (showSavedOnly ? 1 : 0)) > 0 && `(${selectedCategories.length + selectedTypes.length + (showSavedOnly ? 1 : 0)})`}
            </button>

            <div className="flex items-center gap-2 h-5 border-l border-slate-200 pl-3">
              <span className="font-semibold text-xs tracking-wide text-slate-400">{t("sort")}:</span>
              <select 
                className="text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] font-medium text-slate-700"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
              >
                <option value="score-desc">{t("ranking")}</option>
                <option value="date-desc">{t("newestFirst")}</option>
                <option value="date-asc">{t("oldestFirst")}</option>
              </select>
            </div>
          </div>

          {/* Live Search Input */}
          <div className="flex items-center gap-2 relative w-full md:max-w-xs">
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#006c49] focus:bg-white text-slate-800 shadow-sm transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wide text-slate-400">{t("layout")}:</span>
            <div className="flex border border-slate-200 rounded-md overflow-hidden divide-x divide-slate-200">
              {[1, 2, 3].map((num) => (
                <button 
                  key={num}
                  onClick={() => setColumns(num as 1 | 2 | 3)}
                  className={`px-3 py-1 text-[11px] font-bold transition-colors ${columns === num ? 'bg-[#006c49] text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {num} {t("cols")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-3 bg-slate-50/80 border border-slate-100 rounded-xl p-3 mt-1 shadow-sm">
            <div className="flex items-center gap-3 w-full min-w-0">
              <span className="font-semibold text-xs tracking-wide text-slate-500 w-12 flex-shrink-0">{t("topics")}:</span>
              <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0 no-scrollbar">
                <button 
                  onClick={() => setSelectedCategories([])}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                    selectedCategories.length === 0 ? "bg-[#006c49] border-[#006c49] text-white font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t("all")}
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button 
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${isSelected ? "bg-[#006c49] border-[#006c49] text-white font-bold shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full min-w-0">
              <span className="font-semibold text-xs tracking-wide text-slate-500 w-12 flex-shrink-0">{t("types")}:</span>
              <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0 no-scrollbar">
                <button 
                  onClick={() => setSelectedTypes([])}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${selectedTypes.length === 0 ? "bg-slate-900 border-slate-900 text-white font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {t("all")}
                </button>
                {sourceTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button 
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all capitalize whitespace-nowrap ${isSelected ? "bg-[#006c49] border-[#006c49] text-white font-bold shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <span className="font-semibold text-xs tracking-wide text-slate-500 w-12 flex-shrink-0">{t("personal")}:</span>
                <button 
                  onClick={() => { setShowSavedOnly(!showSavedOnly); if (showArchivedOnly) setShowArchivedOnly(false); }}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all whitespace-nowrap ${showSavedOnly ? 'bg-pink-50 border-pink-200 text-pink-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}`} />
                  {t("savedOnly")}
                </button>

                <button 
                  onClick={() => { setShowArchivedOnly(!showArchivedOnly); if (showSavedOnly) setShowSavedOnly(false); }}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all whitespace-nowrap ${showArchivedOnly ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Archive className={`w-3.5 h-3.5 ${showArchivedOnly ? 'text-amber-600' : 'text-slate-400'}`} />
                  Archived Only
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="py-20 text-center border-t border-slate-200">
           <p className="text-slate-500">{t("noPosts")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Post */}
          {(() => {
            const post = featuredPost;
            if (!post) return null;
            
            const colorClass = categoryColors[post.category] || categoryColors["Default"];
            let formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today";
            const isExpanded = expandedPosts[post.id] || false;
            const isSaved = savedIds.includes(post.id);

            return (
              <div key={`featured-${post.id}`} className="flex flex-col bg-white p-6 md:p-8 rounded-xl border border-slate-100/80 shadow-sm mb-8 space-y-3 transition-all group max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-[#006c49] tracking-wider">{t("topics")} / {post.category}</span>
                    <span className="text-[9px] font-bold text-white bg-[#006c49] px-1.5 py-0.5 rounded-md shadow-sm">
                      {post.importance_score}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">{formattedDate}</span>
                    {user && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleBookmark(post.id)} className="p-1 rounded-md hover:bg-slate-100 transition-colors" title={isSaved ? "Remove bookmark" : "Save to bookmarks"}>
                          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-pink-500 text-pink-500 scale-110' : 'text-slate-300'}`} />
                        </button>
                        <button onClick={() => handleToggleArchived(post.id)} className="p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-300 hover:text-amber-600" title="Archive">
                          <Archive className={`w-3.5 h-3.5 ${archivedIds.includes(post.id) ? 'text-amber-600 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="font-bold text-xl md:text-2xl text-slate-900 leading-tight mb-1 group-hover:text-[#006c49] transition-colors">
                  {language === "he" && post.title_he ? post.title_he : post.original_title || "Aggregated Headlines"}
                </h2>

                <p className="text-slate-600 leading-relaxed font-normal text-sm mb-3">
                  {language === "he" && post.ai_summary_he ? post.ai_summary_he : post.ai_summary}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 tracking-tight">{post.source_name}</span>
                  <a href={post.original_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-[#006c49]/10 transition-colors text-slate-400 hover:text-[#006c49]">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Standard Posts Grid */}
          <div className={`gap-8 space-y-6 ${columns === 1 ? "columns-1" : columns === 2 ? "columns-1 md:columns-2" : "columns-1 md:columns-2 lg:columns-3"}`}>
            {gridPosts.map((post) => {
              const colorClass = categoryColors[post.category] || categoryColors["Default"];
              let formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today";
              const isExpanded = expandedPosts[post.id] || false;
              const isSaved = savedIds.includes(post.id);

              return (
                <div key={post.id} className="break-inside-avoid relative flex flex-col bg-transparent p-4 border-b border-slate-100/60 pb-6 rounded-none shadow-none space-y-2 hover:bg-white hover:rounded-xl hover:shadow-sm transition-all duration-200 group mb-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {post.category}
                      </span>
                      <span className="text-[9px] font-bold text-white bg-[#006c49] px-1.5 py-0.5 rounded-md shadow-sm">
                        {post.importance_score}/10
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formattedDate}
                      </span>
                      {user && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleToggleBookmark(post.id)} 
                          className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title={isSaved ? "Remove bookmark" : "Save to bookmarks"}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-all ${isSaved ? 'fill-pink-500 text-pink-500 scale-110' : 'text-slate-300 hover:text-slate-400'}`} />
                        </button>
                        
                        <button 
                          onClick={() => handleToggleArchived(post.id)} 
                          className="p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-300 hover:text-amber-600"
                          title="Archive"
                        >
                          <Archive className={`w-3.5 h-3.5 transition-all ${archivedIds.includes(post.id) ? 'text-amber-600 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 group-hover:text-[#006c49] transition-colors">
                    {language === "he" && post.title_he ? post.title_he : post.original_title || "Aggregated Headlines"}
                    </h3>

                  <p className={`text-slate-600 leading-relaxed font-semibold text-xs mb-2 ${isExpanded ? '' : 'line-clamp-3 overflow-hidden'}`}>
                    {language === "he" && post.ai_summary_he ? post.ai_summary_he : post.ai_summary}
                  </p>

                  <button 
                    onClick={() => toggleExpand(post.id)} 
                    className={`text-xs font-bold text-[#006c49] hover:underline mb-4 flex items-center gap-1 ${language === 'he' ? 'text-right' : 'text-left'}`}
                  >
                    {isExpanded ? `${t("showLess")} ▴` : `${t("readSummary")} ▾`}
                  </button>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-black text-slate-800 tracking-tight">
                      {post.source_name}
                    </span>
                    <a href={post.original_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-[#006c49]/10 transition-colors text-slate-400 hover:text-[#006c49]">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
