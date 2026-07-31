import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { coaches, schools, allocations, liveLog, siteSettings } from "../db/schema.js";

const TERM3_COACHES = [
  "Abbey", "Akimi", "Azande", "Bahle", "Breyton", "Busani", "Daniel", "Deon",
  "Dylan", "Edgar", "Elizabeth", "Harnu", "Jean", "Jerome", "Jolie", "Justin",
  "Kabelo", "Kamohelo", "Keatlegile", "Khanya", "Lasley", "Lebogang", "Lungile",
  "Mahlatsi", "Mamello", "Mikael", "Mpho", "Musa", "Na'eel", "Nhlanhla", "Nosipho",
  "Paballo", "Remi", "Ross", "Samokelo", "Sanele", "Sergio", "Shalom", "Sipho",
  "Siseko", "Tapiwa", "Thembi", "Tshepiso", "Welcome",
];

const SCHOOLS = [
  "Curro Sagewood", "Curro Halfway Gardens", "Curro Rivonia", "Colin Mann",
  "St Francis", "Carlswald", "Crawford Sandton", "Generation Schools",
  "Lion Pride Academy", "Sandton Sinai", "Rallim",
];

// [school, team, coach]
const TERM3_ALLOCATIONS: [string, string, string][] = [
  ["Curro Sagewood", "u7 Hockey", "Musa"],
  ["Curro Sagewood", "u8 Hockey", "Lungile"],
  ["Curro Sagewood", "u10 Boys Hockey", "Musa"],
  ["Curro Sagewood", "u11 Boys Hockey", "Lungile"],
  ["Curro Sagewood", "Opens Boys Hockey", "Ross"],
  ["Curro Halfway Gardens", "U7 Boys Hockey", "Edgar"],
  ["Curro Halfway Gardens", "U8 Boys Hockey", "Edgar"],
  ["Curro Halfway Gardens", "u9 Boys Hockey", "Edgar"],
  ["Curro Halfway Gardens", "u10 Girls Hockey", "Paballo"],
  ["Curro Halfway Gardens", "u11 Boys Hockey", "Thembi"],
  ["Curro Halfway Gardens", "Opens Boys B Hockey", "Thembi"],
  ["Curro Rivonia", "Mini Athletics R-1", "Lasley"],
  ["Curro Rivonia", "Mini Athletics 2-3", "Lasley"],
  ["Curro Rivonia", "Mini Hockey R-1", "Na'eel"],
  ["Curro Rivonia", "Mini Hockey 2-3", "Na'eel"],
  ["Curro Rivonia", "PS Athletics", "Keatlegile"],
  ["Curro Rivonia", "PS Athletics", "Samokelo"],
  ["Curro Rivonia", "PS Hockey U10", "Justin"],
  ["Curro Rivonia", "PS Hockey U11", "Breyton"],
  ["Curro Rivonia", "PS Hockey U12", "Abbey"],
  ["Curro Rivonia", "PS Hockey U13", "Tapiwa"],
  ["Curro Rivonia", "HS u15 Boys Football", "Lebogang"],
  ["Curro Rivonia", "HS u19 Boys Football", "Sipho"],
  ["Curro Rivonia", "HS Girls Football", "Kabelo"],
  ["Curro Rivonia", "HS Hockey", "Mpho"],
  ["Colin Mann", "u7 Cricket", "Daniel"],
  ["Colin Mann", "u8 Cricket", "Tshepiso"],
  ["Colin Mann", "u9 Cricket", "Harnu"],
  ["Colin Mann", "u10 Cricket", "Remi"],
  ["Colin Mann", "2nd Team Cricket", "Busani"],
  ["St Francis", "u15 Football", "Bahle"],
  ["St Francis", "u17 Football", "Mahlatsi"],
  ["St Francis", "u19 Football", "Kamohelo"],
  ["Carlswald", "Hockey", "Khanya"],
  ["Crawford Sandton", "Hockey", "Jean"],
  ["Crawford Sandton", "Hockey", "Jolie"],
  ["Generation Schools", "Jnr Football", "Sanele"],
  ["Generation Schools", "Snr Football", "Sanele"],
  ["Generation Schools", "HS Football", "Tshepiso"],
  ["Generation Schools", "Jnr Netball", "Elizabeth"],
  ["Generation Schools", "Snr Netball", "Elizabeth"],
  ["Generation Schools", "HS Netball", "Azande"],
  ["Lion Pride Academy", "u7 Boys Soccer", "Siseko"],
  ["Lion Pride Academy", "u9 Boys Soccer", "Mamello"],
  ["Lion Pride Academy", "u11 Boys Soccer", "Nosipho"],
  ["Lion Pride Academy", "u11 Girls Netball", "Deon"],
  ["Lion Pride Academy", "Gr1-3 Tennis", "Deon"],
  ["Lion Pride Academy", "GR4-9 Tennis", "Kabelo"],
  ["Lion Pride Academy", "Gr1-3 Touch Rugby", "Welcome"],
  ["Lion Pride Academy", "GR4-9 Touch Rugby", "Edgar"],
  ["Lion Pride Academy", "Gr6-9 Girls Soccer", "Siseko"],
  ["Sandton Sinai", "Soccer", "Mikael"],
  ["Sandton Sinai", "Soccer", "Jerome"],
  ["Sandton Sinai", "Soccer", "Ross"],
  ["Sandton Sinai", "Table Tennis", "Breyton"],
  ["Sandton Sinai", "Cricket", "Jerome"],
  ["Sandton Sinai", "Rugby", "Nhlanhla"],
  ["Rallim", "Hockey & Football", "Akimi"],
  ["Rallim", "Hockey", "Shalom"],
  ["Rallim", "Hockey & Football", "Dylan"],
  ["Rallim", "Oversee all sport", "Sergio"],
];

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
