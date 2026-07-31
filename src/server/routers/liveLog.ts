import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { liveLog } from "../db/schema.js";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

export const liveLogRouter = router({
  upsert: protectedProcedure
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

  update: protectedProcedure
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

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(liveLog).where(eq(liveLog.id, input.id));
      return { success: true };
    }),
});
