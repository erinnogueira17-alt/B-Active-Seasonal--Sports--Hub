/**
 * Generates db/migrate-results.sql from oldResults.jsonl (one JSON result per
 * line) exported from the previous hub. Appends the results history without
 * touching any other table.
 *
 * Run:  npx tsx src/server/scripts/gen-results-sql.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");

type Row = {
  coachName: string;
  sport: string;
  team: string;
  ageGroup: string | null;
  date: string; // ISO date (YYYY-MM-DD)
  opposition: string | null;
  result: string | null;
  feedback: string | null;
};

const q = (s: string | null | undefined): string =>
  s == null || s === "" ? "NULL" : `'${String(s).replace(/'/g, "''")}'`;

const raw = readFileSync(join(here, "oldResults.jsonl"), "utf8");
const rows: Row[] = raw
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l) as Row);

const values = rows
  .map(
    (r) =>
      `  (${q(r.coachName)}, ${q(r.sport)}, ${q(r.team)}, ${q(r.ageGroup)}, ` +
      `'${r.date}T12:00:00Z', ${q(r.opposition)}, ${q(r.result)}, ${q(r.feedback)})`,
  )
  .join(",\n");

const out =
  `-- ============================================================\n` +
  `-- Results history migrated from the previous hub (${rows.length} matches).\n` +
  `-- Safe to re-run: clears the results table first, then reloads it.\n` +
  `-- No other table is touched.\n` +
  `-- ============================================================\n\n` +
  `BEGIN;\n\n` +
  `TRUNCATE results RESTART IDENTITY;\n\n` +
  `INSERT INTO results (coach_name, sport, team, age_group, date, opposition, result, feedback) VALUES\n` +
  `${values};\n\n` +
  `COMMIT;\n`;

writeFileSync(join(root, "db", "migrate-results.sql"), out, "utf8");
// eslint-disable-next-line no-console
console.log(`Wrote db/migrate-results.sql (${rows.length} results)`);
