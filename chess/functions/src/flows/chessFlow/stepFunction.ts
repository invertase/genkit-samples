import z from "zod";
import { Chess } from "chess.js";
import { simpleGenerateWithRetry } from "../../utils/retry";
import { chessPrompt } from "./prompt";
import { generateOutputSchema, inputSchema, outputSchema } from "./schema";
import * as admin from "firebase-admin";

import {
  gameOverResponse,
  resetGame,
  validateMoveWithGameHistory,
} from "./utils";
import { gemini15ProPreview } from "@genkit-ai/vertexai";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const chessGamesCollection = db.collection("chessGames");

type StepFunctionInput = z.infer<typeof inputSchema>;
type StepFunctionOutput = z.infer<typeof outputSchema>;

// Main chess step function, asynchronously handles a move
export const chessStepsFunction = async ({
  move,
  gameId,
}: StepFunctionInput): Promise<StepFunctionOutput> => {
  const game = new Chess();
  let gameDoc;
  let gameHistory: string[] = [];

  // If gameId is undefined, create a new document
  if (!gameId) {
    gameDoc = chessGamesCollection.doc();
    gameId = gameDoc.id;
  } else {
    gameDoc = chessGamesCollection.doc(gameId);
  }

  if (move === "reset") {
    console.log("Resetting game");
    gameHistory = [];
    await gameDoc.delete();
    return resetGame(game, gameHistory, gameId);
  }

  // Fetch the current game state from Firestore
  const gameDocSnapshot = await gameDoc.get();
  if (gameDocSnapshot.exists) {
    gameHistory = gameDocSnapshot.data()?.moves || [];
  }

  // Replay the game history to the current state
  gameHistory.forEach((historyMove) => {
    game.move(historyMove);
  });

  // Make the move
  game.move(move);
  gameHistory.push(move);

  // Save the current game state to Firestore
  await gameDoc.set({ moves: gameHistory });

  if (game.isGameOver()) {
    await gameDoc.delete();
    return gameOverResponse(game, gameHistory, gameId);
  }

  // Generate the next move using the AI
  const llmResponse = await simpleGenerateWithRetry({
    prompt: chessPrompt({
      gameHistoryString: gameHistory
        .map((value, i) => `${i}. ${value}`)
        .join(","),
      availableMovesString: game.moves().join(","),
      fenString: game.fen(),
    }),
    model: gemini15ProPreview,
    config: { temperature: 1 },
    customValidation: (res) => validateMoveWithGameHistory(res, gameHistory),
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

  const { moveInPGNNotation, reasoning, trashTalk } = output;

  // Update game with AI move
  game.move(moveInPGNNotation);
  gameHistory.push(moveInPGNNotation);

  // Save the updated game state to Firestore
  await gameDoc.set({ moves: gameHistory });

  return {
    moveInPGNNotation,
    reasoning,
    trashTalk,
    availableMoves: game.moves(),
    gameHistory,
    position: game.fen(),
    gameId, // Return gameId to the client
    gameOver: false,
  };
};
