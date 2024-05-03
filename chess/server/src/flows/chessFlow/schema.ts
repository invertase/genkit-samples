import { z } from "zod";

export const inputSchema = z.string();

export const generateOutputSchema = z.object({
  moveInPGNNotation: z.string(),
  reasoning: z.string(),
  smarmyComment: z.string(),
});

export const outputSchema = z.object({
  moveInPGNNotation: z.string(),
  reasoning: z.string(),
  smarmyComment: z.string(),
  availableMoves: z.array(z.string()),
  gameHistory: z.array(z.string()),
  position: z.string(),
});
