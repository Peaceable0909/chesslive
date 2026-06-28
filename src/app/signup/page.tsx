"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("chesslive_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) { setError("Username already taken"); setLoading(false); return; }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupError) { setError(signupError.message); setLoading(false); return; }

    if (signupData.session) {
      router.push("/welcome");
      return;
    }

    setError("✉️ Check your email and click the confirmation link, then come back to sign in.");
    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 md:p-10"
      style={{ background: "radial-gradient(circle at center, rgba(61,40,191,0.15) 0%, #0d0d1a 70%)" }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center z-10">

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#333348]/50 border border-white/[0.06] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(61,40,191,0.5)]">
            <span className="material-symbols-outlined text-4xl text-[#e4dfff]" style={{ fontVariationSettings: "'FILL' 1" }}>chess</span>
          </div>
          <h1 className="font-[Sora] text-2xl md:text-[32px] font-bold text-[#c7c4d7] mb-3">ChessLive</h1>
          <div className="bg-[#150d00] border border-[#fabd00]/20 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fabd00] text-sm">stars</span>
            <span className="font-[Geist] text-sm tracking-widest text-[#fabd00] uppercase">500 free points on signup</span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3d28bf]/20 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSignup} className="flex flex-col gap-5 relative z-10">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="crowdmaster"
                required
                className="bg-[#1e1e32] border border-white/[0.06] rounded-xl px-4 py-3 text-[#e2e0fc] font-[DM_Sans] placeholder:text-[#47464c] focus:outline-none focus:border-[#3d28bf] focus:ring-1 focus:ring-[#3d28bf] transition-all"
              />
              <p className="text-[10px] text-[#47464c] font-[Geist] tracking-wide">Letters, numbers, underscores only</p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase" htmlFor="email">
                Email
              </label>
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
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

            {/* Error */}
            {error && (
              <div className={`px-4 py-3 rounded-xl text-sm border font-[DM_Sans] ${
                error.startsWith("✉️")
                  ? "bg-[#3d28bf]/20 border-[#3d28bf]/40 text-[#c5c0ff]"
                  : "bg-[#93000a]/30 border-[#FF4B4B]/30 text-[#ffb4ab]"
              }`}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-[#3d28bf] hover:bg-[#4a35d0] disabled:opacity-50 text-white font-[Sora] font-semibold text-base py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(61,40,191,0.4)] hover:shadow-[0_0_25px_rgba(61,40,191,0.6)]"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Get 500 free points
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase">or continue with</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Google (UI only) */}
            <button
              type="button"
              className="w-full bg-[#1e1e32] hover:bg-[#28283d] border border-white/[0.06] text-[#e2e0fc] font-[Sora] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <Link href="/login" className="font-[DM_Sans] text-[#e2e0fc] hover:text-[#c5c0ff] transition-colors flex items-center gap-1 group">
            Already have an account? Sign in
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
