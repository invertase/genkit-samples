import z from "zod";

export const inputSchema = z.object({
  move: z.string(),
  gameId: z.string().optional(),
  model: z.string(),
});

export const generateOutputSchema = z.object({
  blackPiecesUnderAttack: z.string(),
  moveInPGNNotation: z.string(),
  reasoning: z.string(),
  trashTalk: z.string(),
});

export const outputSchema = z.object({
  moveInPGNNotation: z.string(),
  reasoning: z.string(),
  trashTalk: z.string(),
  availableMoves: z.array(z.string()),
  gameHistory: z.array(z.string()),
  position: z.string(),
  gameId: z.string(),
  gameOver: z.boolean(),
  winner: z.string().optional(),
});
