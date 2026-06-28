"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function WelcomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      supabase.from("chesslive_profiles").select("username").eq("id", data.user.id).single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data: profile }: { data: any }) => {
          if (profile) setUsername(profile.username);
        });
    });

    const timers = [
      setTimeout(() => setAnimStep(1), 400),
      setTimeout(() => setAnimStep(2), 900),
      setTimeout(() => setAnimStep(3), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(circle at center, rgba(124,111,255,0.1) 0%, #0d0d1a 65%)" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        {/* Icon */}
        <div className={`w-24 h-24 rounded-full bg-[#1e1e32] border-2 border-[#3d28bf] flex items-center justify-center mb-6 transition-all duration-700 ${animStep >= 1 ? "glow-pulse-anim scale-100 opacity-100" : "scale-75 opacity-0"}`}>
          <span className="material-symbols-outlined text-5xl text-[#c5c0ff]" style={{ fontVariationSettings: "'FILL' 1" }}>chess</span>
        </div>

        {/* Title */}
        <div className={`transition-all duration-500 ${animStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <h1 className="font-[Sora] text-2xl font-bold text-[#e2e0fc] mb-2">
            Welcome{username ? `, ${username}` : ""}!
          </h1>
          <p className="font-[DM_Sans] text-[#c8c5cc] text-base mb-8">You&apos;re in. Here&apos;s your starting gift.</p>
        </div>

        {/* Reveal card */}
        <div className="w-full bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden mb-6 shadow-2xl">

          <div className={`flex items-center justify-between px-6 py-4 border-b border-white/[0.06] transition-all duration-500 ${animStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fabd00]/10 border border-[#fabd00]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#fabd00] text-lg">stars</span>
              </div>
              <span className="font-[DM_Sans] text-[#c8c5cc] text-sm">Welcome bonus</span>
            </div>
            <span className="font-[Geist] text-lg font-bold text-[#00E676]">+500 pts</span>
          </div>

          <div className={`flex items-center justify-between px-6 py-4 border-b border-white/[0.06] transition-all duration-500 delay-200 ${animStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#3d28bf]/20 border border-[#3d28bf]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c5c0ff] text-lg">military_tech</span>
              </div>
              <span className="font-[DM_Sans] text-[#c8c5cc] text-sm">Starting rank</span>
            </div>
            <span className="font-[DM_Sans] text-[#e2e0fc] font-medium">♟ Pawn</span>
          </div>

          <div className={`flex items-center justify-between px-6 py-4 transition-all duration-500 delay-500 ${animStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#00E676] text-lg">verified</span>
              </div>
              <span className="font-[DM_Sans] text-[#c8c5cc] text-sm">Reputation</span>
            </div>
            <span className="font-[Geist] text-[#c5c0ff] font-medium">50 / 100</span>
          </div>
        </div>

        {/* CTAs */}
        <div className={`w-full flex flex-col gap-3 transition-all duration-500 ${animStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => router.push("/profile")}
            className="w-full py-3.5 bg-[#3d28bf] hover:bg-[#4a35d0] text-white font-[Sora] font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(61,40,191,0.4)] hover:shadow-[0_0_30px_rgba(61,40,191,0.6)] flex items-center justify-center gap-2"
          >
            View my profile
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3.5 bg-[#1e1e32] hover:bg-[#28283d] border border-white/[0.06] text-[#c8c5cc] font-[DM_Sans] rounded-xl transition-colors"
          >
            Play chess now
          </button>
        </div>

        <p className="font-[Geist] text-xs text-[#c8c5cc]/40 mt-8 leading-relaxed">
          Points cannot buy rank...<br />Your skill is always earned.
        </p>
      </div>
    </main>
  );
}
