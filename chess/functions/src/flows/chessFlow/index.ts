import { inputSchema, outputSchema } from "./schema";
import { onFlow } from "@genkit-ai/firebase/functions";
import { chessStepsFunction } from "./stepFunction";
import { authPolicy } from "./authPolicy";

export const chessFlowStaging = onFlow(
  {
    name: "chessFlowStaging",
    inputSchema,
    outputSchema,
    authPolicy,
    enforceAppCheck: true,
  },
  chessStepsFunction
);
