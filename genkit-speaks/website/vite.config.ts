import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const ENDPOINT =
  "http://127.0.0.1:5001/extensions-testing/us-central1/transcribe";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/transcribe": ENDPOINT,
    },
  },
});
