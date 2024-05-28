import { configureGenkit } from "@genkit-ai/core";
import { startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import "dotenv/config";

configureGenkit({
  plugins: [vertexAI({ location: "us-central1" })],
  logLevel: "error",
  enableTracingAndMetrics: true,
});

export * from "./flows";

startFlowsServer();
