/**
 * Generates db/resources-seed.sql from curatedResources.ts — inserts curated
 * official coaching & refereeing links into the resources library.
 * Additive (does NOT clear the table), so your own uploaded resources are kept.
 *
 * Run:  npx tsx src/server/scripts/gen-resources-seed.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED_RESOURCES } from "./curatedResources.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const values = CURATED_RESOURCES.map((r) => {
  const fileType = r.url.toLowerCase().endsWith(".pdf") ? "application/pdf" : "link";
  return `  (${q(r.title)}, ${q(r.description)}, '${r.category}', '${r.subcategory}', ${q(r.url)}, 'external', '${fileType}')`;
}).join(",\n");

const out =
  `-- ============================================================\n` +
  `-- Curated official coaching & refereeing resources (${CURATED_RESOURCES.length} links).\n` +
  `-- Additive: run once. Delete individual rows from the admin UI if unwanted.\n` +
  `-- ============================================================\n\n` +
  `INSERT INTO resources (title, description, category, subcategory, file_url, file_key, file_type) VALUES\n` +
  `${values};\n`;

writeFileSync(join(root, "db", "resources-seed.sql"), out, "utf8");
// eslint-disable-next-line no-console
console.log(`Wrote db/resources-seed.sql (${CURATED_RESOURCES.length} resources)`);
