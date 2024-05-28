import { gemini15ProPreview } from "@genkit-ai/vertexai";
import { generate } from "@genkit-ai/ai";
import { noAuth, onFlow } from "@genkit-ai/firebase/functions";
import { z } from "zod";

import { type Introspect, introspect } from "../utils/introspect";

const PROMPT_PREFIX = `
You are a SQL developer working on a database. You are tasked to answer questions about the database.

Instructions:

1. You will be given a list of tables in JSON.
2. You will be given a question about the database.
3. You need to answer the question to the best of your ability.
`;

function generatePrompt(introspection: Introspect, query: string) {
  return `
${PROMPT_PREFIX}

<TableSchemaInJSON>
${JSON.stringify(introspection.tables, null, 2)}
</TableSchemaInJSON>

Question: ${query}
`;
}

const OutputSchema = z.string();

export const ask = onFlow(
  {
    name: "ask",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: OutputSchema,
    authPolicy: noAuth(),
  },
  async ({ query }) => {
    const db_introspection = await introspect();
    const prompt = generatePrompt(db_introspection, query);

    const llmResponse = await generate({
      prompt,
      model: gemini15ProPreview,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text();
  },
);
