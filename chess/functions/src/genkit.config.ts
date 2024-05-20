import { configureGenkit } from "@genkit-ai/core";
import { vertexAI } from "@genkit-ai/vertexai";
import { SecretParam } from "firebase-functions/lib/params/types";
import { defineSecret } from "firebase-functions/params";
import { openAI } from "genkitx-openai-plugin";
const { onInit } = require("firebase-functions/v2/core");

let OPENAI_API_KEY: SecretParam | undefined;
onInit(() => {
  OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
});

const openAIKey = OPENAI_API_KEY?.value() || "undefined";

export default configureGenkit({
  plugins: [
    vertexAI({ location: "us-central1" }),
    openAI({ apiKey: openAIKey }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});
