import { z } from "zod";
import { Introspect, introspect } from "../introspect";
import { defineFlow } from "@genkit-ai/flow";
import { generate } from "@genkit-ai/ai";
import { gemini15ProPreview } from "@genkit-ai/vertexai";

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

export const ask = defineFlow(
  {
    name: "ask",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: OutputSchema,
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
