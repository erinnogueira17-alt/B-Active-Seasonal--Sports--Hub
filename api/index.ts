import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { appRouter } from "../src/server/routers/_app.js";
import { createContext } from "../src/server/trpc.js";

const app = express();

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "seasonal-sports-hub" });
});

// Direct browser-to-Blob uploads. The file is uploaded straight from the
// browser to Vercel Blob (bypassing the 4.5 MB serverless body limit); this
// endpoint only mints a short-lived upload token.
app.post("/api/blob/upload", async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 25 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {
        // Metadata is saved separately via tRPC once the browser upload resolves.
      },
    });
    res.json(jsonResponse);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        // eslint-disable-next-line no-console
        console.error(`[trpc] ${path ?? "<no-path>"}:`, error);
      }
    },
  }),
);

export default app;
