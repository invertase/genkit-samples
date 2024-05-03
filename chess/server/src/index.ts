import config from "./genkit.config.js";
import { initializeGenkit } from "@genkit-ai/core";
import { startFlowsServer } from "@genkit-ai/flow";

// Initialize Genkit with the configuration
initializeGenkit(config);

// Export the chessFlow
export { chessFlow } from "./flows/chessFlow";

// Start the flows server
startFlowsServer({
  cors: { origin: "*" },
});
