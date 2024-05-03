import { useEffect, useState } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useMakeChessMove } from "../hooks/useChessMove";

const generateFen = (oldFen: string, move: string) => {
  const game = new Chess(oldFen);
  game.move(move);
  return game.fen();
};

export default function Board() {
  const [fen, setFen] = useState<string>("start");

  const [latestMessage, setLatestMessage] = useState<string>(
    "Hello! I am Gemini and I play chess. Make your move if you dare!"
  );

  const [reasoning, setReasoning] = useState<string>("");

  const { mutate, data, error } = useMakeChessMove();

  useEffect(() => {
    mutate("reset");
  }, []);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    try {
      const game = new Chess(fen);

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      const san = move.san;
      setFen(generateFen(fen, san));

      mutate(san);
      return true;
    } catch (error) {
      console.warn("Invalid move!", error);
      alert("Invalid move!");
      return false;
    }
  }

  useEffect(() => {
    if (error) {
      console.error(error);
    }
    if (data) {
      console.log(data);
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
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
      <Chessboard position={fen} onPieceDrop={onDrop} />
      <div className="mt-4 p-2 text-center font-bold">{latestMessage}</div>
      {reasoning && (
        <div className="mt-4 p-2 text-center font-bold">Reasoning:</div>
      )}
      <div className="mt-2 p-2 text-center">{reasoning}</div>
    </div>
  );
}
