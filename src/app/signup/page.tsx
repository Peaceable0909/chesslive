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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    const supabase = createClient();

    // Check username is unique
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

    // If session exists, email confirmation is off — go straight to welcome
    if (signupData.session) {
      router.push("/welcome");
      return;
    }

    // Email confirmation is on — tell the user to check their inbox
    setError("✉️ Check your email and click the confirmation link, then come back to sign in.");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">♟ ChessLive</h1>
          <p className="text-gray-400 text-sm">Create your account — get 500 free points</p>
        </div>

        <form onSubmit={handleSignup} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="crowdmaster"
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1">Letters, numbers, underscores only</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className={`px-3 py-2 rounded-lg text-sm border ${error.startsWith("✉️") ? "bg-indigo-900/30 border-indigo-700 text-indigo-300" : "bg-red-900/30 border-red-800 text-red-300"}`}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
          >
            {loading ? "Creating account…" : "Get 500 free points →"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
