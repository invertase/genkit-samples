import dotenv from 'dotenv';
dotenv.config();

// import { generate } from "@genkit-ai/ai";
// import { firebaseAuth } from "@genkit-ai/firebase/auth";
import { noAuth, onFlow } from "@genkit-ai/firebase/functions";
import * as z from "zod";
import { generate } from "@genkit-ai/ai";
import { getPrompt } from "./prompts";
import { gemini15ProPreview } from '@genkit-ai/vertexai';


export const tsFlow = onFlow(
  {
    name: "tsFlow",
    inputSchema: z.object({issueBody: z.string(), content: z.string()}),
    outputSchema: z.string(),
    authPolicy: noAuth(),
  },
  async ({issueBody, content}) => {

    const llmResponse = await generate({
      model: gemini15ProPreview,
      prompt: getPrompt(content, issueBody),
    });
    return llmResponse.text();
  }
);
