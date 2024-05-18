import { useEffect, useState } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useMakeChessMove } from "../hooks/useChessMove";
import TabbedDialogue from "./TabbedDialogue";

const customBoardStyle: Record<string, string | number> = {
  borderRadius: "4px", // Rounded corners for a modern look

  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Soft shadow for depth
};

const customLightSquareStyle: Record<string, string> = {
  backgroundColor: "#94a3b8", // Light square color
};

const customDarkSquareStyle: Record<string, string> = {
  backgroundColor: "#475569", // Dark square color
};

const generateFen = (oldFen: string, move: string) => {
  const game = new Chess(oldFen);
  game.move(move);
  return game.fen();
};

export default function Board() {
  const [fen, setFen] = useState<string>("start");
  const [gameId, setGameId] = useState<string | undefined>(
    "" as string | undefined
  );
  const [latestMessage, setLatestMessage] = useState<string>(
    "Hello! I am Gemini and I play chess. Make your move if you dare!"
  );

  const [reasoning, setReasoning] = useState<string>("");

  const { mutate, data, error, isPending } = useMakeChessMove();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  useEffect(() => {
    mutate({ move: "reset", gameId });
  }, []);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    try {
      const game = new Chess(fen);
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) {
        throw new Error("Invalid move");
      }

      const san = move.san;
      setFen(generateFen(fen, san));
      mutate({ move: san, gameId });
      return true;
    } catch (error) {
      console.warn("Invalid move!", error);
      alert("Invalid move!");
      return false;
    }
  }

  function handleSquareClick(square: Square) {
    if (!selectedSquare) {
      setSelectedSquare(square);
    } else {
      const moveSuccess = onDrop(selectedSquare, square);
      if (moveSuccess) {
        setSelectedSquare(null);
      } else {
        setSelectedSquare(square);
      }
    }
  }

  useEffect(() => {
    if (error) {
      console.error(error);
    }
    if (data) {
      console.log(data);
      setGameId(data.gameId);
      setFen(data.position);
      if (fen !== "start") {
        setLatestMessage(data.smarmyComment);
        setReasoning(data.reasoning);
      }
    }
  }, [data, error]);

  if (error) {
    return (
      <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
        <div className="mt-4 p-2 text-center font-bold">Error:</div>
        <div className="mt-2 p-2 text-center">{error.message}</div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col items-center p-4 bg-white rounded-lg shadow">
        <div className={`relative w-full ${isPending ? "opacity-50" : ""}`}>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={handleSquareClick}
            customBoardStyle={customBoardStyle}
            customLightSquareStyle={customLightSquareStyle}
            customDarkSquareStyle={customDarkSquareStyle}
          />
          {isPending && (
            <>
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-700 bg-opacity-40"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
                <div className="w-20 h-20 animate-pulse">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div className="text-white lg:text-xl mt-2 font-bold opacity-80 animate-pulse">
                  Gemini is thinking...
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-white fixed w-[90%] rounded mt-4 p-4 font-semibold w-[90vw] md:w-[40vw]">
        <TabbedDialogue latestMessage={latestMessage} reasoning={reasoning} />
      </div>
    </>
  );
}
