import { and, eq } from "drizzle-orm";
import { db as defaultDb } from "../db/index";
import { liveLog, pointsHistory } from "../db/schema";

type Term = "term1" | "term2" | "term3" | "term4";
type Db = typeof defaultDb;

export const PLANNER_POINTS = 2;

/**
 * Awards points for a *new* planner submission:
 *  1. find the coach's liveLog entry for the term
 *  2. if found, increment points by PLANNER_POINTS
 *  3. if not found, create an entry with points = PLANNER_POINTS
 *  4. write an audit record into points_history
 *
 * MUST NOT be called for re-submissions (same coach + week).
 */
export async function awardPlannerPoints(
  coachName: string,
  term: Term,
  weekDate: Date,
  db: Db = defaultDb,
): Promise<void> {
  const existing = await db
    .select()
    .from(liveLog)
    .where(and(eq(liveLog.entityName, coachName), eq(liveLog.term, term)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(liveLog)
      .set({
        points: existing[0].points + PLANNER_POINTS,
        updatedAt: new Date(),
      })
      .where(eq(liveLog.id, existing[0].id));
  } else {
    await db
      .insert(liveLog)
      .values({ entityName: coachName, term, points: PLANNER_POINTS });
  }

  await db.insert(pointsHistory).values({
    coachName,
    term,
    points: PLANNER_POINTS,
    reason: "planner_submission",
    weekDate,
  });
}
