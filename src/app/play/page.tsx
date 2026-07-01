"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

// ─── Piece data ───────────────────────────────────────────────────────────────

const PIECE_UNICODE: Record<string, string> = {
  wP: "♙", wN: "♘", wB: "♗", wR: "♖", wQ: "♕", wK: "♔",
  bP: "♟", bN: "♞", bB: "♝", bR: "♜", bQ: "♛", bK: "♚",
};

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

function getCapturedPieces(game: Chess) {
  const initW: Record<string, number> = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
  const initB: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const curW: Record<string, number> = {};
  const curB: Record<string, number> = {};

  game.board().flat().forEach((sq) => {
    if (!sq) return;
    if (sq.color === "w") curW[sq.type.toUpperCase()] = (curW[sq.type.toUpperCase()] || 0) + 1;
    else curB[sq.type] = (curB[sq.type] || 0) + 1;
  });

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  Object.entries(initB).forEach(([p, count]) => {
    const remaining = curB[p] || 0;
    for (let i = 0; i < count - remaining; i++) capturedByWhite.push(`b${p.toUpperCase()}`);
  });
  Object.entries(initW).forEach(([p, count]) => {
    const remaining = curW[p] || 0;
    for (let i = 0; i < count - remaining; i++) capturedByBlack.push(`w${p}`);
  });
  return { capturedByWhite, capturedByBlack };
}

function getMaterialAdvantage(capturedByWhite: string[], capturedByBlack: string[]) {
  const sum = (pieces: string[]) =>
    pieces.reduce((acc, p) => acc + (PIECE_VALUES[p[1].toLowerCase()] || 0), 0);
  return sum(capturedByWhite) - sum(capturedByBlack);
}

function CapturedPieces({ pieces, advantage }: { pieces: string[]; advantage: number }) {
  const sorted = [...pieces].sort((a, b) => (PIECE_VALUES[b[1].toLowerCase()] || 0) - (PIECE_VALUES[a[1].toLowerCase()] || 0));
  return (
    <div className="flex items-center gap-0.5 min-h-[24px]">
      {sorted.map((p, i) => (
        <span key={i} className="text-base leading-none">{PIECE_UNICODE[p]}</span>
      ))}
      {advantage > 0 && <span className="text-xs text-[#c8c5cc] ml-1.5">+{advantage}</span>}
    </div>
  );
}

