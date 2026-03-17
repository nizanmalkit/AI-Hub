"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { en, Dictionary } from "@/locales/en";
import { he } from "@/locales/he";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/utils/firebase/client";
import { doc, getDoc } from "firebase/firestore";

const dictionaries = { en, he };

type LanguageContextType = {
  language: "en" | "he";
  t: (key: keyof Dictionary) => string;
  setLanguage: (lang: "en" | "he") => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  t: (key) => en[key] || String(key),
  setLanguage: () => {}
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<"en" | "he">("en");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    async function loadLang() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().language) {
          setLanguage(snap.data().language);
        }
      } catch (error) {
        console.warn("No language preference yet.");
      }
    }
    loadLang();
  }, [user]);

  const t = (key: keyof Dictionary) => {
    return dictionaries[language][key] || en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      <div dir={language === "he" ? "rtl" : "ltr"} className="contents">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
