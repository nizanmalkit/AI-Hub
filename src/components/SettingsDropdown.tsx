"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, User, Bell, Clock } from "lucide-react";
import { db } from "@/utils/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>("manual");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current setting on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const docRef = doc(db, "settings", "sync_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFrequency(docSnap.data().frequency || "manual");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    }
    fetchConfig();
  }, []);

  const handleFrequencyChange = async (newFreq: string) => {
    setFrequency(newFreq);
    try {
      await setDoc(doc(db, "settings", "sync_config"), {
        frequency: newFreq,
        updated_at: new Date()
      });
      alert(`🎉 Frequency updated to ${newFreq}!`);
    } catch (error) {
      console.error("Failed to update frequency:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 justify-center rounded-md transition-colors border ${isOpen ? 'bg-gray-100 text-black border-gray-200 shadow-sm' : 'text-gray-500 hover:text-black border-transparent hover:border-gray-200 hover:bg-gray-100'}`}
        aria-label="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <p className="text-sm font-bold text-gray-900">Admin Account</p>
            <p className="text-xs text-gray-500 font-medium">admin@aihub.local</p>
          </div>
          
          <div className="px-4 py-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Preferences</p>
            <div className="flex items-center gap-2 text-sm text-gray-700 py-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Sync Frequency:</span>
            </div>
            <select 
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="mt-1 w-full p-1.5 border border-gray-200 rounded-md text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="manual">Manual Only</option>
              <option value="daily">Daily (7:00 AM)</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="h-px bg-gray-100 my-1"></div>
          
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors">
            <User className="w-4 h-4 text-gray-400" />
            Profile details
          </button>
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors">
             <Bell className="w-4 h-4 text-gray-400" />
            Notification preferences
          </button>
          
          <div className="h-px bg-gray-100 my-1"></div>
          
          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors">
            <LogOut className="w-4 h-4 text-red-500" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
