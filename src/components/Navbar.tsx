"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Radio, LayoutGrid, Rss, Menu, X, LogOut, TrendingUp } from "lucide-react";
import SettingsDropdown from "./SettingsDropdown";
import SyncButton from "./SyncButton";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f8f9fa]/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-[#006c49] flex items-center justify-center transition-transform group-hover:scale-105">
            <Radio className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#2b3437]">
            AI Newsroom
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-3">
          <Link
            href="/"
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/" ? "bg-[#006c49]/10 text-[#006c49]" : "text-slate-600 hover:text-[#006c49]"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t("dashboard")}
          </Link>
          
          <Link
            href="/analytics"
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/analytics" ? "bg-[#006c49]/10 text-[#006c49]" : "text-slate-600 hover:text-[#006c49]"}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {t("analytics")}
          </Link>
          
          {user?.email === "nizanmalkit@gmail.com" && (
            <Link
              href="/sources"
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/sources" ? "bg-[#006c49]/10 text-[#006c49]" : "text-slate-600 hover:text-[#006c49]"}`}
            >
              <Rss className="w-3.5 h-3.5" />
              {t("sources")}
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user?.email === "nizanmalkit@gmail.com" && (
            <div className="hidden sm:block">
              <SyncButton />
            </div>
          )}
          <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
          <LanguageSwitcher />
          <SettingsDropdown />

          <div className="hidden sm:block w-px h-4 bg-slate-200"></div>

          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full border border-slate-200" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#006c49] flex items-center justify-center text-white font-bold text-xs cursor-pointer">
                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-3 py-1 text-xs font-bold text-white bg-[#006c49] hover:bg-[#005f40] rounded-md transition-all"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1.5 border border-slate-200 rounded-md hover:bg-slate-50"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white divide-y divide-slate-100 animate-in fade-in duration-150">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${pathname === "/" ? "bg-[#006c49]/10 text-[#006c49]" : "text-black hover:bg-black/5"}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/analytics"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${pathname === "/analytics" ? "bg-[#006c49]/10 text-[#006c49]" : "text-black hover:bg-black/5"}`}
          >
            <TrendingUp className="w-4 h-4" />
            {t("analytics")}
          </Link>
          {user?.email === "nizanmalkit@gmail.com" && (
            <Link
              href="/sources"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${pathname === "/sources" ? "bg-[#006c49]/10 text-[#006c49]" : "text-black hover:bg-black/5"}`}
            >
              <Rss className="w-4 h-4" />
              {t("sources")}
            </Link>
          )}
          <div className="px-4 py-3 sm:hidden">
             <SyncButton />
          </div>
        </div>
      )}
    </header>
  );
}
