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
  rateLimitError: boolean;
  acceptRateLimitMessage: () => void;
}

export default function ChessboardDisplay({
  fen,
  onDrop,
  isPending,
  gameOver,
  winner,
  resetGame,
  rateLimitError,
  acceptRateLimitMessage,
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
        {rateLimitError && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-700 bg-opacity-60">
            <div className="text-white lg:text-2xl mt-2 font-bold opacity-90 w-full text-center">
              Gemini rate limit exceeded. Please wait a few minutes before
              making another move.
            </div>
            <button
              className="mt-4 bg-white text-gray-800 px-4 py-2 rounded font-semibold focus:outline-none"
              onClick={acceptRateLimitMessage}
            >
              OK
            </button>
          </div>
        )}
        {gameOver && <GameOverOverlay winner={winner} resetGame={resetGame} />}
      </div>
    </div>
  );
}
