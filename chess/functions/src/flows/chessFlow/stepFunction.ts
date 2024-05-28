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

class ChessGameError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ChessGameError";
  }
}

// Main chess step function, asynchronously handles a move
export const chessStepsFunction = async ({
  move,
  gameId,
}: StepFunctionInput): Promise<StepFunctionOutput> => {
  const game = new Chess();
  let gameDoc;
  let gameHistory: string[] = [];

  try {
    // If gameId is undefined, create a new document
    if (!gameId) {
      gameDoc = chessGamesCollection.doc();
      console.debug("Creating new game with id:", gameDoc.id);
      gameId = gameDoc.id;
    } else {
      gameDoc = chessGamesCollection.doc(gameId);
      console.debug("Using existing game with id:", gameId);
    }

    if (move === "reset") {
      console.debug("Resetting game");
      gameHistory = [];
      await gameDoc.delete();
      return resetGame(game, gameHistory, gameId);
    }

    // Fetch the current game state from Firestore
    const gameDocSnapshot = await gameDoc.get();
    if (gameDocSnapshot.exists) {
      gameHistory = gameDocSnapshot.data()?.moves || [];
    }

    console.debug("Game history:", gameHistory);
    // Replay the game history to the current state
    gameHistory.forEach((historyMove) => {
      game.move(historyMove);
    });

    console.debug(game.fen());

    // Make the move
    try {
      game.move(move);
    } catch (error) {
      throw new ChessGameError("Invalid move", 400);
    }
    gameHistory.push(move);

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
      delayMs: 1000,
    });

    // Handle AI output
    const output = llmResponse.output();
    if (output === null) {
      throw new ChessGameError("No output from LLM", 500);
    }

    const { moveInPGNNotation, reasoning, trashTalk } = output;

    // Update game with AI move
    const isAiMoveValid = game.move(moveInPGNNotation);
    if (!isAiMoveValid) {
      throw new ChessGameError("Invalid move by AI", 500);
    }
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
  } catch (error) {
    console.error(
      `Error in chessStepsFunction:`,
      JSON.stringify(error, null, 2)
    );

    // Handle 429 rate limiting errors
    if ((error as Error).message.includes("429")) {
      error = new ChessGameError(
        "Rate limit exceeded. Please try again later.",
        429
      );
    }

    if (error instanceof ChessGameError) {
      return {
        errorCode: error.statusCode,
        moveInPGNNotation: "",
        reasoning: error.message,
        trashTalk: "",
        availableMoves: game.moves(),
        gameHistory,
        position: game.fen(),
        gameId: gameId!,
        gameOver: false,
      };
    }

    return {
      errorCode: 500,
      moveInPGNNotation: "",
      reasoning: "Internal Server Error",
      trashTalk: "",
      availableMoves: game.moves(),
      gameHistory,
      position: game.fen(),
      gameId: gameId!,
      gameOver: false,
    };
  }
};
