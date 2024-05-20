import { inputSchema, outputSchema } from "./schema";
import { noAuth, onFlow } from "@genkit-ai/firebase/functions";
import { chessStepsFunction } from "./stepFunction";
// import { authPolicy } from "./authPolicy";

export const chessFlow = onFlow(
  {
    name: "chessFlow",
    inputSchema,
    outputSchema,
    authPolicy: noAuth(),
    // enforceAppCheck: true,
  },
  chessStepsFunction
);
