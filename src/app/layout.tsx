import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Zap, LayoutGrid, Rss } from "lucide-react";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

// Load Premium Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "AI Newsroom | Curated Insights",
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
        <AuthProvider>
          <LanguageProvider>
            {/* Top Navigation Bar - Minimalist */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-0">
              {children}
            </main>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
