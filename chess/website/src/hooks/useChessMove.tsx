import { useMutation } from "@tanstack/react-query";
import { auth, appCheck } from "../firebase";
import { getToken } from "firebase/app-check";
import { getIdToken } from "firebase/auth";

export interface MoveResult {
  position: string;
  trashTalk?: string;
  smarmyComment?: string;
  reasoning: string;
  gameId: string;
  gameOver: boolean;
  winner?: string;
}

const postEngineMove = async ({
  move,
  gameId,
  model,
}: {
  move: string;
  gameId: string | undefined;
  model: "gemini15ProPreview" | "gpt4";
}): Promise<MoveResult> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const idToken = await getIdToken(user);

    const appCheckToken = await getToken(appCheck, true);

    const response = await fetch(`api/chessFlowStaging`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        "X-Firebase-AppCheck": appCheckToken.token,
      },
      body: JSON.stringify({ data: { move, gameId, model } }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { result } = await response.json();

    return result;
  } catch (error) {
    throw new Error("The model refused to make a legal move");
  }
};
export const useMakeChessMove = () =>
  useMutation<
    MoveResult,
    Error,
    {
      move: string;
      gameId: string | undefined;
      model: "gemini15ProPreview" | "gpt4";
    }
  >({
    mutationFn: postEngineMove,
    onError: (error: Error) => {
      console.error("Error making move:", error.message);
    },
  });
