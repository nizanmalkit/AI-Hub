"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006c49]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-[#006c49] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
          <Radio className="w-6 h-6 text-white" />
        </div>
        
        <h1 className="font-bold text-2xl text-slate-900 mb-2">Welcome to AI Newsroom</h1>
        <p className="text-sm text-slate-500 mb-8">
          Sign in to save bookmarks, set schedules, and manage subscriptions.
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-[#006c49]/30 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm group"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          <span className="group-hover:text-[#006c49]">Continue with Google</span>
        </button>

        <p className="text-[11px] text-slate-400 mt-6">
          By continuing, you agree to our terms and conditions dashboard.
        </p>
      </div>
    </div>
  );
}
