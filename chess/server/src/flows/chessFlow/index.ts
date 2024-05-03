import z from "zod";
import { Chess } from "chess.js";
import { simpleGenerateWithRetry } from "../../utils/retry";
import { chessPrompt } from "./prompt";
import { generateOutputSchema, inputSchema, outputSchema } from "./schema";
import { defineFlow, StepsFunction } from "@genkit-ai/flow";
import {
  gameOverResponse,
  resetGame,
  validateMoveWithGameHistory,
} from "./utils";
import { geminiPro } from "@genkit-ai/vertexai";

// TODO: handle history in a more persistent way (undecided)
export let gameHistory: string[] = [];

type StepFunctionInput = z.infer<typeof inputSchema>;
type StepFunctionOutput = z.infer<typeof outputSchema>;

// Main chess step function, asynchronously handles a move
export const chessStepsFunction = async (
  move: StepFunctionInput
): Promise<StepFunctionOutput> => {
  const game = new Chess();

  if (move === "reset") {
    console.log("Resetting game");
    gameHistory = [];
    return resetGame(game, gameHistory);
  }

  if (game.isGameOver()) {
    return gameOverResponse(game, gameHistory);
  }

  // Replay the game history to the current state
  gameHistory.forEach((historyMove) => {
    game.move(historyMove);
  });

  // Make the move
  game.move(move);
  gameHistory.push(move);

  // Generate the next move using the AI
  const llmResponse = await simpleGenerateWithRetry({
    prompt: chessPrompt({
      gameHistoryString: gameHistory.join(" "),
      availableMovesString: game.moves().join(" "),
    }),
    model: geminiPro,
    config: { temperature: 1 },
    customValidation: validateMoveWithGameHistory,
    output: {
      format: "json",
      schema: generateOutputSchema,
    },
    retries: 5,
  });

  // Handle AI output
  const output = llmResponse.output();
  if (output === null) {
    throw new Error("No output from LLM");
  }

  const { moveInPGNNotation, reasoning, smarmyComment } = output;

  // Update game with AI move
  game.move(moveInPGNNotation);
  gameHistory.push(moveInPGNNotation);

  return {
    moveInPGNNotation,
    reasoning,
    smarmyComment,
    availableMoves: game.moves(),
    gameHistory,
    position: game.fen(),
  };
};

export const chessFlow = defineFlow(
  {
    name: "chessFlow",
    inputSchema,
    outputSchema,
  },
  chessStepsFunction
);
