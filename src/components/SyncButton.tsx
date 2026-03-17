"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { t } = useLanguage();

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === "success") {
        alert(`🎉 Sync Result: ${data.message}`);
        // Optional: Refresh the page layout to fetch new items
        window.location.reload();
      } else {
        alert(`⚠️ Sync Warning: ${data.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Sync trigger failed:", error);
      alert("🚨 Sync Failed: Could not connect to aggregator backend.");
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
        isSyncing
          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          : "bg-black hover:bg-gray-800 text-white shadow-sm border border-transparent"
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? t("syncing") : t("syncNow")}
    </button>
  );
}
