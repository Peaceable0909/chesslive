"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

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
    <div className="flex items-center gap-1 h-6 min-w-[80px]">
      {sorted.map((p, i) => (
        <span key={i} className="text-lg leading-none opacity-90">{PIECE_UNICODE[p]}</span>
      ))}
      {advantage > 0 && <span className="text-xs text-gray-400 ml-1">+{advantage}</span>}
    </div>
  );
}

type PromotionInfo = { from: Square; to: Square; color: "w" | "b" } | null;

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
        .then(({ data: p }) => { if (p) setAuthUser({ username: p.username }); });
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
    // check if promotion
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
          // try selecting new piece
          const newMoves = game.moves({ square: sq, verbose: true });
          if (newMoves.length > 0) {
            setSelectedSquare(sq);
            const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(99,102,241,0.3)" } };
            newMoves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(99,102,241,0.4)", borderRadius: "50%" }; });
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
        const h: Record<string, React.CSSProperties> = { [sq]: { background: "rgba(99,102,241,0.3)" } };
        moves.forEach((m) => { h[(m as { to: string }).to] = { background: "rgba(99,102,241,0.4)", borderRadius: "50%" }; });
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
    squareStyles[lastMove.from] = { ...(squareStyles[lastMove.from] || {}), background: "rgba(255,255,100,0.25)" };
    squareStyles[lastMove.to] = { ...(squareStyles[lastMove.to] || {}), background: "rgba(255,255,100,0.35)" };
  }
  if (game.isCheck()) {
    const board = game.board();
    for (const row of board) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === game.turn()) {
          squareStyles[sq.square] = { background: "rgba(220,38,38,0.6)" };
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
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex items-center justify-between w-full max-w-[800px]">
        <h1 className="text-xl font-bold text-white">♟ ChessLive</h1>
        <div className="flex items-center gap-2">
          {authUser ? (
            <Link href="/profile" className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg transition-colors">
              {authUser.username} →
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">Sign in</Link>
              <Link href="/signup" className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg font-medium transition-colors">Get 500 pts →</Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-start w-full max-w-[800px]">

        {/* BOARD + PLAYERS */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Black player */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm">♚</div>
              <span className="text-sm text-white font-medium">Black</span>
            </div>
            <CapturedPieces pieces={capturedByBlack} advantage={advantage < 0 ? Math.abs(advantage) : 0} />
          </div>

          {/* Board */}
          <div className="w-full">
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
                boardStyle: { borderRadius: "6px", boxShadow: "0 4px 32px rgba(0,0,0,0.6)" },
                darkSquareStyle: { backgroundColor: "#4a3728" },
                lightSquareStyle: { backgroundColor: "#e8c888" },
                allowDragging: !isGameOver,
              }}
            />
          </div>

          {/* White player */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-900">♔</div>
              <span className="text-sm text-white font-medium">White</span>
            </div>
            <CapturedPieces pieces={capturedByWhite} advantage={advantage > 0 ? advantage : 0} />
          </div>

          {/* Status + controls */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`flex-1 px-3 py-2 rounded-lg text-sm text-center font-medium ${
              isGameOver ? "bg-amber-900/40 text-amber-300" :
              game.isCheck() ? "bg-red-900/40 text-red-300" :
              "bg-gray-800 text-gray-200"
            }`}>{status}</div>
            <button
              onClick={() => setBoardFlipped(f => !f)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              title="Flip board"
            >⇅</button>
            <button
              onClick={resetGame}
              className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
            >New game</button>
          </div>
        </div>

        {/* MOVE HISTORY */}
        <div className="w-44 bg-gray-900 rounded-lg border border-gray-800 flex flex-col overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-800 uppercase tracking-wider">
            Moves
          </div>
          <div ref={historyRef} className="flex-1 overflow-y-auto max-h-[420px] p-1">
            {pairMoves(moveHistory).length === 0 && (
              <p className="text-gray-600 text-xs text-center py-4">No moves yet</p>
            )}
            {pairMoves(moveHistory).map(([white, black], i) => (
              <div key={i} className="flex text-xs mb-0.5">
                <span className="w-7 text-gray-600 px-1 py-0.5 shrink-0">{i + 1}.</span>
                <span className="flex-1 px-1 py-0.5 text-gray-200 hover:bg-gray-800 rounded cursor-pointer">{white}</span>
                {black && <span className="flex-1 px-1 py-0.5 text-gray-200 hover:bg-gray-800 rounded cursor-pointer">{black}</span>}
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
            {moveHistory.length} move{moveHistory.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* PROMOTION DIALOG */}
      {promotion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-white text-sm font-medium mb-4">Choose promotion piece</p>
            <div className="flex gap-3">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    applyMove(promotion.from, promotion.to, p);
                    setPromotion(null);
                  }}
                  className="w-14 h-14 bg-gray-800 hover:bg-indigo-700 rounded-lg text-3xl flex items-center justify-center transition-colors"
                >
                  {PIECE_UNICODE[`${promotion.color}${p.toUpperCase()}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
