import { firebaseAuth } from "@genkit-ai/firebase/auth";

export const authPolicy = firebaseAuth(async (user, input) => {
  if (!user) {
    console.log("User not authenticated");
    throw new Error("User not authenticated");
  }
});
