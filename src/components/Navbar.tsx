"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, LayoutGrid, Rss, Menu, X } from "lucide-react";
import SettingsDropdown from "./SettingsDropdown";
import SyncButton from "./SyncButton";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black bg-[#fdfbf7]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center transition-transform group-hover:scale-105">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-serif font-black text-base tracking-tight text-black">
            AI Hub
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-black hover:underline"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/sources"
            className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-black hover:underline"
          >
            <Rss className="w-3.5 h-3.5" />
            Sources
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <SyncButton />
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
          <SettingsDropdown />

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1 border border-black hover:bg-black/5"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-black bg-[#fdfbf7] divide-y divide-black animate-in fade-in duration-150">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-black/5"
          >
            <LayoutGrid className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/sources"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-black/5"
          >
            <Rss className="w-4 h-4" />
            Sources
          </Link>
          <div className="px-4 py-3 sm:hidden">
             <SyncButton />
          </div>
        </div>
      )}
    </header>
  );
}
