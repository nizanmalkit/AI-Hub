import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Zap, LayoutGrid, Rss, Settings } from "lucide-react";

// Load Premium Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "AI Hub | Curated Insights",
  description: "The premier aggregator for the latest and most important AI news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col relative overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Top Navigation Bar - Minimalist */}
        <header className="sticky top-0 z-50 glass w-full border-b border-gray-200 bg-white/90">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-gray-900">
                AI Hub
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/sources"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                <Rss className="w-4 h-4" />
                Sources
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <button className="p-2 justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-black border border-transparent hover:border-gray-200">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
