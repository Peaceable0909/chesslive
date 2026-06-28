"use client";

import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function Home() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<Record<string, object>>({});

  function makeMove(sourceSquare: string, targetSquare: string) {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!move) return false;
    setGame(gameCopy);
    setSelectedSquare(null);
    setLegalSquares({});
    return true;
  }

  const onSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      const moved = makeMove(selectedSquare, square);
      if (!moved) {
        const moves = game.moves({ square: square as any, verbose: true });
        if (moves.length > 0) {
          setSelectedSquare(square);
          const highlights: Record<string, object> = {};
          moves.forEach((m) => { highlights[m.to] = { background: "rgba(99,102,241,0.4)", borderRadius: "50%" }; });
          setLegalSquares(highlights);
        } else {
          setSelectedSquare(null);
          setLegalSquares({});
        }
      }
    } else {
      const moves = game.moves({ square: square as any, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        const highlights: Record<string, object> = {};
        highlights[square] = { background: "rgba(99,102,241,0.2)" };
        moves.forEach((m) => { highlights[m.to] = { background: "rgba(99,102,241,0.4)", borderRadius: "50%" }; });
        setLegalSquares(highlights);
      }
    }
  }, [selectedSquare, game]);

  function resetGame() {
    setGame(new Chess());
    setSelectedSquare(null);
    setLegalSquares({});
  }

  const status = game.isCheckmate()
    ? `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins!`
    : game.isDraw()
    ? "Draw!"
    : game.isCheck()
    ? `${game.turn() === "w" ? "White" : "Black"} is in check`
    : `${game.turn() === "w" ? "White" : "Black"} to move`;

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold text-white mb-1">♟ ChessLive</h1>
        <p className="text-gray-400 text-sm">Stage 1 — The board is alive</p>
      </div>

      <div className="w-full max-w-[500px]">
        <Chessboard
          position={game.fen()}
          onPieceDrop={makeMove}
          onSquareClick={onSquareClick}
          customSquareStyles={legalSquares}
          customBoardStyle={{ borderRadius: "8px", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
          customDarkSquareStyle={{ backgroundColor: "#4a3728" }}
          customLightSquareStyle={{ backgroundColor: "#e8c888" }}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white">{status}</div>
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New game
        </button>
      </div>
    </main>
  );
}
