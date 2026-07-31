import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

export { schema };

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  // Accept whichever variable Vercel's Postgres/Neon integration created.
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "No Postgres connection string found. Expected DATABASE_URL (or POSTGRES_URL). " +
        "Add a Vercel Postgres store to your project, or set DATABASE_URL in your local .env.",
    );
  }
  const sql = neon(connectionString);
  _db = drizzle(sql, { schema });
  return _db;
}

/**
 * Lazily-initialised Drizzle client. The connection is only created on first
 * use, so importing this module never throws (important for unit tests that
 * inject a mock db).
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
