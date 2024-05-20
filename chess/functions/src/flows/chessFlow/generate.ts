import { gemini15ProPreview } from "@genkit-ai/vertexai";
import { simpleGenerateWithRetry } from "../../utils/retry";
import { gpt4 } from "genkitx-openai-plugin";
import { validateMoveWithGameHistory } from "./utils";
import { generateOutputSchema } from "./schema";
import z from "zod";

export async function generateMove(
  model: string,
  prompt: string,
  gameHistory: string[]
): Promise<z.infer<typeof generateOutputSchema>> {
  if (model === "gemini15ProPreview") {
    const llmResponse = await simpleGenerateWithRetry({
      prompt,
      model: gemini15ProPreview,
      config: { temperature: 1 },
      customValidation: (res) =>
        validateMoveWithGameHistory(res.output(), gameHistory),
      output: {
        format: "json",
        schema: generateOutputSchema,
      },
      retries: 5,
    });
    const output = llmResponse.output();
    if (output === null) {
      throw new Error("No output from LLM");
    }

    return output;
  }

  if (model === "gpt4") {
    console.error("gpt4", gpt4);
    const llmResponse = await simpleGenerateWithRetry({
      prompt:
        prompt +
        `return a json object of type { blackPiecesUnderAttack: string, reasoning: string, moveInPGNNotation: string, trashTalk: string}`,
      model: gpt4,
      config: { temperature: 1 },
      customValidation: (res) => {
        const text = res.text();

        const json = JSON.parse(text);

        return validateMoveWithGameHistory(json, gameHistory);
      },
      retries: 5,
    });
    const output = llmResponse.text();

    if (output === null) {
      throw new Error("No output from LLM");
    }

    try {
      const json = JSON.parse(output);
      return json;
    } catch (e) {
      throw new Error("Invalid JSON response from LLM");
    }
  }
  throw new Error("Invalid model");
}
