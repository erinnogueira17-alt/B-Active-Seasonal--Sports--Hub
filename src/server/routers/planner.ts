import { z } from "zod";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { plannerSubmissions } from "../db/schema.js";
import { awardPlannerPoints } from "../lib/points.js";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

/** Start/end of the calendar day containing `d` (UTC). */
function dayRange(d: Date): [Date, Date] {
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return [start, end];
}

export const plannerRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        coachName: z.string().min(1).max(255),
        plannerUrl: z.string().url(),
        weekDate: z.coerce.date(),
        term: termSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [dayStart, dayEnd] = dayRange(input.weekDate);

      // Unique by coach + week (matched across the whole calendar day).
      const existing = await db
        .select()
        .from(plannerSubmissions)
        .where(
          and(
            eq(plannerSubmissions.coachName, input.coachName),
            gte(plannerSubmissions.weekDate, dayStart),
            lte(plannerSubmissions.weekDate, dayEnd),
          ),
        )
        .limit(1);

      if (existing[0]) {
        // Re-submission: update URL only, do NOT award extra points.
        await db
          .update(plannerSubmissions)
          .set({ plannerUrl: input.plannerUrl, updatedAt: new Date() })
          .where(eq(plannerSubmissions.id, existing[0].id));
        return { success: true, awarded: false };
      }

      await db.insert(plannerSubmissions).values({
        coachName: input.coachName,
        plannerUrl: input.plannerUrl,
        weekDate: input.weekDate,
        term: input.term,
      });
      await awardPlannerPoints(input.coachName, input.term, input.weekDate);
      return { success: true, awarded: true };
    }),

  listAll: adminProcedure
    .input(z.object({ term: termSchema.optional() }).optional())
    .query(async ({ input }) => {
      if (input?.term) {
        return db
          .select()
          .from(plannerSubmissions)
          .where(eq(plannerSubmissions.term, input.term))
          .orderBy(desc(plannerSubmissions.submittedAt));
      }
      return db
        .select()
        .from(plannerSubmissions)
        .orderBy(desc(plannerSubmissions.submittedAt));
    }),

  listByWeek: adminProcedure
    .input(z.object({ weekDate: z.coerce.date() }))
    .query(async ({ input }) => {
      const [dayStart, dayEnd] = dayRange(input.weekDate);
      return db
        .select()
        .from(plannerSubmissions)
        .where(
          and(
            gte(plannerSubmissions.weekDate, dayStart),
            lte(plannerSubmissions.weekDate, dayEnd),
          ),
        )
        .orderBy(desc(plannerSubmissions.submittedAt));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .delete(plannerSubmissions)
        .where(eq(plannerSubmissions.id, input.id));
      return { success: true };
    }),
});
