import * as z from "zod";
import * as admin from "firebase-admin";
import { defineFlow } from "@genkit-ai/flow";

admin.initializeApp();

const inputSchema = z.object({
  bucketName: z.string(),
  filePath: z.string(),
  collectionName: z.string(),
  description: z.string(),
});

const outputSchema = z.string();

export const writeToFirestoreFlow = defineFlow(
  {
    name: "writeToFirestoreFlow",
    inputSchema,
    outputSchema,
  },
  async ({ bucketName, filePath, collectionName, description }) => {
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

    const firestore = admin.firestore();
    await firestore.collection(collectionName).add({
      bucketName,
      filePath,
      description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return "Uploaded to firestore successfully!";
  }
);
