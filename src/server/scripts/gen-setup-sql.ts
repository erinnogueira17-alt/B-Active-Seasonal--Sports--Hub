/**
 * Generates db/setup.sql: the full schema (from the latest Drizzle migration)
 * followed by INSERT statements for the initial seed data. Paste the result
 * into the Vercel Postgres / Neon query editor to set up the database in one go.
 *
 * Run:  npx tsx src/server/scripts/gen-setup-sql.ts
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TERM3_COACHES, SCHOOLS, TERM3_ALLOCATIONS } from "./seedData.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const drizzleDir = join(root, "drizzle");

function q(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

// 1. Schema — use the latest generated migration file.
const migration = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .pop();
if (!migration) throw new Error("No migration found — run `npm run db:generate` first.");
const schemaSql = readFileSync(join(drizzleDir, migration), "utf8");

// 2. Seed inserts (idempotent via ON CONFLICT / guarded inserts where possible).
const lines: string[] = [];
lines.push("-- ─── Seed data ───────────────────────────────────────────────");

lines.push("\n-- Schools");
lines.push(
  `INSERT INTO schools (name) VALUES\n  ${SCHOOLS.map((n) => `(${q(n)})`).join(",\n  ")};`,
);

lines.push("\n-- Coaches (Term 3)");
lines.push(
  `INSERT INTO coaches (name, term) VALUES\n  ${TERM3_COACHES.map((n) => `(${q(n)}, 'term3')`).join(",\n  ")};`,
);

lines.push("\n-- Allocations (Term 3)");
lines.push(
  `INSERT INTO allocations (school, team, coach_name, term) VALUES\n  ${TERM3_ALLOCATIONS.map(
    ([school, team, coach]) => `(${q(school)}, ${q(team)}, ${q(coach)}, 'term3')`,
  ).join(",\n  ")};`,
);

lines.push("\n-- Leaderboard (Term 3, all coaches at 0 points)");
lines.push(
  `INSERT INTO live_log (entity_name, points, term) VALUES\n  ${TERM3_COACHES.map(
    (n) => `(${q(n)}, 0, 'term3')`,
  ).join(",\n  ")};`,
);

lines.push("\n-- Site settings");
lines.push(
  `INSERT INTO site_settings (key, value) VALUES ('calendarVisible', 'false')\n  ON CONFLICT (key) DO NOTHING;`,
);

const header = `-- ============================================================
-- Seasonal Sports Hub — one-shot database setup
-- Paste this whole file into the Vercel Postgres / Neon query editor.
-- Creates all tables + enums, then loads the initial seed data.
-- Safe to run once on a fresh database.
-- ============================================================\n\n`;

const out = header + schemaSql + "\n\n" + lines.join("\n") + "\n";
const dest = join(root, "db", "setup.sql");
writeFileSync(dest, out, "utf8");
// eslint-disable-next-line no-console
console.log(`Wrote ${dest} (${out.length} bytes)`);
