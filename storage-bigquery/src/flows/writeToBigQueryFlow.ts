import * as z from "zod";
import { BigQuery } from "@google-cloud/bigquery";
import { defineFlow } from "@genkit-ai/flow";
import { convert } from "zoq";

const inputSchema = z.object({
  description: z.string(),
  bucketName: z.string(),
  filePath: z.string(),
  datasetId: z.string(),
  tableName: z.string(),
});

export const writeToBigQueryFlow = defineFlow(
  {
    name: "writeToBigQueryFlow",
    inputSchema,
    outputSchema: z.string(),
  },
  async ({ description, bucketName, filePath, datasetId, tableName }) => {
    const bigquery = new BigQuery();

    const timestamp = new Date().toISOString();

    const rows = [
      {
        description,
        bucketName,
        filePath,
        timestamp,
      },
    ];

    await bigquery.dataset(datasetId).table(tableName).insert(rows);

    return "Row successfully inserted into BigQuery table";
  }
);

const datasetTableSchema = z.object({
  datasetId: z.string(),
  tableName: z.string(),
});

export const createDatasetAndTableFlow = defineFlow(
  {
    name: "createDatasetAndTableFlow",
    inputSchema: datasetTableSchema,
    outputSchema: z.string(),
  },
  async ({ datasetId, tableName }) => {
    const bigquery = new BigQuery();

    const dataset = bigquery.dataset(datasetId);
    const [datasetExists] = await dataset.exists();
    if (!datasetExists) {
      await dataset.create();
    }

    const table = dataset.table(tableName);
    const [tableExists] = await table.exists();
    if (!tableExists) {
      const schema = convert(
        z.object({
          description: z.string(),
          bucketName: z.string(),
          filePath: z.string(),
          timestamp: z.date(),
        })
      );

      await table.create({ schema });
    }

    return "Dataset and table created successfully (if they didn't already exist)";
  }
);
