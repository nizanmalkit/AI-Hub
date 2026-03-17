"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/utils/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<"en" | "he">("en");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    async function fetchUserPrefs() {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLanguage(docSnap.data().language || "en");
        }
      } catch (error) {
        console.warn("No language preference found yet.");
      }
    }
    fetchUserPrefs();
  }, [user]);

  const handleLanguageChange = async (newLang: "en" | "he") => {
    setLanguage(newLang);
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        language: newLang,
        updated_at: new Date()
      }, { merge: true });
      // Trigger a light page reload or event to let other components know about language change
      window.location.reload();
    } catch (error) {
      console.error("Failed to update language:", error);
    }
  };

  return (
    <div className="flex items-center">
      <select 
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as "en" | "he")}
        disabled={!user}
        title={!user ? "Sign in to change language" : "Select language preference"}
        className={`p-1 border border-slate-200 rounded-md text-[11px] bg-white focus:outline-none font-semibold text-slate-700 cursor-pointer ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
      >
        <option value="en">EN 🇺🇸</option>
        <option value="he">HE 🇮🇱</option>
      </select>
    </div>
  );
}
