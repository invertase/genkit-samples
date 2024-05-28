import * as fs from "fs";
import * as path from "path";
import { getFilesContent } from "./utils/getFilesContent";

const bodyPath = path.posix.join(__dirname, "issue-comment.md");

const contentRepoRoot = path.resolve(__dirname, "../../..", "source-code");
const content = getFilesContent(contentRepoRoot, ".ts", [
  /node_modules/,
  /.github/,
]);

import { tsFlow } from "./flows";
import { runFlow } from "@genkit-ai/flow";
import { configureGenkit } from "@genkit-ai/core";
import { PluginOptions, vertexAI } from "@genkit-ai/vertexai";
import { GoogleAuthOptions } from "google-auth-library";

if (!process.env.GCP_SERVICE_ACCOUNT_KEY) {
  throw new Error("GCP_SERVICE_ACCOUNT_KEY is not set");
}

try {
  JSON.parse(
    Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8")
  );
} catch (e) {
  throw new Error("GCP_SERVICE_ACCOUNT_KEY is not a valid JSON");
}

if (!process.env.ISSUE_BODY) {
  throw new Error("issueBody is not set");
}

if (!process.env.ISSUE_TITLE) {
  throw new Error("issueTitle is not set");
}

const credentials = JSON.parse(
  Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8")
);
const googleAuthOptions: GoogleAuthOptions = {
  credentials,
};

const vertexAIOptions: PluginOptions = {
  projectId: "extensions-testing",
  location: "us-central1",
  googleAuth: googleAuthOptions,
};

configureGenkit({
  plugins: [vertexAI(vertexAIOptions)],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

export { tsFlow };

runFlow(tsFlow, {
  issueTitle: process.env.ISSUE_TITLE,
  issueBody: process.env.ISSUE_BODY,
  content: JSON.stringify(content),
})
  .then((response) => {
    const finalResponse = `
    ## Disclaimer: This is an automatic AI-generated response \n
    ${response}
    `;

    fs.writeFileSync(bodyPath, finalResponse);
  })
  .catch((e) => {
    console.error(e);
  });
