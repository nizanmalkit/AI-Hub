"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Clock, Bell, User, LogOut } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/utils/firebase/client";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>("manual");
  const [notifications, setNotifications] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "he">("en");
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Fetch Global Config on mount
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

  // Fetch User Preferences on mount/user-change
  useEffect(() => {
    if (!user) return;
    async function fetchUserPrefs() {
      if (!user) return; // TS guard
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNotifications(docSnap.data().emailNotifications || false);
          setLanguage(docSnap.data().language || "en");
        }
      } catch (error) {
        console.warn("No user profile found yet, using defaults.");
      }
    }
    fetchUserPrefs();
  }, [user]);

  const handleFrequencyChange = async (newFreq: string) => {
    setFrequency(newFreq);
    try {
      await setDoc(doc(db, "settings", "sync_config"), {
        frequency: newFreq,
        updated_at: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Failed to update frequency:", error);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user) return alert("Please sign in to save preferences!");
    
    const newVal = !notifications;
    setNotifications(newVal);

    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        emailNotifications: newVal,
        email: user.email,
        updated_at: new Date()
      }, { merge: true });

      // 📜 Log Audit Trail for Compliance
      await addDoc(collection(db, "audit_logs"), {
        userId: user.uid,
        email: user.email,
        action: newVal ? "subscribed" : "unsubscribed",
        timestamp: new Date(),
        source: "webapp_settings"
      });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
    }
  };

  const handleLanguageChange = async (newLang: "en" | "he") => {
    if (!user) return;
    setLanguage(newLang);

    try {
      const docRef = doc(db, "users", user.uid, "settings", "preferences");
      await setDoc(docRef, {
        language: newLang,
        updated_at: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Failed to update language:", error);
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
        className={`p-2 justify-center rounded-md transition-colors border ${isOpen ? 'bg-gray-100 text-black border-gray-200 shadow-sm' : 'text-slate-500 hover:text-black border-transparent hover:border-slate-200 hover:bg-slate-100'}`}
        aria-label="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute ${language === 'he' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
          <div className="px-4 py-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-bold text-slate-900">{user?.displayName || "Guest Account"}</p>
            <p className="text-xs text-slate-400 font-medium truncate">{user?.email || "Sign in for personalized configs"}</p>
          </div>
          
          {user?.email === "nizanmalkit@gmail.com" && (
            <div className="px-4 py-2">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t("settings")}</p>
              <div className="flex items-center gap-2 text-xs text-slate-700 py-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("updatesFrequency")}:</span>
              </div>
              <select 
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="mt-1 w-full p-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-[#006c49]"
              >
                <option value="manual">{t("manualOnly")}</option>
                <option value="daily">{t("onceADay")}</option>
                <option value="weekly">{t("weekly")}</option>
              </select>
            </div>
          )}

          <div className="h-px bg-slate-100 my-1"></div>
          
          <div className="px-4 py-2">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t("language")}</p>
            
            {/* Newsletter Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-700 py-1.5 font-medium">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("dailyNewsletter")} ({language === 'he' ? 'HE' : 'EN'})</span>
              </div>
              <button 
                onClick={handleToggleNotifications}
                disabled={!user}
                className={`w-7 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${!user ? 'opacity-50 cursor-not-allowed' : ''} ${notifications ? 'bg-[#006c49]' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${notifications ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          
          <div className="h-px bg-slate-100 my-1"></div>
          
          {user ? (
            <button 
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              {t("logout")}
            </button>
          ) : (
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full text-left px-4 py-2 text-sm text-[#006c49] hover:bg-[#006c49]/10 flex items-center gap-2 font-bold transition-colors"
            >
              <User className="w-4 h-4 text-[#006c49]" />
              {t("login")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
