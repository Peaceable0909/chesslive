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

// ─── Captured pieces helpers ──────────────────────────────────────────────────

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
    <div className="flex items-center gap-0.5 h-6 min-w-[80px]">
      {sorted.map((p, i) => (
        <span key={i} className="text-base leading-none opacity-80">{PIECE_UNICODE[p]}</span>
      ))}
      {advantage > 0 && <span className="text-xs text-[#c8c5cc] ml-1.5 font-[Geist]">+{advantage}</span>}
    </div>
  );
}

type PromotionInfo = { from: Square; to: Square; color: "w" | "b" } | null;

// ─── Nav bar ─────────────────────────────────────────────────────────────────

function NavBar({ username }: { username?: string }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#111125]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_0_20px_rgba(199,196,215,0.05)]">
      <div className="flex justify-between items-center px-5 md:px-10 h-16 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link href="/" className="font-[Sora] text-lg font-bold tracking-tighter text-[#c7c4d7]">
          CHESSLIVE
        </Link>
        {/* Nav links desktop */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/" className="text-sm text-[#c7c4d7] font-medium border-b border-[#c7c4d7] pb-0.5">Board</Link>
          <Link href="#" className="text-sm text-[#c8c5cc] hover:text-[#e2e0fc] transition-colors">Live</Link>
          <Link href="#" className="text-sm text-[#c8c5cc] hover:text-[#e2e0fc] transition-colors">Leaderboard</Link>
        </nav>
        {/* Auth */}
        <div className="flex items-center gap-2">
          {username ? (
            <Link href="/profile" className="px-4 py-1.5 bg-[#1e1e32] hover:bg-[#28283d] text-[#e2e0fc] text-sm rounded-lg transition-colors border border-white/[0.06]">
              {username} →
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-1.5 text-[#c8c5cc] hover:text-[#e2e0fc] text-sm transition-colors">Sign in</Link>
              <Link href="/signup" className="px-4 py-1.5 bg-[#3d28bf] hover:bg-[#4a35d0] text-white text-sm rounded-lg font-medium transition-colors shadow-[0_0_12px_rgba(61,40,191,0.4)]">
                Get 500 pts →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

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
            const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(61,40,191,0.3)" } };
            newMoves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(61,40,191,0.4)", borderRadius: "50%" }; });
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
        const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(61,40,191,0.3)" } };
        moves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(61,40,191,0.4)", borderRadius: "50%" }; });
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
    squareStyles[lastMove.to] = { ...(squareStyles[lastMove.to] || {}), background: "rgba(250,189,0,0.35)" };
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
    <div className="min-h-screen bg-[#0D0D1A]">
      <NavBar username={authUser?.username} />

      {/* Live ticker */}
      <div className="w-full bg-[#333348] border-b border-white/[0.06] mt-16 py-2 overflow-hidden flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#FF4B4B] pulse-dot ml-4 shrink-0" />
        <div className="ticker-wrap flex-1">
          <div className="ticker font-[Geist] text-xs tracking-wider text-[#c8c5cc] uppercase">
            42 games live · 18,406 voting · 1,247 moves/min · Biggest pool: 25,000 pts · Grandmaster Tournament in 14:02
          </div>
        </div>
      </div>

      {/* Board section */}
      <main className="max-w-[900px] mx-auto px-4 py-8">

        {/* Player + board layout */}
        <div className="flex gap-5 items-start">

          {/* Left: board + players */}
          <div className="flex flex-col flex-1 min-w-0">

            {/* Black player row */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e1e32] border border-white/[0.06] flex items-center justify-center text-base">♚</div>
                <span className="text-sm text-[#e2e0fc] font-medium font-[DM_Sans]">Black</span>
              </div>
              <CapturedPieces pieces={capturedByBlack} advantage={advantage < 0 ? Math.abs(advantage) : 0} />
            </div>

            {/* Board */}
            <div className="w-full rounded-xl overflow-hidden shadow-[0_0_40px_rgba(61,40,191,0.15)]">
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
                  boardStyle: { borderRadius: "12px", boxShadow: "none" },
                  darkSquareStyle: { backgroundColor: "#4a3728" },
                  lightSquareStyle: { backgroundColor: "#e8c888" },
                  allowDragging: !isGameOver,
                }}
              />
            </div>

            {/* White player row */}
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#e8c888] flex items-center justify-center text-base text-[#1a1a28]">♔</div>
                <span className="text-sm text-[#e2e0fc] font-medium font-[DM_Sans]">White</span>
              </div>
              <CapturedPieces pieces={capturedByWhite} advantage={advantage > 0 ? advantage : 0} />
            </div>

            {/* Status + controls */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`flex-1 px-4 py-2.5 rounded-xl text-sm text-center font-medium font-[Sora] transition-colors ${
                isGameOver ? "bg-[#150d00] border border-[#fabd00]/30 text-[#fabd00]" :
                game.isCheck() ? "bg-[#93000a]/40 border border-[#FF4B4B]/30 text-[#FF4B4B]" :
                "bg-[#1e1e32] border border-white/[0.06] text-[#c8c5cc]"
              }`}>{status}</div>
              <button
                onClick={() => setBoardFlipped(f => !f)}
                className="px-3 py-2.5 bg-[#1e1e32] hover:bg-[#28283d] border border-white/[0.06] text-[#c8c5cc] text-sm rounded-xl transition-colors"
                title="Flip board"
              >⇅</button>
              <button
                onClick={resetGame}
                className="px-4 py-2.5 bg-[#3d28bf] hover:bg-[#4a35d0] text-white text-sm rounded-xl font-medium transition-colors shadow-[0_0_12px_rgba(61,40,191,0.3)]"
              >New game</button>
            </div>
          </div>

          {/* Right: move history */}
          <div className="w-44 bg-[#1e1e32] rounded-xl border border-white/[0.06] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <div className="px-3 py-2.5 text-xs font-medium text-[#c8c5cc] border-b border-white/[0.06] uppercase tracking-wider font-[Geist]">
              Moves
            </div>
            <div ref={historyRef} className="flex-1 overflow-y-auto max-h-[420px] p-1">
              {pairMoves(moveHistory).length === 0 && (
                <p className="text-[#47464c] text-xs text-center py-6 font-[DM_Sans]">No moves yet</p>
              )}
              {pairMoves(moveHistory).map(([white, black], i) => (
                <div key={i} className="flex text-xs mb-0.5 rounded">
                  <span className="w-7 text-[#47464c] px-1 py-1 shrink-0 font-[Geist]">{i + 1}.</span>
                  <span className="flex-1 px-1 py-1 text-[#e2e0fc] hover:bg-[#28283d] rounded cursor-pointer font-[DM_Sans]">{white}</span>
                  {black && <span className="flex-1 px-1 py-1 text-[#e2e0fc] hover:bg-[#28283d] rounded cursor-pointer font-[DM_Sans]">{black}</span>}
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-white/[0.06] text-xs text-[#47464c] font-[Geist]">
              {moveHistory.length} move{moveHistory.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </main>

      {/* Promotion dialog */}
      {promotion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e32] border border-white/[0.06] rounded-2xl p-6 text-center shadow-2xl">
            <p className="text-[#e2e0fc] text-sm font-medium mb-4 font-[Sora]">Choose promotion piece</p>
            <div className="flex gap-3">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { applyMove(promotion.from, promotion.to, p); setPromotion(null); }}
                  className="w-14 h-14 bg-[#28283d] hover:bg-[#3d28bf] border border-white/[0.06] hover:border-[#3d28bf] rounded-xl text-3xl flex items-center justify-center transition-all"
                >
                  {PIECE_UNICODE[`${promotion.color}${p.toUpperCase()}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#1e1e32]/95 backdrop-blur-lg border-t border-white/[0.06] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] md:hidden">
        <div className="flex justify-around items-center h-20 px-2">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#c5c0ff] bg-[#3d28bf]/20 rounded-xl px-4 py-1.5">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
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
          <Link href="/profile" className="flex flex-col items-center gap-1 text-[#c8c5cc] hover:text-[#e2e0fc] px-4 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-xl">person</span>
            <span className="text-[10px] font-[Geist] tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
