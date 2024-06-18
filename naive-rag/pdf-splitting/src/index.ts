import { index, retrieve } from "@genkit-ai/ai/retriever";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import { textEmbeddingGecko, vertexAI } from "@genkit-ai/vertexai";
import { z } from "zod";

import { chroma } from "genkitx-chromadb";
import { chromaRetrieverRef } from "genkitx-chromadb";
import { chromaIndexerRef } from "genkitx-chromadb";
import { extractTextFromPDF } from "./pdf";
import * as path from "path";

export default configureGenkit({
  plugins: [
    vertexAI(),
    chroma([
      {
        collectionName: "chunks",
        embedder: textEmbeddingGecko,
        clientParams: {
          path: "http://localhost:8000",
        },
        embedderOptions: { taskType: "RETRIEVAL_DOCUMENT" },
        createCollectionIfMissing: true,
      },
    ]),
  ],
});

export const extractTextFlow = defineFlow(
  {
    name: "extractTextFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (filePath) => {
    const examplePath = path.join(__dirname, "../dinosaurs.pdf");
    if (!filePath) {
      filePath = examplePath;
    }

    const text = await extractTextFromPDF(filePath);

    return text;
  }
);

export const chunkTextFlow = defineFlow(
  {
    name: "chunkTextFlow",
    inputSchema: z.object({
      text: z.string(),
      chunkLength: z.number().default(200),
      overlapLength: z.number().default(0),
    }),
    outputSchema: z.array(
      z.object({
        text: z.string(),
        chunkIndex: z.number(),
      })
    ),
  },
  async ({ text, chunkLength, overlapLength }) => {
    const chunks = [];
    let i = 0;

    while (i < text.length) {
      const chunkText = text.slice(i, i + chunkLength);
      chunks.push({
        text: chunkText,
        chunkIndex: Math.floor(i / chunkLength),
      });
      i += chunkLength - overlapLength;
    }

    return chunks.filter((chunk) => chunk.text.length > 0);
  }
);

export const retriever = chromaRetrieverRef({
  collectionName: "chunks",
});

export const indexer = chromaIndexerRef({
  collectionName: "chunks",
});

export const indexerFlow = defineFlow(
  {
    name: "indexerFlow",
    inputSchema: z.array(
      z.object({
        text: z.string(),
        chunkIndex: z.number(),
      })
    ),
    outputSchema: z.string(),
  },
  async (chunks) => {
    for (const chunk of chunks) {
      if (!chunk.text || chunk.text.length === 0) {
        throw new Error(`Invalid chunk: ${JSON.stringify(chunk)}`);
      }
    }

    const documents = chunks.map(({ text, chunkIndex }) => ({
      content: [
        {
          text,
        },
      ],
      metadata: {
        chunkIndex,
      },
    }));

    await index({ indexer, documents });
    return "Indexed!";
  }
);

export const totalFlow = defineFlow(
  {
    name: "totalFlow",
    inputSchema: z.object({
      filePath: z.string(),
      chunkLength: z.number().optional(),
      overlapLength: z.number().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ filePath, chunkLength = 200, overlapLength = 0 }) => {
    const text = await runFlow(extractTextFlow, filePath);
    const chunks = await runFlow(chunkTextFlow, {
      text,
      chunkLength,
      overlapLength,
    });
    await runFlow(indexerFlow, chunks);

    return "Indexed!";
  }
);

export const retrieverFlow = defineFlow(
  {
    name: "retrieverFlow",
    inputSchema: z.object({ query: z.string(), k: z.number().optional() }),
    outputSchema: z.array(z.string()),
  },
  async ({ query, k }) => {
    let docs = await retrieve({
      retriever,
      query,
      options: { k },
    });

    return docs.map((d) => d.text());
  }
);
