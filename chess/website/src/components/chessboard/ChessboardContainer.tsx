import { useEffect, useState } from "react";
import { Chess, Square } from "chess.js";
import ChessboardDisplay from "./ChessboardDisplay";
import TabbedDialogue from "../TabbedDialogue";
import { MoveResult, useMakeChessMove } from "../../hooks/useChessMove";
import "./index.css";
import { UseMutateFunction } from "@tanstack/react-query";

const generateFen = (oldFen: string, move: string) => {
  const game = new Chess(oldFen);
  game.move(move);
  return game.fen();
};

export default function ChessboardContainer() {
  const [fen, setFen] = useState<string>("start");
  const [gameId, setGameId] = useState<string | undefined>(
    "" as string | undefined
  );
  const [latestMessage, setLatestMessage] = useState<string>(
    "Hello! I am Gemini and I play chess. Make your move if you dare!"
  );

  const [acceptedRateLimitMessage, setAcceptedRateLimitMessage] =
    useState(true);

  const [reasoning, setReasoning] = useState<string>("");

  const { mutate, data, error, isPending } = useMakeChessMove();

  useEffect(() => {
    mutate({ move: "reset", gameId });
  }, []);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
    if (data) {
      setGameId(data.gameId);
      setFen(data.position);
      if (fen !== "start") {
        setLatestMessage(data.trashTalk || data.smarmyComment || "");
        setReasoning(data.reasoning);
      }
      if (data.gameOver) {
        setLatestMessage(`Game over! ${data.winner} wins.`);
      }
      if (data.errorCode === 429) {
        setAcceptedRateLimitMessage(false);
      }
    }
  }, [data, error]);

  if (error) {
    return (
      <div className="flex flex-col items-center p-4  bg-white rounded-lg shadow">
        <div className="mt-4 p-2 text-center font-bold">Error:</div>
        <div className="mt-2 p-2 text-center">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="absolute h-full w-full flex flex-col pt-20 mobile-h:pt-14 mobile-h:flex-row h-screen w-screen gap-4 p-2 mobile-h:justify-around justify-center items-center md:flex-col-reverse">
      <TabbedDialogue latestMessage={latestMessage} reasoning={reasoning} />
      <ChessboardDisplay
        fen={fen}
        onDrop={(sourceSquare, targetSquare) =>
          onDrop(sourceSquare, targetSquare, fen, setFen, mutate, gameId)
        }
        acceptRateLimitMessage={() => setAcceptedRateLimitMessage(true)}
        isPending={isPending}
        gameOver={data?.gameOver}
        rateLimitError={!acceptedRateLimitMessage}
        winner={data?.winner}
        resetGame={() => mutate({ move: "reset", gameId })}
      />
    </div>
  );
}

function onDrop(
  sourceSquare: Square,
  targetSquare: Square,
  fen: string,
  setFen: (fen: string) => void,
  mutate: UseMutateFunction<
    MoveResult,
    Error,
    { move: string; gameId: string | undefined },
    unknown
  >,
  gameId?: string
) {
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
    return false;
  }
}
