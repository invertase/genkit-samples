import type { NextApiRequest, NextApiResponse } from "next";
import { configureGenkit } from "@genkit-ai/core";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/vertexai";
import { firebase } from "@genkit-ai/firebase";
import { vertexAI } from "@genkit-ai/vertexai";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import * as z from "zod";

// Configure Genkit
configureGenkit({
  plugins: [firebase(), vertexAI({ location: "us-central1" })],
  logLevel: "error",
  enableTracingAndMetrics: true,
});

// Define the flow
const menuSuggestionFlow = defineFlow(
  {
    name: "menuSuggestionFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const prompt = `Suggest an item for the menu of a ${subject} themed restaurant. You should give your response as markdown.`;

    const llmResponse = await generate({
      model: geminiPro,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text();
  }
);

// API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  try {
    if (req.method === "GET") {
      const { subject } = req.query;

      // Validate input
      const validatedSubject = z.string().parse(subject);

      // Run the Genkit flow
      const suggestion = await runFlow(menuSuggestionFlow, validatedSubject);

      // Send the response
      res.status(200).json({ message: suggestion });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
