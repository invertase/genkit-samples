import { GenerateResponse } from "@genkit-ai/ai";
import { Chess } from "chess.js";
import { generateOutputSchema } from "./schema";
import { z } from "zod";

// Function to reset the game state
export const resetGame = (
  game: Chess,
  gameHistory: string[],
  gameId: string
) => {
  game.reset();
  return {
    moveInPGNNotation: "",
    reasoning: "Game reset",
    trashTalk:
      "Hello! I am Gemini and I play chess. Make your move if you dare!",
    availableMoves: game.moves(),
    gameHistory: [],
    position: game.fen(),
    gameId,
    gameOver: false,
  };
};

// Function to handle game over state
export const gameOverResponse = (
  game: Chess,
  gameHistory: string[],
  gameId: string
) => ({
  moveInPGNNotation: game.pgn(),
  reasoning: "Game is over",
  trashTalk: "",
  availableMoves: [],
  gameHistory,
  position: game.fen(),
  gameId,
  gameOver: true,
  winner: game.turn() === "w" ? "Black" : "White",
});

// Helper function to validate moves using game history
export const validateMoveWithGameHistory = async (
  response: GenerateResponse<z.infer<typeof generateOutputSchema>>,
  gameHistory: string[]
) => {
  const tempGame = new Chess();
  gameHistory.forEach((move) => {
    tempGame.move(move);
  });
  const pgnMove = response.output()?.moveInPGNNotation;
  if (!pgnMove) {
    return false;
  }
  tempGame.move(pgnMove);
  return true;
};
