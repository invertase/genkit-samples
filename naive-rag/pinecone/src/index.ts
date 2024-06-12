import { config } from "dotenv";
config();
import { index, retrieve } from "@genkit-ai/ai/retriever";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow } from "@genkit-ai/flow";
import { textEmbeddingGecko, vertexAI } from "@genkit-ai/vertexai";
import { z } from "zod";
import { pineconeRetrieverRef } from "genkitx-pinecone";
import { pineconeIndexerRef } from "genkitx-pinecone";
import { pinecone } from "genkitx-pinecone";
import { fakeData } from "./fakeData";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is required");
}

export default configureGenkit({
  plugins: [
    vertexAI(),
    pinecone([
      {
        indexId: "films",
        embedder: textEmbeddingGecko,
        clientParams: {
          apiKey: process.env.PINECONE_API_KEY,
        },
      },
    ]),
  ],
});

export const filmRetriever = pineconeRetrieverRef({
  indexId: "films",
});

export const filmIndexer = pineconeIndexerRef({
  indexId: "films",
});

export const filmIndexerFlow = defineFlow(
  {
    name: "filmIndexerFlow",
  },
  async () => {
    const documents = fakeData;

    await index({ indexer: filmIndexer, documents });
  }
);

export const filmRetrieverFlow = defineFlow(
  {
    name: "filmRetrieverFlow",
    inputSchema: z.object({ query: z.string(), k: z.number().default(3) }),
    outputSchema: z.array(z.string()),
  },
  async ({ query, k }) => {
    const docs = await retrieve({
      retriever: filmRetriever,
      query,
      options: { k },
    });

    return docs.map((d) => d.metadata!.name!);
  }
);
