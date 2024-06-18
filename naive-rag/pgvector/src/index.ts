import { embed, embedMany } from "@genkit-ai/ai/embedder";
import {
  defineIndexer,
  defineRetriever,
  Document,
  index,
  retrieve,
} from "@genkit-ai/ai/retriever";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow } from "@genkit-ai/flow";
import { textEmbeddingGecko, vertexAI } from "@genkit-ai/vertexai";
import { toSql } from "pgvector";
import postgres, { Sql } from "postgres";
import { z } from "zod";
import { fakeData } from "./fakeData";

const postgresClientOptions = {
  host: "localhost",
  port: 5432,
  database: "vectordb",
  user: "testuser",
  password: "testpwd",
  ssl: false,
};

// Define the indexer function specifically for films
export const filmIndexer = defineIndexer(
  {
    name: `films`,
    configSchema: z.null().optional(),
  },
  async (docs: Document[]) => {
    const sql = postgres(postgresClientOptions);

    for (const doc of docs) {
      if (doc.content.length === 0 || !doc.content[0].text) {
        throw new Error(`Document ${doc.metadata?.name} has no content`);
      }

      if (!doc.metadata || !doc.metadata.name) {
        throw new Error(
          `Document has no metadata, or no name provided in metadata`
        );
      }
    }

    const embeddings = await embedMany({
      embedder: textEmbeddingGecko,
      content: docs.map((doc) => doc.content[0].text!),
    });

    const sqlEmbeddings = embeddings.map((result, i) => ({
      doc: docs[i],
      sqlEmbedding: toSql(result.embedding),
    }));

    // Prepare the values for insertion
    const values = sqlEmbeddings.map(({ doc, sqlEmbedding }) => [
      doc.metadata!.name!,
      doc.content[0].text!,
      sqlEmbedding,
    ]);

    // Insert the documents and embeddings into the table
    await sql`
      INSERT INTO films (name, description, embedding)
      VALUES ${sql(values as any)};
    `;

    await sql.end();
  }
);

// Define the retriever function specifically for films
export const filmRetriever = defineRetriever(
  {
    name: `films`,
    configSchema: z.object({ topK: z.number().optional() }),
  },
  async (document, options) => {
    const sql: Sql = postgres(postgresClientOptions);

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

    const k = options?.topK || 10;
    const results = await sql`
      SELECT *, embedding <-> ${toSql(embedding)} as distance
      FROM films
      ORDER BY embedding <-> ${toSql(embedding)}
      LIMIT ${toSql(k)}
    `;

    await sql.end();

    if (!results) {
      return {
        documents: [],
      };
    }

    const documents = results.map((result: any) =>
      Document.fromText(result.description, {
        ...result,
      }).toJSON()
    );

    return {
      documents,
    };
  }
);
configureGenkit({
  plugins: [vertexAI()],
});

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

export const filmRetrieverFlow = defineFlow(
  {
    name: "filmRetrieverFlow",
    inputSchema: z.object({ query: z.string(), topK: z.number().optional() }),
    outputSchema: z.array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        distance: z.number().optional(),
      })
    ),
  },
  async ({ query, topK }) => {
    const retriever = filmRetriever;

    const results = await retrieve({ retriever, query, options: { topK } });

    return results.map((doc) => ({
      name: doc.metadata?.name,
      description: doc.content[0].text,
      distance: doc.metadata?.distance,
    }));
  }
);
