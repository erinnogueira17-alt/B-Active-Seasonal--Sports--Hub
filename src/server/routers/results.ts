import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { db } from "../db/index";
import { results } from "../db/schema";

export const resultsRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        coachName: z.string().min(1).max(255),
        sport: z.string().min(1).max(100),
        team: z.string().min(1).max(255),
        ageGroup: z.string().max(100).optional(),
        date: z.coerce.date(),
        opposition: z.string().max(255).optional(),
        result: z.string().max(255).optional(),
        feedback: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const inserted = await db
        .insert(results)
        .values({
          coachName: input.coachName,
          sport: input.sport,
          team: input.team,
          ageGroup: input.ageGroup,
          date: input.date,
          opposition: input.opposition,
          result: input.result,
          feedback: input.feedback,
          submittedBy: ctx.user?.id,
        })
        .returning();
      return inserted[0];
    }),

  list: publicProcedure.query(async () => {
    return db.select().from(results).orderBy(desc(results.date));
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(results).where(eq(results.id, input.id));
      return { success: true };
    }),
});
