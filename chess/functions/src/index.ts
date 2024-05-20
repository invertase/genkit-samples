import config from "./genkit.config.js";
import { initializeGenkit } from "@genkit-ai/core";
// Initialize Genkit with the configuration
initializeGenkit(config);

// Export the chessFlow
export { chessFlowStaging } from "./flows/chessFlow/index.js";

// Start the flows server
// startFlowsServer({
//   cors: { origin: "*" },
// });
