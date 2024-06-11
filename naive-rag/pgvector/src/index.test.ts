import { z } from "zod";
import { index, retrieve } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { lookupAction } from "@genkit-ai/core/registry";
import { Document } from "@genkit-ai/ai/retriever";
import { filmIndexer, filmRetriever } from ".";
import postgres from "postgres";

const postgresClientOptions = {
  host: "localhost",
  port: 5432,
  database: "vectordb",
  user: "testuser",
  password: "testpwd",
  ssl: false,
};

configureGenkit({
  plugins: [
    /* Add your plugins here. */
  ],
  logLevel: "debug",
});

// Mock the embed function from "@genkit-ai/ai/embedder"
jest.mock("@genkit-ai/ai/embedder", () => {
  return {
    ...jest.requireActual("@genkit-ai/ai/embedder"),
    embed: jest.fn().mockResolvedValue([1, 2, 3]),
  };
});

describe("integration tests for indexer and retriever", () => {
  beforeEach(async () => {
    // delete all rows in table films
    const sql = postgres(postgresClientOptions);

    await sql`DELETE FROM films`;

    await sql.end();
  });

  it("should be able to index", async () => {
    const documents = [
      {
        content: [
          {
            text: "The Matrix",
          },
        ],
        metadata: {
          name: "The Matrix",
        },
      },
    ];

    const indexer = filmIndexer;
    await index({ indexer, documents });
  });

  it("should retrieve docs", async () => {
    const documents = [
      {
        content: [
          {
            text: "A film about dodging bullets",
          },
        ],
        metadata: {
          name: "The Matrix",
        },
      },
    ];

    const indexer = filmIndexer;
    await index({ indexer, documents });

    const retriever = filmRetriever;
    const results = await retrieve({ retriever, query: "The Matrix" });

    console.log(results);
    const document = results[0];
    expect(document).toBeInstanceOf(Document);
    expect(document.content[0].text).toBe("A film about dodging bullets");
  });
});
