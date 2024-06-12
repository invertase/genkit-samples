import { index, retrieve } from "@genkit-ai/ai/retriever";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow } from "@genkit-ai/flow";
import { textEmbeddingGecko, vertexAI } from "@genkit-ai/vertexai";
import { z } from "zod";
import { fakeData } from "./fakeData";

import { chroma } from "genkitx-chromadb";
import { chromaRetrieverRef } from "genkitx-chromadb";
import { chromaIndexerRef } from "genkitx-chromadb";

export default configureGenkit({
  plugins: [
    vertexAI(),
    chroma([
      {
        collectionName: "films",
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

export const filmsRetriever = chromaRetrieverRef({
  collectionName: "films",
});

export const filmsIndexer = chromaIndexerRef({
  collectionName: "films",
});

export const filmIndexerFlow = defineFlow(
  {
    name: "filmIndexerFlow",
  },
  async () => {
    const documents = fakeData;

    await index({ indexer: filmsIndexer, documents });
  }
);

export const filmRetrieverFlow = defineFlow(
  {
    name: "filmRetrieverFlow",
    inputSchema: z.object({ query: z.string(), k: z.number().optional() }),
    outputSchema: z.array(z.string()),
  },
  async ({ query, k }) => {
    let docs = await retrieve({
      retriever: filmsRetriever,
      query,
      options: { k },
    });

    return docs.map((d) => d.metadata!.name!);
  }
);
