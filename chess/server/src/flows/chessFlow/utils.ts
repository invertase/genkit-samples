import { GenerateResponse } from "@genkit-ai/ai";
import { Chess } from "chess.js";
import { generateOutputSchema } from "./schema";
import { z } from "zod";
import { gameHistory } from ".";

// Function to reset the game state
export const resetGame = (game: Chess, gameHistory: string[]) => {
  game.reset();
  return {
    moveInPGNNotation: "",
    reasoning: "Game reset",
    smarmyComment: "",
    availableMoves: game.moves(),
    gameHistory: [],
    position: game.fen(),
  };
};

// Function to handle game over state
export const gameOverResponse = (game: Chess, gameHistory: string[]) => ({
  moveInPGNNotation: game.pgn(),
  reasoning: "Game is over",
  smarmyComment: "",
  availableMoves: [],
  gameHistory,
  position: game.fen(),
});

// Helper function to validate moves using game history
export const validateMoveWithGameHistory = async (
  response: GenerateResponse<z.infer<typeof generateOutputSchema>>
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
