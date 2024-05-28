# GitHub Triage Bot with Firebase Genkit

This sample uses a GitHub Action workflow to automatically triage new issues using a Gemini model integrated via Firebase Genkit.

## How does it work?

The workflow runs whenever a new issue is opened. The GitHub action will:

1. Check out both the script (built with Genkit) and a GitHub repository of your choice.
2. Traverse the checked out GitHub repo, gathering files with a file extension of your choice (coming soon, only TypeScript is currently supported!).
3. Prompt Gemini (using its immense context window) to generate a helpful response to the opened issue, using the source code as a reference.
4. Comment the response on the triggering issue.

## Setup Instructions

### Prerequisites

#### GitHub Repository Secrets

- **BOT_PAT**

  - You should create a (classic) GitHub PAT with appropriate permissions to access both the public `invertase/genkit-samples` repository (repo: read) and the repository of your choice (repo: read and write).

- **GCP_SERVICE_ACCOUNT_KEY**
  1. Make a service account on your GCP project with the role "Vertex AI User".
  2. Download the private key JSON of this service account.
  3. Base64 encode this private key.
  4. Store the Base64 encoded string as the secret `GCP_SERVICE_ACCOUNT_KEY` on your repo.

#### GitHub Repository Environment Variables

- **SOURCE_CODE_OWNER**

  - This is the owner of the repository you wish to add to the Gemini Context.

- **SOURCE_CODE_REPO**

  - This is the name of the repository you wish to add to the Gemini Context.

- **FILE_EXTENSION**
  - (coming soon)

## Development/Contributing

### Genkit Flows:

This project includes a simple Genkit flow that generates a response to a GitHub issue, using the typescript source code as context.

```typescript
import dotenv from "dotenv";
dotenv.config();

import { noAuth, onFlow } from "@genkit-ai/firebase/functions";
import * as z from "zod";
import { generate } from "@genkit-ai/ai";
import { getPrompt } from "./prompts";
import { gemini15ProPreview } from "@genkit-ai/vertexai";

export const tsFlow = onFlow(
  {
    name: "tsFlow",
    inputSchema: z.object({
      issueTitle: z.string(),
      issueBody: z.string(),
      content: z.string(),
    }),
    outputSchema: z.string(),
    authPolicy: noAuth(),
  },
  async ({ issueTitle, issueBody, content }) => {
    const prompt = getPrompt({ content, issueBody, issueTitle });
    const llmResponse = await generate({
      model: gemini15ProPreview,
      prompt,
    });
    return llmResponse.text();
  }
);
```

with:

```typescript
export const getPrompt = ({
  content,
  issueBody,
  issueTitle,
}: {
  content: string;
  issueBody: string;
  issueTitle: string;
}) => {
  return `
    <source-material>
    ${content}
    </source-material>
    <github-issue>
    <github-issue-title>
    ${issueTitle}
    </github-issue-title>
    <github-issue-body>
    ${issueBody}
    </github-issue-body>
    </github-issue>
    <instruction>
    Your job is to reply to the provided github-issue.

    Search the source-material for any information relevant to the provided issue.

    Use your findings to best respond to the users issue.
    </instruction>
    `;
};
```

If you have Genkit installed globally you may use `genkit start` to instead open the Genkit UI and experiment with the flow yourself.

## License

This project is licensed under the Apache 2.0 License.
