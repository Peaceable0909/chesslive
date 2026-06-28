"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError(loginError.message); setLoading(false); return; }
    router.push("/profile");
    router.refresh();
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 md:p-10"
      style={{ background: "radial-gradient(circle at center, rgba(61,40,191,0.15) 0%, #0d0d1a 70%)" }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center">

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#333348]/50 border border-white/[0.06] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(61,40,191,0.5)]">
            <span className="material-symbols-outlined text-4xl text-[#e4dfff]" style={{ fontVariationSettings: "'FILL' 1" }}>chess</span>
          </div>
          <h1 className="font-[Sora] text-2xl md:text-[32px] font-bold text-[#c7c4d7] mb-2">Welcome back</h1>
          <p className="font-[DM_Sans] text-[#c8c5cc] text-base">Sign in to ChessLive</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3d28bf]/20 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="bg-[#1e1e32] border border-white/[0.06] rounded-xl px-4 py-3 text-[#e2e0fc] font-[DM_Sans] placeholder:text-[#47464c] focus:outline-none focus:border-[#3d28bf] focus:ring-1 focus:ring-[#3d28bf] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full bg-[#1e1e32] border border-white/[0.06] rounded-xl px-4 py-3 pr-12 text-[#e2e0fc] font-[DM_Sans] placeholder:text-[#47464c] focus:outline-none focus:border-[#3d28bf] focus:ring-1 focus:ring-[#3d28bf] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929096] hover:text-[#c8c5cc] transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm border bg-[#93000a]/30 border-[#FF4B4B]/30 text-[#ffb4ab] font-[DM_Sans]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-[#3d28bf] hover:bg-[#4a35d0] disabled:opacity-50 text-white font-[Sora] font-semibold text-base py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(61,40,191,0.4)] hover:shadow-[0_0_25px_rgba(61,40,191,0.6)]"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <Link href="/signup" className="font-[DM_Sans] text-[#e2e0fc] hover:text-[#c5c0ff] transition-colors flex items-center gap-1 group">
            No account? Get 500 free points
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
          <p className="font-[Geist] text-xs text-[#c8c5cc]/40 max-w-[280px] leading-relaxed">
            Points cannot buy rank...<br />Your skill is always earned.
          </p>
        </div>
      </div>
    </main>
  );
}
