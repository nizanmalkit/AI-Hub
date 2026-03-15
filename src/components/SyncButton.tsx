"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // In a real app, you would toast here: "Sync initiated in background."
    // And fire the HTTP webhook:
    // fetch('/api/sync', { method: 'POST' });
    
    setTimeout(() => {
      setIsSyncing(false);
      alert("Sync initiated in background!");
    }, 800);
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        isSyncing
          ? "bg-accent/50 text-white/70 cursor-not-allowed"
          : "bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5"
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Now"}
    </button>
  );
}
