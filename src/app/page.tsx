"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

// ─── Shared style tokens ──────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: "rgba(26, 26, 46, 0.8)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(12px)",
};

const sora = "Sora, sans-serif";
const dmSans = "DM Sans, sans-serif";
const geist = "Geist, monospace";

// ─── Mini live board (mock preview) ──────────────────────────────────────────

function MiniBoard() {
  const squares = [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const isDark = (row + col) % 2 !== 0;
    const isHighlight = i === 35;
    const isLastMove = i === 27;
    squares.push(
      <div key={i} style={{
        background: isDark ? "#4A3728" : "#E8C888",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        ...(isLastMove ? { background: isDark ? "#6b5a2a" : "#d4b96a" } : {}),
      }}>
        {isHighlight && (
          <>
            <div style={{
              position: "absolute", inset: 2,
              border: "2px solid #7C6FFF", borderRadius: 4,
              boxShadow: "0 0 12px rgba(124,111,255,0.8)",
              animation: "pulseSq 1.6s infinite",
            }} />
            <span style={{ fontSize: "clamp(14px, 3.2vw, 26px)", zIndex: 1 }}>♞</span>
          </>
        )}
        {i === 4 && <span style={{ fontSize: "clamp(14px, 3.2vw, 26px)", opacity: 0.35 }}>♚</span>}
        {i === 51 && <span style={{ fontSize: "clamp(14px, 3.2vw, 26px)" }}>♙</span>}
        {i === 52 && <span style={{ fontSize: "clamp(14px, 3.2vw, 26px)" }}>♙</span>}
        {i === 60 && <span style={{ fontSize: "clamp(14px, 3.2vw, 26px)" }}>♔</span>}
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(8, 1fr)",
      gridTemplateRows: "repeat(8, 1fr)",
      aspectRatio: "1 / 1",
      width: "100%",
      borderRadius: 10,
      overflow: "hidden",
      border: "3px solid #4A3728",
    }}>
      {squares}
    </div>
  );
}

// ─── Vote bar ────────────────────────────────────────────────────────────────

function VoteBar({ move, pct, primary }: { move: string; pct: number; primary?: boolean }) {
  return (
    <div style={{
      position: "relative", height: 46,
      background: "#1a1a2e", borderRadius: 10,
      display: "flex", alignItems: "center",
      padding: "0 16px", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, height: "100%",
        width: `${pct}%`,
        background: primary ? "rgba(61,40,191,0.55)" : "#333348",
        transition: "width 0.5s",
      }} />
      <span style={{ position: "relative", zIndex: 1, fontFamily: sora, fontWeight: 700, fontSize: 14, color: "#e2e0fc" }}>{move}</span>
      <span style={{ position: "relative", zIndex: 1, marginLeft: "auto", fontFamily: geist, fontSize: 13, color: "#c8c5cc" }}>{pct}%</span>
    </div>
  );
}

