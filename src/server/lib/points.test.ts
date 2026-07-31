import { describe, it, expect } from "vitest";
import { awardPlannerPoints, PLANNER_POINTS } from "./points.js";
import { liveLog, pointsHistory } from "../db/schema.js";

/**
 * Minimal mock of the drizzle db that supports exactly the fluent chains
 * used by awardPlannerPoints. It records inserts/updates for assertions.
 */
function makeMockDb(existing: { id: number; points: number } | null) {
  const inserts: { table: unknown; vals: any }[] = [];
  const updates: { table: unknown; vals: any }[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(existing ? [existing] : []),
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (vals: any) => ({
        where: () => {
          updates.push({ table, vals });
          return Promise.resolve();
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (vals: any) => {
        inserts.push({ table, vals });
        return Promise.resolve();
      },
    }),
    inserts,
    updates,
  };
  return db;
}

const week = new Date(2026, 6, 27); // a Monday

describe("awardPlannerPoints", () => {
  it("creates a new liveLog entry with 2 points when none exists", async () => {
    const db = makeMockDb(null);
    await awardPlannerPoints("Daniel", "term3", week, db as any);

    const logInsert = db.inserts.find((i) => i.table === liveLog);
    expect(logInsert?.vals.points).toBe(PLANNER_POINTS);
    expect(logInsert?.vals.entityName).toBe("Daniel");

    const historyInsert = db.inserts.find((i) => i.table === pointsHistory);
    expect(historyInsert?.vals.reason).toBe("planner_submission");
    expect(historyInsert?.vals.points).toBe(PLANNER_POINTS);
  });

  it("increments existing points by 2", async () => {
    const db = makeMockDb({ id: 5, points: 4 });
    await awardPlannerPoints("Daniel", "term3", week, db as any);

    const logUpdate = db.updates.find((u) => u.table === liveLog);
    expect(logUpdate?.vals.points).toBe(6);

    // Still writes an audit record.
    expect(db.inserts.some((i) => i.table === pointsHistory)).toBe(true);
    // Does NOT insert a new liveLog row.
    expect(db.inserts.some((i) => i.table === liveLog)).toBe(false);
  });
});
