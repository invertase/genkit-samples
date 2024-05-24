import { generate } from "@genkit-ai/ai";
import { noAuth, onFlow } from "@genkit-ai/firebase/functions";
import { geminiProVision } from "@genkit-ai/vertexai";
import * as z from "zod";
import * as admin from "firebase-admin";
import { Part } from "@genkit-ai/ai/model";
import { defineFlow } from "@genkit-ai/flow";

admin.initializeApp();

const inputSchema = z.object({
  bucketName: z.string(),
  filePath: z.string(),
});

const outputSchema = z.object({
  description: z.string(),
});

export const imageDescriptionFlow = defineFlow(
  {
    name: "imageDescriptionFlow",
    inputSchema,
    outputSchema,
  },
  async ({ bucketName, filePath }) => {
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error("File does not exist");
    }
    const fileType = file.metadata.contentType;

    if (!fileType || !fileType.startsWith("image/")) {
      throw new Error("Provided file is not an image");
    }

    const parts: Part[] = [
      {
        media: {
          url: `gs://${bucketName}/${filePath}`,
          contentType: fileType,
        },
      },
      {
        text: "Describe this image",
      },
    ];

    const llmResponse = await generate({
      model: geminiProVision,
      prompt: parts,
      config: {
        temperature: 1,
      },
    });

    return { description: llmResponse.text() };
  }
);
