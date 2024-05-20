import z from "zod";
import { Chess } from "chess.js";
import { chessPrompt } from "./prompt";
import { inputSchema, outputSchema } from "./schema";
import * as admin from "firebase-admin";

import { gameOverResponse, resetGame } from "./utils";
import { generateMove } from "./generate";

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
  model,
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

  const prompt = chessPrompt({
    gameHistoryString: gameHistory
      .map((value, i) => `${i}. ${value}`)
      .join(","),
    availableMovesString: game.moves().join(","),
    fenString: game.fen(),
  });

  console.log("Model: ", model);

  const output = await generateMove(
    model || "gemini15ProPreview",
    prompt,
    gameHistory
  );

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