type PromotionInfo = { from: Square; to: Square; color: "w" | "b" } | null;

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Record<string, React.CSSProperties>>({});
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [promotion, setPromotion] = useState<PromotionInfo>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const [authUser, setAuthUser] = useState<{ username?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("chesslive_profiles").select("username").eq("id", data.user.id).single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data: p }: { data: any }) => { if (p) setAuthUser({ username: p.username }); });
    });
  }, []);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [moveHistory]);

  function applyMove(sourceSquare: Square, targetSquare: Square, promotionPiece?: "q" | "r" | "b" | "n"): boolean {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: promotionPiece || "q" });
    if (!move) return false;
    setGame(gameCopy);
    setLastMove({ from: sourceSquare, to: targetSquare });
    setMoveHistory(gameCopy.history());
    setSelectedSquare(null);
    setLegalSquares({});
    return true;
  }

  function tryMove(sourceSquare: Square, targetSquare: Square): boolean {
    const piece = game.get(sourceSquare);
    const isPromotion = piece?.type === "p" &&
      ((piece.color === "w" && targetSquare[1] === "8") ||
       (piece.color === "b" && targetSquare[1] === "1"));
    if (isPromotion) {
      setPromotion({ from: sourceSquare, to: targetSquare, color: piece.color });
      return true;
    }
    return applyMove(sourceSquare, targetSquare);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSquareClick = useCallback(({ square }: any) => {
    const sq = square as Square;
    if (selectedSquare) {
      const moved = tryMove(selectedSquare, sq);
      if (!moved) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const isLegal = moves.some((m) => (m as { to: string }).to === sq);
        if (!isLegal) {
          const newMoves = game.moves({ square: sq, verbose: true });
          if (newMoves.length > 0) {
            setSelectedSquare(sq);
            const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(61,40,191,0.35)" } };
            newMoves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(61,40,191,0.45)", borderRadius: "50%" }; });
            setLegalSquares(h);
          } else {
            setSelectedSquare(null);
            setLegalSquares({});
          }
        }
      }
    } else {
      const moves = game.moves({ square: sq, verbose: true });
      if (moves.length > 0 && game.get(sq)?.color === game.turn()) {
        setSelectedSquare(sq);
        const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(61,40,191,0.35)" } };
        moves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(61,40,191,0.45)", borderRadius: "50%" }; });
        setLegalSquares(h);
      }
    }
  }, [selectedSquare, game]);

  function resetGame() {
    setGame(new Chess());
    setSelectedSquare(null);
    setLegalSquares({});
    setLastMove(null);
    setMoveHistory([]);
    setPromotion(null);
  }

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(game);
  const advantage = getMaterialAdvantage(capturedByWhite, capturedByBlack);

  const squareStyles: Record<string, React.CSSProperties> = { ...legalSquares };
  if (lastMove) {
    squareStyles[lastMove.from] = { ...(squareStyles[lastMove.from] || {}), background: "rgba(250,189,0,0.2)" };
    squareStyles[lastMove.to] = { ...(squareStyles[lastMove.to] || {}), background: "rgba(250,189,0,0.38)" };
  }
  if (game.isCheck()) {
    for (const row of game.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === game.turn()) {
          squareStyles[sq.square] = { background: "rgba(255,75,75,0.55)" };
        }
      }
    }
  }

  const status = game.isCheckmate()
    ? `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins!`
    : game.isStalemate() ? "Stalemate — Draw"
    : game.isInsufficientMaterial() ? "Draw — Insufficient material"
    : game.isThreefoldRepetition() ? "Draw — Threefold repetition"
    : game.isDraw() ? "Draw"
    : game.isCheck() ? `${game.turn() === "w" ? "White" : "Black"} is in check`
    : `${game.turn() === "w" ? "White" : "Black"} to move`;

  const isGameOver = game.isGameOver();

  const pairMoves = (history: string[]) => {
    const pairs: [string, string | null][] = [];
    for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1] ?? null]);
    return pairs;
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D0D1A" }}>

      {/* ── Fixed nav ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(17,17,37,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        height: 64,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <Link href="/" style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#c7c4d7", textDecoration: "none" }}>
          CHESSLIVE
        </Link>

        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#929096", textDecoration: "none" }}>Home</Link>
          <Link href="/play" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#c7c4d7", textDecoration: "none", fontWeight: 600, borderBottom: "2px solid #c7c4d7", paddingBottom: 2 }}>Board</Link>
          <Link href="#" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#929096", textDecoration: "none" }}>Live</Link>
          <Link href="#" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#929096", textDecoration: "none" }}>Leaderboard</Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {authUser ? (
            <Link href="/profile" style={{
              padding: "6px 14px", background: "#1e1e32", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, color: "#e2e0fc", fontSize: 13, textDecoration: "none",
              fontFamily: "DM Sans, sans-serif",
            }}>{authUser.username} →</Link>
          ) : (
            <>
              <Link href="/login" style={{ padding: "6px 12px", color: "#929096", fontSize: 13, textDecoration: "none", fontFamily: "DM Sans, sans-serif" }}>Sign in</Link>
              <Link href="/signup" style={{
                padding: "6px 14px", background: "#3d28bf", borderRadius: 10,
                color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "DM Sans, sans-serif",
                boxShadow: "0 0 12px rgba(61,40,191,0.4)",
              }}>Get 500 pts →</Link>
            </>
          )}
        </div>
      </header>

      {/* ── Live ticker ── */}
      <div style={{
        marginTop: 64,
        background: "#1e1e32",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 0",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#FF4B4B",
          marginLeft: 16, flexShrink: 0,
          animation: "pulseDot 2s infinite",
        }} />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <span style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            fontFamily: "Geist, monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#c8c5cc",
            textTransform: "uppercase",
            animation: "tickerScroll 30s linear infinite",
          }}>
            42 games live &nbsp;·&nbsp; 18,406 voting &nbsp;·&nbsp; 1,247 moves/min &nbsp;·&nbsp; Biggest pool: 25,000 pts &nbsp;·&nbsp; Grandmaster Tournament in 14:02 &nbsp;·&nbsp; New Challenge from Magnus &nbsp;&nbsp;&nbsp;&nbsp; 42 games live &nbsp;·&nbsp; 18,406 voting &nbsp;·&nbsp; 1,247 moves/min
          </span>
        </div>
      </div>

      {/* ── Board area ── */}
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* Board column */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Black player */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8, padding: "0 4px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#333348", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "#e2e0fc",
                }}>♚</div>
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, color: "#e2e0fc" }}>Black</span>
              </div>
              <CapturedPieces pieces={capturedByBlack} advantage={advantage < 0 ? Math.abs(advantage) : 0} />
            </div>

            {/* Chess board */}
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 0 40px rgba(61,40,191,0.12), 0 8px 32px rgba(0,0,0,0.5)" }}>
              <Chessboard
                options={{
                  position: game.fen(),
                  boardOrientation: boardFlipped ? "black" : "white",
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    if (!targetSquare) return false;
                    return tryMove(sourceSquare as Square, targetSquare as Square);
                  },
                  onSquareClick,
                  squareStyles,
                  boardStyle: { borderRadius: 0, boxShadow: "none" },
                  darkSquareStyle: { backgroundColor: "#4a3728" },
                  lightSquareStyle: { backgroundColor: "#e8c888" },
                  allowDragging: !isGameOver,
                }}
              />
            </div>

            {/* White player */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 8, padding: "0 4px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#e8e8e8", border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "#1a1a28",
                }}>♔</div>
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, color: "#e2e0fc" }}>White</span>
              </div>
              <CapturedPieces pieces={capturedByWhite} advantage={advantage > 0 ? advantage : 0} />
            </div>

            {/* Status + controls */}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <div style={{
                flex: 1, padding: "10px 16px",
                borderRadius: 12, textAlign: "center",
                fontFamily: "Sora, sans-serif", fontSize: 13, fontWeight: 600,
                ...(isGameOver
                  ? { background: "rgba(21,13,0,0.9)", border: "1px solid rgba(250,189,0,0.3)", color: "#fabd00" }
                  : game.isCheck()
                  ? { background: "rgba(147,0,10,0.4)", border: "1px solid rgba(255,75,75,0.3)", color: "#FF4B4B" }
                  : { background: "#1e1e32", border: "1px solid rgba(255,255,255,0.06)", color: "#c8c5cc" }),
              }}>{status}</div>

              <button
                onClick={() => setBoardFlipped(f => !f)}
                title="Flip board"
                style={{
                  padding: "10px 14px",
                  background: "#1e1e32", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, color: "#c8c5cc", fontSize: 16, cursor: "pointer",
                }}>⇅</button>

              <button
                onClick={resetGame}
                style={{
                  padding: "10px 18px",
                  background: "#3d28bf", border: "none",
                  borderRadius: 12, color: "#fff",
                  fontFamily: "Sora, sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 0 12px rgba(61,40,191,0.35)",
                }}>New game</button>
            </div>
          </div>

          {/* Move history */}
          <div style={{
            width: 168, flexShrink: 0,
            background: "#1e1e32", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}>
            <div style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "Geist, monospace", fontSize: 11,
              color: "#929096", letterSpacing: "0.08em", textTransform: "uppercase",
            }}>Moves</div>

            <div ref={historyRef} style={{ flex: 1, overflowY: "auto", maxHeight: 480, padding: 4 }}>
              {pairMoves(moveHistory).length === 0 ? (
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#47464c", textAlign: "center", padding: "24px 0" }}>
                  No moves yet
                </p>
              ) : (
                pairMoves(moveHistory).map(([white, black], i) => (
                  <div key={i} style={{ display: "flex", fontSize: 12, marginBottom: 2 }}>
                    <span style={{ width: 28, color: "#47464c", padding: "3px 4px", fontFamily: "Geist, monospace" }}>{i + 1}.</span>
                    <span style={{ flex: 1, padding: "3px 4px", color: "#e2e0fc", fontFamily: "DM Sans, sans-serif", borderRadius: 4, cursor: "pointer" }}>{white}</span>
                    {black && <span style={{ flex: 1, padding: "3px 4px", color: "#e2e0fc", fontFamily: "DM Sans, sans-serif", borderRadius: 4, cursor: "pointer" }}>{black}</span>}
                  </div>
                ))
              )}
            </div>

            <div style={{
              padding: "8px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "Geist, monospace", fontSize: 11, color: "#47464c",
            }}>{moveHistory.length} move{moveHistory.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </main>

      {/* ── Promotion dialog ── */}
      {promotion && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "#1e1e32", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 28, textAlign: "center",
          }}>
            <p style={{ fontFamily: "Sora, sans-serif", fontSize: 14, fontWeight: 600, color: "#e2e0fc", marginBottom: 16 }}>
              Choose promotion piece
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { applyMove(promotion.from, promotion.to, p); setPromotion(null); }}
                  style={{
                    width: 56, height: 56, background: "#28283d",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                    fontSize: 28, cursor: "pointer", color: "#e2e0fc",
                  }}
                >
                  {PIECE_UNICODE[`${promotion.color}${p.toUpperCase()}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom nav (mobile) ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(30,30,50,0.97)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        height: 72, padding: "0 8px",
      }} className="md:hidden">
        {[
          { icon: "home", label: "Home", href: "/", active: false },
          { icon: "sensors", label: "Live", href: "#", active: false },
          { icon: "grid_view", label: "Play", href: "/play", active: true },
          { icon: "person", label: "Profile", href: "/profile", active: false },
        ].map(({ icon, label, href, active }) => (
          <Link key={label} href={href} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            textDecoration: "none",
            color: active ? "#c5c0ff" : "#929096",
            background: active ? "rgba(61,40,191,0.2)" : "transparent",
            borderRadius: 12, padding: "6px 16px",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
            <span style={{ fontSize: 10, fontFamily: "Geist, monospace", letterSpacing: "0.06em" }}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,75,75,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255,75,75,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,75,75,0); }
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
