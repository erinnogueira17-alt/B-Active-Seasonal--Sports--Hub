/**
 * Local development API server.
 *
 * In production the Express app is exported from `api/index.ts` and run by
 * Vercel as a serverless function. For local dev we run that same app as a
 * normal Node server on port 3000, and Vite proxies `/api/*` to it
 * (see vite.config.ts). Run with:  npm run dev:api
 */
import "dotenv/config";
import app from "./api/index.ts";

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[dev] API server listening on http://localhost:${port}`);
});
