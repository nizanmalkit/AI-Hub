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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col relative overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Aesthetic Background Blobs */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 glass w-full border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-white/90 group-hover:text-white transition-colors">
                AI Hub
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-white transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/sources"
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-white transition-colors"
              >
                <Rss className="w-4 h-4" />
                Sources
              </Link>
            </nav>

            {/* Right side actions placeholder */}
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
