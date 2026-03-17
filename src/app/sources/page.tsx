"use client";

import { useState, useEffect } from "react";
import { db } from "@/utils/firebase/client"; 
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { Trash2, Plus, Globe, Rss, Tv, Music, ToggleLeft, ToggleRight, ExternalLink, FileUp } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type SourceItem = {
  id: string;
  name: string;
  url: string;
  type: string;
  status: "active" | "inactive";
  created_at?: any;
};

const typeIcons: Record<string, any> = {
  blog: Rss,
  youtube: Tv,
  podcast: Music,
  social: Globe,
  default: Globe
};

export default function SourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== "nizanmalkit@gmail.com")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{message: string; type: "success" | "error"} | null>(null);

  // Sorting State
  const [sortBy, setSortBy] = useState<"name" | "type" | "status" | "created_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // New Source Form State
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState("blog");

  useEffect(() => {
    if (!authLoading && user?.email === "nizanmalkit@gmail.com") {
      fetchSources();
    }
  }, [user, authLoading]);

  const fetchSources = async () => {
    if (user?.email !== "nizanmalkit@gmail.com") return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "sources"));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SourceItem[];
      
      setSources(items);
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    try {
      await addDoc(collection(db, "sources"), {
        name: newName,
        url: newUrl,
        type: newType,
        status: "active",
        created_at: Timestamp.now()
      });

      setNewName("");
      setNewUrl("");
      setNewType("blog");
      fetchSources();
    } catch (error) {
      console.error("Error adding source:", error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "inactive" ? "active" : "inactive";
      await updateDoc(doc(db, "sources", id), {
        status: newStatus
      });
      fetchSources();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source absolute permanently?")) return;

    try {
      await deleteDoc(doc(db, "sources", id));
      fetchSources();
    } catch (error) {
      console.error("Error deleting source:", error);
    }
  };

  const handleSort = (field: "name" | "type" | "status" | "created_at") => {
    if (sortBy === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let addedCount = 0;
        for (const row of data) {
          const name = row.Name || row.name || row.title || row.Title;
          const url = row.URL || row.url || row.Link || row.link;
          const type = row.Type || row.type || "blog";

          if (name && url) {
            await addDoc(collection(db, "sources"), {
              name: String(name),
              url: String(url),
              type: String(type).toLowerCase(),
              status: "active",
              created_at: Timestamp.now()
            });
            addedCount++;
          }
        }
        setImportStatus({ message: `Successfully imported ${addedCount} sources!`, type: "success" });
        fetchSources();
      } catch (err) {
        console.error("Import error:", err);
        setImportStatus({ message: "Failed to parse file. Ensure valid headers (Name, URL).", type: "error" });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; 
  };

  // Sorting Logic
  const sortedSources = [...sources].sort((a, b) => {
    let valA = a[sortBy] || "";
    let valB = b[sortBy] || "";
    if (sortBy === "created_at") {
      valA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      valB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortArrow = (field: string) => {
    if (sortBy !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  if (authLoading || (!user || user.email !== "nizanmalkit@gmail.com")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006c49]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Sources</h1>
        <p className="text-sm text-slate-500 mt-1">Add, disable, or remove absolute aggregator streams feeding your AI Engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Source Form */}
        <form onSubmit={handleAddSource} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Plus className="w-4 h-4 text-[#006c49]" />
            Add Single Source
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Name</label>
              <input 
                type="text" 
                placeholder="e.g. OpenAI Blog"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#006c49] text-slate-800"
                required
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">URL / RSS</label>
              <input 
                type="url" 
                placeholder="https://openai.com/blog/rss.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#006c49] text-slate-800"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Type</label>
              <select 
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#006c49] text-slate-800"
              >
                <option value="blog">Blog / RSS</option>
                <option value="youtube">YouTube</option>
                <option value="podcast">Podcast</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-4 py-1.5 bg-[#006c49] hover:bg-[#005f40] text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              Add Source
            </button>
          </div>
        </form>

        {/* Bulk Import Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileUp className="w-4 h-4 text-[#006c49]" />
              Bulk Import (Excel / CSV)
            </h2>
            <p className="text-[11px] text-slate-500 mt-2">
              Upload a `.xlsx` or `.csv` with **Name** and **URL** columns.
            </p>
            {importStatus && (
              <div className={`mt-2 p-2 rounded text-xs font-bold border ${
                importStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {importStatus.message}
              </div>
            )}
          </div>

          <div className="mt-4 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4 hover:border-[#006c49]/30 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileUp className={`w-8 h-8 ${importing ? 'text-[#006c49] animate-bounce' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-600 mt-2">
              {importing ? "Importing items..." : "Click to Upload File"}
            </span>
          </div>
        </div>
      </div>

      {/* Sources list table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading streams view...</div>
        ) : sources.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No sources added yet. Import an Excel or add above!</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th onClick={() => handleSort('name')} className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-[#006c49] select-none">Name{renderSortArrow('name')}</th>
                <th onClick={() => handleSort('type')} className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-[#006c49] select-none">Type{renderSortArrow('type')}</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">URL</th>
                <th onClick={() => handleSort('status')} className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-[#006c49] select-none">Status{renderSortArrow('status')}</th>
                <th onClick={() => handleSort('created_at')} className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-[#006c49] select-none">Added{renderSortArrow('created_at')}</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSources.map((source) => {
                const Icon = typeIcons[source.type] || typeIcons.default;
                const isActive = source.status !== "inactive";
                const dateStr = source.created_at?.toDate 
                  ? source.created_at.toDate().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                  : "-";

                return (
                  <tr key={source.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Icon className="w-4 h-4 text-slate-400" />
                       {source.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium capitalize">
                       {source.type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#006c49] truncate max-w-xs">
                       <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                         {source.url}
                         <ExternalLink className="w-3 h-3 text-slate-400" />
                       </a>
                    </td>
                    <td className="px-5 py-3.5">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                         isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200"
                       }`}>
                         {isActive ? "Active" : "Disabled"}
                       </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                       {dateStr}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => handleToggleStatus(source.id, source.status)}
                           className={`p-1 rounded hover:bg-slate-100 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                           title={isActive ? "Disable Source" : "Enable Source"}
                         >
                           {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                         </button>
                         <button 
                           onClick={() => handleDeleteSource(source.id)}
                           className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                           title="Delete Source"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
