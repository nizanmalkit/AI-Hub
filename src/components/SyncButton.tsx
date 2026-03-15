"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // Webhook HTTP fetch trigger here...
    
    setTimeout(() => {
      setIsSyncing(false);
      alert("Sync initiated in background!");
    }, 800);
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        isSyncing
          ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
          : "bg-black hover:bg-gray-800 text-white shadow-sm border border-transparent"
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Now"}
    </button>
  );
}
