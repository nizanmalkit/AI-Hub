"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, User, Bell } from "lucide-react";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
