import { Chessboard } from "react-chessboard";
import LoadingOverlay from "./LoadingOverlay";
import GameOverOverlay from "./GameOverOverlay";
import { Square } from "chess.js";

const customBoardStyle: Record<string, string | number> = {
  borderRadius: "4px", // Rounded corners for a modern look
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Soft shadow for depth
};

const customNotationStyle: Record<string, string> = {
  fontSize: "12px", // Font size for notation
};

const customLightSquareStyle: Record<string, string> = {
  backgroundColor: "#94a3b8", // Light square color
};

const customDarkSquareStyle: Record<string, string> = {
  backgroundColor: "#475569", // Dark square color
};

interface ChessboardDisplayProps {
  fen: string;
  onDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
  isPending: boolean;
  gameOver?: boolean;
  winner?: string;
  resetGame: () => void;
}

export default function ChessboardDisplay({
  fen,
  onDrop,
  isPending,
  gameOver,
  winner,
  resetGame,
}: ChessboardDisplayProps) {
  return (
    <div className="relative bg-white p-1 rounded w-[80vw] mobile-h:w-[40vw] mobile-h:h-[40vw] fixed md:w-[40vw]">
      <div
        className={` w-auto relative h-full ${isPending ? "opacity-50" : ""}`}
      >
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          customBoardStyle={customBoardStyle}
          customLightSquareStyle={customLightSquareStyle}
          customDarkSquareStyle={customDarkSquareStyle}
          customNotationStyle={customNotationStyle}
        />
        {isPending && <LoadingOverlay />}
        {gameOver && <GameOverOverlay winner={winner} resetGame={resetGame} />}
      </div>
    </div>
  );
}
