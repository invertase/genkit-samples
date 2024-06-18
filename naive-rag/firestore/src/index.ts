// set environment variables
import { config } from "dotenv";
config();
import * as z from "zod";
import * as admin from "firebase-admin";
// needed for vector datatype
import { FieldValue } from "@google-cloud/firestore";
// genkit imports
import { configureGenkit } from "@genkit-ai/core";
import { textEmbeddingGecko } from "@genkit-ai/vertexai";
import { firebase } from "@genkit-ai/firebase";
import { vertexAI } from "@genkit-ai/vertexai";
import { defineFlow } from "@genkit-ai/flow";
import { embed, embedMany } from "@genkit-ai/ai/embedder";
import {
  defineIndexer,
  defineRetriever,
  Document,
  index,
  retrieve,
} from "@genkit-ai/ai/retriever";
// local imports
import { FirestoreVectorStoreClient } from "./queryClient";
import { fakeData } from "./fakeData";

const projectId = process.env.PROJECT_ID;

configureGenkit({
  plugins: [
    firebase({
      projectId,
    }),
    vertexAI({ location: "us-central1", projectId: process.env.PROJECT_ID }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

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

// Retriever for films
export const filmRetriever = defineRetriever(
  {
    name: `films`,
    configSchema: z.object({ k: z.number() }),
  },
  async (document, options) => {
    const contentToEmbed = document.content[0].text;

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
      return { documents: [] };
    }

    const documents = results.docs.map((result) =>
      Document.fromText(result.data().name, {
        name: result.data().name,
        description: result.data().description,
      }).toJSON()
    );

    return { documents };
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

// Flow for indexing films
export const filmIndexerFlow = defineFlow(
  {
    name: "filmIndexerFlow",
  },
  async () => {
    const documents = fakeData;
    await index({ indexer: filmIndexer, documents });
  }
);
