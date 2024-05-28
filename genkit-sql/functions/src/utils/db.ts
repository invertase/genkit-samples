import { defineString } from "firebase-functions/params";
import postgres from "postgres";

const dbUrl = defineString("DATABASE_URL");

export function getSql() {
  const url = dbUrl.value() || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  return postgres(url);
}
