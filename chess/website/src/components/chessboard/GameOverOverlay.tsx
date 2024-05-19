interface GameOverOverlayProps {
  winner?: string;
  resetGame: () => void;
}

export default function GameOverOverlay({
  winner,
  resetGame,
}: GameOverOverlayProps) {
  return (
    <>
      <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-700 bg-opacity-60"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
        {winner === "White" ? (
          <div className="text-white lg:text-2xl mt-2 font-bold opacity-90 w-full text-center">
            Game Over! You won!
          </div>
        ) : (
          <div className="text-white lg:text-2xl mt-2 font-bold opacity-90 w-full text-center">
            Game Over! Gemini wins!
          </div>
        )}
        <button
          className="mt-4 bg-white text-gray-800 px-4 py-2 rounded font-semibold focus:outline-none"
          onClick={resetGame}
        >
          Play again!
        </button>
      </div>
    </>
  );
}
