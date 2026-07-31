import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { coaches, schools, allocations, liveLog, siteSettings } from "../db/schema.js";
import { TERM3_COACHES, SCHOOLS, TERM3_ALLOCATIONS } from "./seedData.js";

async function count(table: any): Promise<number> {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(table);
  return c;
}

async function main() {
  console.log("Seeding Seasonal Sports Hub…");

  if ((await count(schools)) === 0) {
    await db.insert(schools).values(SCHOOLS.map((name) => ({ name })));
    console.log(`  ✓ ${SCHOOLS.length} schools`);
  } else console.log("  • schools already present, skipping");

  if ((await count(coaches)) === 0) {
    await db.insert(coaches).values(TERM3_COACHES.map((name) => ({ name, term: "term3" as const })));
    console.log(`  ✓ ${TERM3_COACHES.length} coaches (term3)`);
  } else console.log("  • coaches already present, skipping");

  if ((await count(allocations)) === 0) {
    await db.insert(allocations).values(
      TERM3_ALLOCATIONS.map(([school, team, coachName]) => ({ school, team, coachName, term: "term3" as const })),
    );
    console.log(`  ✓ ${TERM3_ALLOCATIONS.length} allocations (term3)`);
  } else console.log("  • allocations already present, skipping");

  if ((await count(liveLog)) === 0) {
    await db.insert(liveLog).values(TERM3_COACHES.map((name) => ({ entityName: name, points: 0, term: "term3" as const })));
    console.log(`  ✓ ${TERM3_COACHES.length} leaderboard entries (term3, 0 pts)`);
  } else console.log("  • leaderboard already present, skipping");

  if ((await count(siteSettings)) === 0) {
    await db.insert(siteSettings).values({ key: "calendarVisible", value: "false" });
    console.log("  ✓ site settings (calendarVisible=false)");
  } else console.log("  • site settings already present, skipping");

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
