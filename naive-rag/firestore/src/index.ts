import { config } from "dotenv";
config();
import { configureGenkit } from "@genkit-ai/core";
import { textEmbeddingGecko } from "@genkit-ai/vertexai";
import * as z from "zod";
import { firebase } from "@genkit-ai/firebase";
import { vertexAI } from "@genkit-ai/vertexai";
import {
  defineIndexer,
  defineRetriever,
  index,
  retrieve,
} from "@genkit-ai/ai/retriever";
import { Document } from "@genkit-ai/ai/retriever";

configureGenkit({
  plugins: [
    firebase({
      projectId: process.env.PROJECT_ID,
    }),
    vertexAI({ location: "us-central1", projectId: process.env.PROJECT_ID }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

import * as admin from "firebase-admin";
import { FieldValue } from "@google-cloud/firestore";
import { embed, embedMany } from "@genkit-ai/ai/embedder";
import { defineFlow } from "@genkit-ai/flow";
import { fakeData } from "./fakeData";
import { FirestoreVectorStoreClient } from "./queryClient";

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: process.env.PROJECT_ID,
});
const db = admin.firestore();

export const filmIndexer = defineIndexer(
  {
    name: `films`,
    configSchema: z.null().optional(),
  },
  async (docs: Document[]) => {
    // Function to embed content and return the SQL-ready embedding

    const results = await embedMany({
      embedder: textEmbeddingGecko,
      content: docs.map((doc) => doc.content[0].text!),
    });

    const docsAndEmbeddings = results.map((result, i) => ({
      doc: docs[i],
      embedding: result.embedding,
    }));

    // Create a batch
    const batch = db.batch();

    docsAndEmbeddings.forEach(({ doc, embedding }) => {
      const docRef = db.collection("films").doc(); // Generate a new document reference with an auto-generated ID
      batch.set(docRef, {
        embedding: FieldValue.vector(embedding),
        description: doc.content[0].text,
        name: doc.metadata?.name,
      });
    });

    // Commit the batch
    await batch.commit();
  }
);

// Define the retriever function specifically for films
export const filmRetriever = defineRetriever(
  {
    name: `films`,
    configSchema: z.object({ k: z.number() }),
  },
  async (document, options) => {
    // Check and extract the content to be embedded
    const contentToEmbed = document.content[0].text as string;

    if (typeof contentToEmbed !== "string") {
      throw new Error(`Content for description is not a string`);
    }

    // Embed the content
    const embedding = await embed({
      embedder: textEmbeddingGecko,
      content: contentToEmbed,
    });

    const k = options?.k || 10;

    const queryClient = new FirestoreVectorStoreClient(admin.firestore());

    const results = await queryClient.query(
      embedding,
      "films",
      [],
      k,
      "embedding"
    );

    if (!results) {
      return {
        documents: [],
      };
    }

    const documents = results.docs.map((result: any) =>
      Document.fromText(result.data().name, {
        name: result.data().name,
        description: result.data().description,
      }).toJSON()
    );

    return {
      documents,
    };
  }
);

export const filmRetrieverFlow = defineFlow(
  {
    name: "filmRetrieverFlow",
    inputSchema: z.object({ query: z.string(), k: z.number().default(3) }),
    outputSchema: z.array(z.array(z.string())),
  },
  async ({ query, k }) => {
    const results = await retrieve({
      retriever: filmRetriever,
      query,
      options: { k },
    });

    return results.map((doc) => doc.metadata?.name);
  }
);

export const filmIndexerFlow = defineFlow(
  {
    name: "filmIndexerFlow",
  },
  async () => {
    const documents = fakeData;

    const indexer = filmIndexer;

    await index({ indexer, documents });
  }
);
