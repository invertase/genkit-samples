import { firebaseAuth } from "@genkit-ai/firebase/auth";
import * as admin from "firebase-admin";

const verifyAppCheck = async (token: string) => {
  await admin.appCheck().verifyToken(token);
};

export const authPolicy = firebaseAuth(async (user, input) => {
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const appCheckToken = input?.appCheckToken;
    await verifyAppCheck(appCheckToken);
  } catch (error) {
    throw new Error("Invalid App Check token");
  }
});
