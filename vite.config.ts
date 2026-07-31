import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // In local dev, forward API calls to the local Express dev server (npm run dev:api).
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
