"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const RANK_ICONS: Record<string, string> = {
  Pawn: "♟", Knight: "♞", Bishop: "♝", Rook: "♜", Queen: "♛", King: "♚", Grandmaster: "♛", Legend: "★",
};

export default function WelcomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      supabase.from("chesslive_profiles").select("username").eq("id", data.user.id).single()
        .then(({ data: profile }) => {
          if (profile) setUsername(profile.username);
        });
    });

    // Animate points reveal
    const timers = [
      setTimeout(() => setAnimStep(1), 400),
      setTimeout(() => setAnimStep(2), 900),
      setTimeout(() => setAnimStep(3), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-6 animate-bounce">♟</div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome{username ? `, ${username}` : ""}!
        </h1>
        <p className="text-gray-400 text-sm mb-8">You're in. Here's your starting gift.</p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className={`transition-all duration-500 ${animStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Welcome bonus</span>
              <span className="text-emerald-400 font-bold text-lg">+500 pts</span>
            </div>
          </div>

          <div className={`transition-all duration-500 delay-200 ${animStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Starting rank</span>
              <span className="text-white font-medium">{RANK_ICONS.Pawn} Pawn</span>
            </div>
          </div>

          <div className={`transition-all duration-500 delay-500 ${animStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-400 text-sm">Reputation</span>
              <span className="text-indigo-400 font-medium">50 / 100</span>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 ${animStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => router.push("/profile")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors mb-3"
          >
            View my profile →
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
          >
            Play chess now
          </button>
        </div>
      </div>
    </main>
  );
}
