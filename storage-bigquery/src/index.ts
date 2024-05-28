import { configureGenkit } from "@genkit-ai/core";
import * as z from "zod";
import { vertexAI } from "@genkit-ai/vertexai";
import { firebase } from "@genkit-ai/firebase";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import { imageDescriptionFlow } from "./flows/imageDescriptionFlow";
import {
  writeToBigQueryFlow,
  createDatasetAndTableFlow,
} from "./flows/writeToBigQueryFlow";
import { writeToFirestoreFlow } from "./flows/writeToFirestoreFlow";

configureGenkit({
  plugins: [firebase(), vertexAI({ location: "us-central1" })],
  logLevel: "error",
  enableTracingAndMetrics: true,
});

export { imageDescriptionFlow };
export { writeToBigQueryFlow, createDatasetAndTableFlow };
export { writeToFirestoreFlow };

export const totalFlow = defineFlow(
  {
    name: "totalFlow",
    inputSchema: z.object({
      bucketName: z.string(),
      filePath: z.string(),
      datasetId: z.string(),
      tableName: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ bucketName, filePath, datasetId, tableName }) => {
    const { description } = await runFlow(imageDescriptionFlow, {
      bucketName,
      filePath,
    });

    const result = await runFlow(writeToBigQueryFlow, {
      description,
      bucketName,
      filePath,
      datasetId,
      tableName,
    });

    return result;
  }
);
