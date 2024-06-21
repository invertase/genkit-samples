import { config } from "dotenv";
config();
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as z from "zod";
import { FieldValue } from "@google-cloud/firestore";
import { configureGenkit } from "@genkit-ai/core";
import { textEmbeddingGecko } from "@genkit-ai/vertexai";
import { firebase } from "@genkit-ai/firebase";
import { vertexAI } from "@genkit-ai/vertexai";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import { embed, embedMany } from "@genkit-ai/ai/embedder";
import { FirestoreVectorStoreClient } from "./queryClient";
import { extractTextFromBuffer } from "./pdf"; // Utility function for extracting text from a PDF buffer
import {
  defineIndexer,
  defineRetriever,
  index,
  retrieve,
} from "@genkit-ai/ai/retriever";

admin.initializeApp();

const projectId = process.env.PROJECT_ID;
const BUCKET_NAME = process.env.BUCKET_NAME;

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

const db = admin.firestore();

export const extractTextFlow = defineFlow(
  {
    name: "extractTextFlow",
    inputSchema: z.object({ fileBuffer: z.instanceof(Buffer) }),
    outputSchema: z.object({ text: z.string() }),
  },
  async ({ fileBuffer }) => {
    const text = await extractTextFromBuffer(fileBuffer);
    return { text };
  }
);

export const pdfChunkIndexer = defineIndexer(
  {
    name: `pdfChunks`,
    configSchema: z.null().optional(),
  },
  async (docs) => {
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
      const docRef = db.collection("pdfChunks").doc(); // Generate a new document reference with an auto-generated ID
      batch.set(docRef, {
        embedding: FieldValue.vector(embedding),
        text: doc.content[0].text,
        chunkIndex: doc.metadata?.chunkIndex,
      });
    });

    // Commit the batch
    await batch.commit();
  }
);

// Retriever for pdf chunks
export const pdfChunkRetriever = defineRetriever(
  {
    name: `pdfChunks`,
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
      "pdfChunks",
      [],
      k,
      "embedding"
    );

    if (!results) {
      return { documents: [] };
    }

    const documents = results.docs.map((result) => ({
      content: [{ text: result.data().text }],
      metadata: { chunkIndex: result.data().chunkIndex },
    }));

    return { documents };
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
    await index({
      indexer: pdfChunkIndexer,
      documents: chunks.map((chunk, i) => ({
        content: [{ text: chunk.text }],
        metadata: { chunkIndex: chunk.chunkIndex },
      })),
    });
    return "Indexed!";
  }
);

export const pdfProcessingFlow = defineFlow(
  {
    name: "pdfProcessingFlow",
    inputSchema: z.object({
      fileBuffer: z.instanceof(Buffer),
      chunkLength: z.number().optional(),
      overlapLength: z.number().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ fileBuffer, chunkLength = 200, overlapLength = 0 }) => {
    const { text } = await runFlow(extractTextFlow, { fileBuffer });
    const chunks = await runFlow(chunkTextFlow, {
      text,
      chunkLength,
      overlapLength,
    });
    await runFlow(indexerFlow, chunks);

    return "Indexed!";
  }
);

// export const pdfChunkRetrieverFlow = onFlow(
//   {
//     name: "pdfChunkRetrieverFlow",
//     inputSchema: z.object({ query: z.string(), k: z.number().default(3) }),
//     outputSchema: z.array(z.array(z.string())),
//   },
//   async ({ query, k }) => {
//     const results = await retrieve({
//       retriever: filmRetriever,
//       query,
//       options: { k },
//     });

//     return results.map((doc) => doc.metadata?.name);
//   }
// );

export const onPDFUploadFlow = defineFlow(
  {
    name: "onPDFUploadFlow",
    inputSchema: z.object({
      bucketName: z.string().default(BUCKET_NAME!),
      name: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ bucketName, name }) => {
    console.log(BUCKET_NAME);
    try {
      //  TODO: raise issue as default wasnt working...
      const bucket = admin.storage().bucket(bucketName || BUCKET_NAME);
      const file = bucket.file(name);
      const [fileBuffer] = await file.download();

      await runFlow(pdfProcessingFlow, { fileBuffer });
    } catch (error) {
      console.error("Error processing PDF upload:", error);
    }
    return "Processed!";
  }
);

export const onPDFUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const bucket = admin.storage().bucket(object.bucket);
      const file = bucket.file(object.name!);
      const [fileBuffer] = await file.download();

      await runFlow(pdfProcessingFlow, { fileBuffer });
    } catch (error) {
      console.error("Error processing PDF upload:", error);
    }
  });
