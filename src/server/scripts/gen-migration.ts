/**
 * Generates db/migrate-old-data.sql — replaces the placeholder seed with the
 * real data exported from the previous hub. Derives the school list and each
 * term's coach roster from the allocations, and initialises the leaderboard.
 *
 * Run:  npx tsx src/server/scripts/gen-migration.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { OLD_ALLOCATIONS } from "./oldAllocations.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const TERMS = ["term1", "term2", "term3", "term4"] as const;

// Unique schools (sorted).
const schools = [...new Set(OLD_ALLOCATIONS.map(([school]) => school))].sort((a, b) =>
  a.localeCompare(b),
);

// Unique coach names per term, in first-seen order.
const coachesByTerm = new Map<string, string[]>();
for (const term of TERMS) coachesByTerm.set(term, []);
for (const [, , coach, term] of OLD_ALLOCATIONS) {
  const list = coachesByTerm.get(term)!;
  if (!list.includes(coach)) list.push(coach);
}

const lines: string[] = [];
lines.push("-- ============================================================");
lines.push("-- Migrate real data from the previous hub (allocations, schools,");
lines.push("-- coach rosters, and leaderboard). Safe to re-run: it clears these");
lines.push("-- four reference tables first, then reloads them.");
lines.push("-- Your users, results, planner submissions, gallery, resources and");
lines.push("-- settings are NOT touched.");
lines.push("-- ============================================================");
lines.push("");
lines.push("BEGIN;");
lines.push("");
lines.push("TRUNCATE allocations, coaches, live_log, schools RESTART IDENTITY CASCADE;");
lines.push("");

lines.push("-- Schools");
lines.push(
  `INSERT INTO schools (name) VALUES\n  ${schools.map((s) => `(${q(s)})`).join(",\n  ")};`,
);
lines.push("");

lines.push("-- Allocations (all terms)");
lines.push(
  `INSERT INTO allocations (school, team, coach_name, term) VALUES\n  ${OLD_ALLOCATIONS.map(
    ([school, team, coach, term]) => `(${q(school)}, ${q(team)}, ${q(coach)}, '${term}')`,
  ).join(",\n  ")};`,
);
lines.push("");

for (const term of TERMS) {
  const coaches = coachesByTerm.get(term)!;
  if (coaches.length === 0) continue;
  lines.push(`-- Coaches roster (${term})`);
  lines.push(
    `INSERT INTO coaches (name, term) VALUES\n  ${coaches
      .map((c) => `(${q(c)}, '${term}')`)
      .join(",\n  ")};`,
  );
  lines.push("");
  lines.push(`-- Leaderboard init (${term}, 0 points)`);
  lines.push(
    `INSERT INTO live_log (entity_name, points, term) VALUES\n  ${coaches
      .map((c) => `(${q(c)}, 0, '${term}')`)
      .join(",\n  ")};`,
  );
  lines.push("");
}

lines.push("COMMIT;");
lines.push("");

const out = lines.join("\n");
writeFileSync(join(root, "db", "migrate-old-data.sql"), out, "utf8");

// eslint-disable-next-line no-console
console.log(
  `Wrote db/migrate-old-data.sql\n` +
    `  schools:      ${schools.length}\n` +
    `  allocations:  ${OLD_ALLOCATIONS.length}\n` +
    TERMS.map((t) => `  ${t} coaches: ${coachesByTerm.get(t)!.length}`).join("\n"),
);
