import { useMutation } from "@tanstack/react-query";

const HOST = "http://localhost:3400";

interface MoveResult {
  position: string;
  smarmyComment: string;
  reasoning: string;
}

const postEngineMove = async (move: string): Promise<MoveResult> => {
  try {
    const response = await fetch(`${HOST}/chessFlow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: move }),
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
  useMutation<MoveResult, Error, string>({
    mutationFn: postEngineMove,
    onSuccess: (data) => {
      console.log("Move successful:", data);
    },
    onError: (error: Error) => {
      console.error("Error making move:", error.message);
    },
  });