// ─── Landing page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [authUser, setAuthUser] = useState<{ username?: string } | null>(null);
  const [timer, setTimer] = useState(23);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("chesslive_profiles").select("username").eq("id", data.user.id).single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data: p }: { data: any }) => { if (p) setAuthUser({ username: p.username }); });
    });
    const t = setInterval(() => setTimer((s) => (s <= 0 ? 30 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#0D0D1A", minHeight: "100vh", color: "#e2e0fc", overflowX: "hidden" }}>

      {/* ═══ Top nav ═══ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(17,17,37,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
        }}>
          <span style={{ fontFamily: sora, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#e2e0fc" }}>ChessLive</span>

          <nav className="hidden md:flex" style={{ gap: 32, alignItems: "center" }}>
            <Link href="/" style={{ fontFamily: dmSans, fontSize: 14, color: "#e2e0fc", fontWeight: 700, textDecoration: "none", borderBottom: "2px solid #c7c4d7", paddingBottom: 3 }}>Home</Link>
            <Link href="/play" style={{ fontFamily: dmSans, fontSize: 14, color: "#929096", textDecoration: "none" }}>Play</Link>
            <Link href="#" style={{ fontFamily: dmSans, fontSize: 14, color: "#929096", textDecoration: "none" }}>Live</Link>
            <Link href="#" style={{ fontFamily: dmSans, fontSize: 14, color: "#929096", textDecoration: "none" }}>Leaderboard</Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {authUser ? (
              <Link href="/profile" style={{
                background: "#3d28bf", color: "#fff", padding: "8px 20px", borderRadius: 10,
                fontFamily: dmSans, fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>{authUser.username}</Link>
            ) : (
              <>
                <Link href="/login" style={{ fontFamily: dmSans, fontSize: 14, color: "#929096", textDecoration: "none" }}>Sign In</Link>
                <Link href="/signup" style={{
                  background: "#3d28bf", color: "#fff", padding: "8px 20px", borderRadius: 10,
                  fontFamily: dmSans, fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 0 16px rgba(61,40,191,0.4)",
                }}>Join Now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Live pulse ticker ═══ */}
      <div style={{
        marginTop: 64, height: 40,
        background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", overflow: "hidden",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 28,
          whiteSpace: "nowrap",
          fontFamily: geist, fontSize: 11, letterSpacing: "0.1em",
          color: "#c5c0ff", textTransform: "uppercase",
          animation: "tickerScroll 32s linear infinite",
        }}>
          {[0, 1].map((n) => (
            <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 28, paddingRight: 28 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4B4B", animation: "pulseDot 2s infinite", display: "inline-block" }} />
                42 games live
              </span>
              <span>· 18,406 voting</span>
              <span>· 1,247 moves/min</span>
              <span>· Biggest pool: 25,000 pts</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4B4B", animation: "pulseDot 2s infinite", display: "inline-block" }} />
                Grandmaster tournament starting in 14:02
              </span>
              <span>· New challenge from Magnus</span>
            </span>
          ))}
        </span>
      </div>

      {/* ═══ Hero ═══ */}
      <section style={{
        maxWidth: 1280, margin: "0 auto", padding: "72px 24px",
        display: "grid", gap: 56, alignItems: "center",
      }} className="lg:grid-cols-2">

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <h1 style={{ fontFamily: sora, fontSize: "clamp(38px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0 }}>
            Play chess against<br />
            <span style={{ color: "#fabd00" }}>thousands.</span>
          </h1>

          <p style={{ fontFamily: dmSans, fontSize: 18, lineHeight: 1.6, color: "#c8c5cc", maxWidth: 460, margin: 0 }}>
            Where every viewer becomes a player. Predict, vote, and outsmart the world in real-time grandmaster matches.
          </p>

          {/* Stats strip */}
          <div style={{
            display: "flex", gap: 48, padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            width: "fit-content",
          }}>
            {[["38K", "Players"], ["1.2M", "Votes"], ["9.8K", "Games"]].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontFamily: sora, fontSize: 24, fontWeight: 700, color: "#e2e0fc" }}>{num}</div>
                <div style={{ fontFamily: geist, fontSize: 11, letterSpacing: "0.1em", color: "#929096", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <Link href="/signup" style={{
              background: "#3d28bf", color: "#fff",
              padding: "16px 32px", borderRadius: 14,
              fontFamily: sora, fontWeight: 700, fontSize: 17,
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 0 25px rgba(124,111,255,0.35)",
            }}>
              Get 500 free points →
            </Link>
            <Link href="/play" style={{
              border: "1px solid rgba(255,255,255,0.12)", color: "#e2e0fc",
              padding: "16px 32px", borderRadius: 14,
              fontFamily: sora, fontWeight: 700, fontSize: 17,
              textDecoration: "none", background: "rgba(26,26,46,0.5)",
            }}>
              Watch live →
            </Link>
          </div>
        </div>

        {/* Right — live preview card */}
        <div style={{ ...glass, borderRadius: 24, padding: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -96, right: -96, width: 256, height: 256, background: "rgba(197,192,255,0.08)", filter: "blur(80px)", borderRadius: "50%" }} />

          {/* Card head */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>👥</div>
              <span style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>The Crowd</span>
            </div>
            <div style={{
              background: "#150d00", border: "1px solid rgba(250,189,0,0.4)",
              color: "#fabd00", padding: "5px 14px", borderRadius: 999,
              fontFamily: geist, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              ⏱ 0:{String(timer).padStart(2, "0")} remaining
            </div>
          </div>

          <MiniBoard />

          {/* Votes */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: geist, fontSize: 11, letterSpacing: "0.1em", color: "#929096", textTransform: "uppercase" }}>
              <span>Current Votes</span>
              <span>Total: 842</span>
            </div>
            <VoteBar move="e4" pct={67} primary />
            <VoteBar move="Nf3" pct={33} />
          </div>

          {/* Host row */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #3d28bf, #1a1a2e)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>♟</div>
              <div>
                <div style={{ fontFamily: dmSans, fontWeight: 700, fontSize: 14 }}>KingSlayer94</div>
                <div style={{ fontFamily: geist, fontSize: 11, color: "#FF4B4B", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF4B4B", animation: "pulseDot 2s infinite", display: "inline-block" }} />
                  LIVE · 3,241
                </div>
              </div>
            </div>
            <Link href="/play" style={{
              background: "#333348", color: "#e2e0fc",
              padding: "9px 18px", borderRadius: 10,
              fontFamily: sora, fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
              textDecoration: "none",
            }}>VOTE NOW</Link>
          </div>
        </div>
      </section>

      {/* ═══ Arena Experience ═══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={{ fontFamily: sora, fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 56 }}>The Arena Experience</h2>
        <div style={{ display: "grid", gap: 24 }} className="md:grid-cols-3">
          {[
            { icon: "👤", accent: "#c5c0ff", title: "Join", body: "Step into any active match as part of the collective mind. Sign up in seconds and play for free." },
            { icon: "🗳️", accent: "#fabd00", title: "Vote", body: "Analyze the board and cast your vote. The move with the most community support gets played on the board." },
            { icon: "💰", accent: "#00E676", title: "Earn", body: "Win matches to climb the leaderboard and earn points, badges, and real community rewards." },
          ].map(({ icon, accent, title, body }) => (
            <div key={title} style={{
              ...glass, borderRadius: 24, padding: 36,
              borderTop: `2px solid ${accent}33`,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: "#333348",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 28,
              }}>{icon}</div>
              <h3 style={{ fontFamily: sora, fontSize: 20, fontWeight: 700, marginBottom: 12, color: accent }}>{title}</h3>
              <p style={{ fontFamily: dmSans, fontSize: 15, lineHeight: 1.6, color: "#c8c5cc", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Top Strategists + Brilliant Move ═══ */}
      <section style={{
        maxWidth: 1280, margin: "0 auto", padding: "72px 24px",
        display: "grid", gap: 40,
      }} className="lg:grid-cols-2">

        {/* Top Strategists */}
        <div>
          <h2 style={{ fontFamily: sora, fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Top Strategists</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { rank: "01", name: "Grandmaster_V", elr: "2,840 ELR", acc: "+12.4%", gold: true },
              { rank: "02", name: "Checkmate_Queen", elr: "2,715 ELR", acc: "+8.1%", gold: false },
              { rank: "03", name: "Gambit_Master", elr: "2,690 ELR", acc: "+5.2%", gold: false },
            ].map(({ rank, name, elr, acc, gold }) => (
              <div key={rank} style={{
                ...glass, borderRadius: 14, padding: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: geist, fontSize: 14, color: gold ? "#fabd00" : "#929096", width: 24 }}>{rank}</span>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: "linear-gradient(135deg, #28283d, #1a1a2e)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>{gold ? "♛" : "♞"}</div>
                  <div>
                    <div style={{ fontFamily: dmSans, fontWeight: 700, fontSize: 15 }}>{name}</div>
                    <div style={{ fontFamily: geist, fontSize: 12, color: "#929096" }}>{elr}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: geist, fontSize: 14, fontWeight: 700, color: "#00E676" }}>{acc}</div>
                  <div style={{ fontFamily: geist, fontSize: 10, color: "#929096", textTransform: "uppercase", letterSpacing: "0.08em" }}>Accuracy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brilliant Move */}
        <div style={{
          background: "linear-gradient(135deg, #1A1A2E 0%, rgba(250,189,0,0.08) 100%)",
          border: "1px solid rgba(250,189,0,0.3)",
          borderRadius: 24, padding: 32,
          boxShadow: "0 0 30px rgba(250,189,0,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <span style={{
                background: "#fabd00", color: "#3f2e00",
                padding: "4px 12px", borderRadius: 999,
                fontFamily: geist, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                display: "inline-block", marginBottom: 10,
              }}>Brilliant Move of the Day</span>
              <h3 style={{ fontFamily: sora, fontSize: 22, fontWeight: 700, margin: 0 }}>The &quot;Silent&quot; Sacrifice</h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: geist, fontSize: 16, fontWeight: 700, color: "#fabd00" }}>99.8%</div>
              <div style={{ fontFamily: geist, fontSize: 10, color: "#929096", textTransform: "uppercase" }}>Precision</div>
            </div>
          </div>

          {/* Replay panel */}
          <div style={{
            aspectRatio: "16 / 9",
            background: "#0c0c1f", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12, marginBottom: 20,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 60% 40%, rgba(250,189,0,0.12), transparent 60%)" }} />
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#fabd00",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, color: "#3f2e00",
              boxShadow: "0 0 30px rgba(250,189,0,0.5)", zIndex: 1,
            }}>▶</div>
            <span style={{ fontFamily: sora, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", zIndex: 1 }}>Watch Replay</span>
          </div>

          <p style={{ fontFamily: dmSans, fontSize: 14, fontStyle: "italic", color: "#c8c5cc", margin: 0 }}>
            &quot;A calculated risk that forced a back-rank mate in 4.&quot;
          </p>
        </div>
      </section>

      {/* ═══ Bottom CTA ═══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 24px 110px" }}>
        <div style={{
          ...glass, borderRadius: 48, padding: "clamp(48px, 8vw, 90px) 32px",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, rgba(197,192,255,0.04), transparent)" }} />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <h2 style={{ fontFamily: sora, fontSize: "clamp(28px, 4.5vw, 46px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
              Ready to play against thousands?
            </h2>
            <Link href="/signup" style={{
              background: "#3d28bf", color: "#fff",
              padding: "20px 48px", borderRadius: 18,
              fontFamily: sora, fontWeight: 700, fontSize: 19,
              textDecoration: "none",
              boxShadow: "0 0 35px rgba(124,111,255,0.4)",
            }}>Join ChessLive Arena</Link>
            <p style={{ fontFamily: geist, fontSize: 11, letterSpacing: "0.1em", color: "#929096", textTransform: "uppercase", margin: 0 }}>
              Free to join · No credit card required · Instant play
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer style={{
        background: "#0c0c1f", borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 24px",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", flexWrap: "wrap", justifyContent: "space-between",
          alignItems: "center", gap: 32,
        }}>
          <div>
            <div style={{ fontFamily: sora, fontSize: 18, fontWeight: 700, color: "#c7c4d7" }}>ChessLive</div>
            <p style={{ fontFamily: dmSans, fontSize: 13, color: "#929096", margin: "6px 0 0" }}>© 2026 ChessLive. Precision in every move.</p>
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Settings", "Press Kit"].map((l) => (
              <a key={l} href="#" style={{ fontFamily: dmSans, fontSize: 13, color: "#929096", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulseSq {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
