import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { liveLog, pointsHistory } from "../db/schema.js";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

/** Points awarded when an admin names a Coach of the Week. */
export const COACH_OF_WEEK_POINTS = 3;

export const liveLogRouter = router({
  upsert: adminProcedure
    .input(
      z.object({
        entityName: z.string().min(1).max(255),
        points: z.number().int(),
        term: termSchema.default("term3"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db
        .select()
        .from(liveLog)
        .where(
          and(
            eq(liveLog.entityName, input.entityName),
            eq(liveLog.term, input.term),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(liveLog)
          .set({
            points: input.points,
            updatedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(liveLog.id, existing[0].id));
        return { success: true, id: existing[0].id };
      }

      const inserted = await db
        .insert(liveLog)
        .values({
          entityName: input.entityName,
          points: input.points,
          term: input.term,
          updatedBy: ctx.user.id,
        })
        .returning();
      return { success: true, id: inserted[0].id };
    }),

  list: publicProcedure
    .input(z.object({ term: termSchema.optional() }).optional())
    .query(async ({ input }) => {
      const term = input?.term ?? "term3";
      return db
        .select()
        .from(liveLog)
        .where(eq(liveLog.term, term))
        .orderBy(desc(liveLog.points));
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        entityName: z.string().min(1).max(255),
        points: z.number().int(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(liveLog)
        .set({
          entityName: input.entityName,
          points: input.points,
          updatedBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(liveLog.id, input.id));
      return { success: true };
    }),

  // Name a Coach of the Week for the term → +3 points (with an audit record).
  coachOfWeek: adminProcedure
    .input(z.object({ entityName: z.string().min(1).max(255), term: termSchema.default("term3") }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db
        .select()
        .from(liveLog)
        .where(and(eq(liveLog.entityName, input.entityName), eq(liveLog.term, input.term)))
        .limit(1);

      if (existing[0]) {
        await db
          .update(liveLog)
          .set({
            points: existing[0].points + COACH_OF_WEEK_POINTS,
            updatedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(liveLog.id, existing[0].id));
      } else {
        await db.insert(liveLog).values({
          entityName: input.entityName,
          points: COACH_OF_WEEK_POINTS,
          term: input.term,
          updatedBy: ctx.user.id,
        });
      }

      await db.insert(pointsHistory).values({
        coachName: input.entityName,
        term: input.term,
        points: COACH_OF_WEEK_POINTS,
        reason: "coach_of_week",
        weekDate: new Date(),
      });

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(liveLog).where(eq(liveLog.id, input.id));
      return { success: true };
    }),
});
