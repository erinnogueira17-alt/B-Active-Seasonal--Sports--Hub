import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../src/server/routers/_app";
import { createContext } from "../src/server/trpc";

const app = express();

// Base64 file uploads (resources up to 16 MB) inflate ~33% when encoded.
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "seasonal-sports-hub" });
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
