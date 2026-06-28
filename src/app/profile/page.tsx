"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  points: number;
  xp: number;
  level: number;
  rank: string;
  reputation: number;
  games_played: number;
  engine_accuracy: number;
  brilliant_moves: number;
};

const RANK_ICONS: Record<string, string> = {
  Pawn: "♟", Knight: "♞", Bishop: "♝", Rook: "♜", Queen: "♛", King: "♚", Grandmaster: "★", Legend: "👑",
};

const RANK_ORDER = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King", "Grandmaster", "Legend"];

function XPBar({ xp, level }: { xp: number; level: number }) {
  const xpNeeded = level * 500;
  const pct = Math.min(100, Math.round((xp / xpNeeded) * 100));
  return (
    <div className="w-full max-w-xs mx-auto space-y-1.5 mt-3">
      <div className="flex justify-between font-[Geist] text-xs text-[#c8c5cc]">
        <span>XP</span>
        <span>{xp.toLocaleString()} / {xpNeeded.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full bg-[#333348] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3d28bf 0%, #1a1a2e 100%)" }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      supabase.from("chesslive_profiles").select("*").eq("id", data.user.id).single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data: p }: { data: any }) => {
          setProfile(p);
          setLoading(false);
        });
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0D1A] flex items-center justify-center">
        <div className="text-[#c8c5cc] text-sm font-[DM_Sans] animate-pulse">Loading profile…</div>
      </main>
    );
  }

  if (!profile) return null;

  const rankIndex = RANK_ORDER.indexOf(profile.rank);
  const nextRank = RANK_ORDER[rankIndex + 1];

  return (
    <div className="min-h-screen bg-[#0D0D1A] pb-28 md:pb-12">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#111125]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex justify-between items-center px-5 h-16 max-w-[1440px] mx-auto">
          <Link href="/" className="text-[#c8c5cc] hover:text-[#e2e0fc] transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-[Sora] text-lg font-semibold text-[#c7c4d7]">Profile</h1>
          <button onClick={handleSignOut} className="text-[#c8c5cc] hover:text-[#e2e0fc] transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="pt-20 px-5 space-y-5 max-w-lg mx-auto">

        {/* Profile hero */}
        <section className="flex flex-col items-center text-center space-y-3 pt-4">
          <div className="w-24 h-24 rounded-full bg-[#1e1e32] border-2 border-[#c5c0ff] flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(124,111,255,0.6)]">
            {RANK_ICONS[profile.rank] || "♟"}
          </div>
          <div>
            <h2 className="font-[Sora] text-2xl font-bold text-[#e2e0fc]">{profile.username}</h2>
            <p className="font-[Geist] text-sm text-[#c8c5cc] mt-1 flex items-center justify-center gap-1.5">
              <span>{RANK_ICONS[profile.rank]}</span>
              {profile.rank} · Level {profile.level}
            </p>
          </div>
          <XPBar xp={profile.xp} level={profile.level} />
          {nextRank && (
            <p className="text-xs text-[#47464c] font-[Geist]">Reach {nextRank} by earning XP in live games</p>
          )}
        </section>

        {/* Points balance */}
        <section className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-9xl text-[#fabd00]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <p className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase mb-2">Total Points</p>
          <p className="font-[Geist] text-5xl font-bold text-[#fabd00]">{profile.points.toLocaleString()}</p>
        </section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28">
            <p className="font-[Geist] text-xs tracking-wide text-[#c8c5cc]">Reputation</p>
            <div>
              <div className="flex items-end gap-1.5">
                <p className="font-[Sora] text-2xl font-bold text-[#e2e0fc]">{profile.reputation}</p>
                <span className="font-[Geist] text-xs text-[#00E676] mb-0.5">/ 100</span>
              </div>
              <div className="h-1.5 bg-[#333348] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#00E676] rounded-full" style={{ width: `${profile.reputation}%` }} />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28">
            <p className="font-[Geist] text-xs tracking-wide text-[#c8c5cc]">Games Played</p>
            <p className="font-[Sora] text-2xl font-bold text-[#e2e0fc]">{profile.games_played}</p>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28">
            <p className="font-[Geist] text-xs tracking-wide text-[#c8c5cc]">Engine Acc</p>
            <p className="font-[Sora] text-2xl font-bold text-[#e2e0fc]">
              {profile.engine_accuracy > 0 ? `${profile.engine_accuracy}%` : "—"}
            </p>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28">
            <p className="font-[Geist] text-xs tracking-wide text-[#c8c5cc]">Brilliant Moves</p>
            <p className="font-[Sora] text-2xl font-bold text-[#fabd00]">{profile.brilliant_moves}</p>
          </div>
        </section>

        {/* Reputation note */}
        <section className="glass-card rounded-xl p-4">
          <p className="font-[Geist] text-xs tracking-widest text-[#c8c5cc] uppercase mb-2">Reputation Score</p>
          <p className="font-[DM_Sans] text-sm text-[#c8c5cc]">
            Built through fair play, consistency, and positive contributions.{" "}
            <span className="text-[#47464c]">Cannot be purchased.</span>
          </p>
        </section>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#3d28bf] hover:bg-[#4a35d0] text-white text-center font-[Sora] font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(61,40,191,0.4)] hover:shadow-[0_0_25px_rgba(61,40,191,0.6)]"
        >
          <span className="material-symbols-outlined text-lg">chess</span>
          Play Chess
        </Link>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#1e1e32]/95 backdrop-blur-lg border-t border-white/[0.06] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] md:hidden">
        <div className="flex justify-around items-center h-20 px-2">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#c8c5cc] hover:text-[#e2e0fc] px-4 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-[10px] font-[Geist] tracking-wide">Home</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1 text-[#c8c5cc] hover:text-[#e2e0fc] px-4 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-xl">sensors</span>
            <span className="text-[10px] font-[Geist] tracking-wide">Live</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1 text-[#c8c5cc] hover:text-[#e2e0fc] px-4 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-xl">grid_view</span>
            <span className="text-[10px] font-[Geist] tracking-wide">Play</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-[#c5c0ff] bg-[#3d28bf]/20 rounded-xl px-4 py-1.5">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-[10px] font-[Geist] tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
