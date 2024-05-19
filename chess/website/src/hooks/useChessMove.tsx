import { useMutation } from "@tanstack/react-query";

interface MoveResult {
  position: string;
  smarmyComment: string;
  reasoning: string;
  gameId: string;
  gameOver: boolean;
  winner?: string;
}

const postEngineMove = async ({
  move,
  gameId,
}: {
  move: string;
  gameId: string | undefined;
}): Promise<MoveResult> => {
  try {
    const response = await fetch(`api/chessFlow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { move, gameId } }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { result } = await response.json();

    return result;
  } catch (error) {
    throw new Error("Gemini refused to make a legal move");
  }
};

export const useMakeChessMove = () =>
  useMutation<MoveResult, Error, { move: string; gameId: string | undefined }>({
    mutationFn: postEngineMove,
    onError: (error: Error) => {
      console.error("Error making move:", error.message);
    },
  });
