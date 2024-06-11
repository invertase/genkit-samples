import { embed } from "@genkit-ai/ai/embedder";
import {
  defineIndexer,
  defineRetriever,
  Document,
} from "@genkit-ai/ai/retriever";
import { textEmbeddingGecko } from "@genkit-ai/vertexai";
import { toSql } from "pgvector";
import postgres, { Sql } from "postgres";
import { z } from "zod";

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

    // Function to embed content and return the SQL-ready embedding
    const getSqlEmbedding = async (doc: Document) => {
      if (doc.content.length === 0 || !doc.content[0].text) {
        throw new Error(`Document ${doc.metadata?.name} has no content`);
      }
      if (!doc.metadata || !doc.metadata.name) {
        throw new Error(
          `Document has no metadata, or no name provided in metadata`
        );
      }

      const embedding = await embed({
        embedder: textEmbeddingGecko,
        content: doc.content[0].text!,
      });
      return { doc, sqlEmbedding: toSql(embedding) };
    };

    // Process all documents to get their embeddings
    const sqlEmbeddings = await Promise.all(docs.map(getSqlEmbedding));

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
  },
  async (document, options) => {
    console.debug(`Retrieving documents for ${document.metadata?.name}`);
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

    console.debug(`Embedding: ${embedding}`);

    const k = options?.k || 10;
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
