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
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Level {level}</span>
        <span>{xp} / {xpNeeded} XP</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
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
      supabase
        .from("chesslive_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()
        .then(({ data: p }) => {
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
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading profile…</div>
      </main>
    );
  }

  if (!profile) return null;

  const rankIndex = RANK_ORDER.indexOf(profile.rank);
  const nextRank = RANK_ORDER[rankIndex + 1];

  return (
    <main className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-sm mx-auto pt-8">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">← Board</Link>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-300 text-sm">Sign out</button>
        </div>

        {/* Avatar + rank */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-indigo-900/40 border-2 border-indigo-700 rounded-full flex items-center justify-center text-4xl mb-3">
            {RANK_ICONS[profile.rank] || "♟"}
          </div>
          <h1 className="text-xl font-bold text-white">{profile.username}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
              {profile.rank}
            </span>
            <span className="text-xs text-gray-500">Level {profile.level}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <XPBar xp={profile.xp} level={profile.level} />
          {nextRank && (
            <p className="text-xs text-gray-600 mt-2 text-center">Reach {nextRank} by earning XP in live games</p>
          )}
        </div>

        {/* Points balance */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-300/70 mb-0.5">Points balance</p>
              <p className="text-3xl font-bold text-white">{profile.points.toLocaleString()}</p>
              <p className="text-xs text-indigo-400 mt-0.5">pts</p>
            </div>
            <div className="text-4xl opacity-20">♟</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Reputation</p>
            <p className="text-2xl font-bold text-white">{profile.reputation}</p>
            <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profile.reputation}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-1">/ 100</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Games played</p>
            <p className="text-2xl font-bold text-white">{profile.games_played}</p>
            <p className="text-xs text-gray-600 mt-1">Live games voted in</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Engine accuracy</p>
            <p className="text-2xl font-bold text-white">{profile.engine_accuracy > 0 ? `${profile.engine_accuracy}%` : "—"}</p>
            <p className="text-xs text-gray-600 mt-1">Match Stockfish</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Brilliant moves</p>
            <p className="text-2xl font-bold text-white">{profile.brilliant_moves}</p>
            <p className="text-xs text-gray-600 mt-1">💎 Found</p>
          </div>
        </div>

        {/* Reputation note */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Reputation Score</p>
          <p className="text-xs text-gray-400">Built through fair play, consistency, and positive contributions. <span className="text-gray-500">Cannot be purchased.</span></p>
        </div>

        <Link
          href="/"
          className="block w-full py-3 bg-indigo-700 hover:bg-indigo-600 text-white text-center font-medium rounded-xl text-sm transition-colors"
        >
          ♟ Play Chess
        </Link>
      </div>
    </main>
  );
}
