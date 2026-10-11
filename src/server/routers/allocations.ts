import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { allocations } from "../db/schema.js";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

export const allocationsRouter = router({
  // Admins add/remove allocations from the Allocations page.
  create: adminProcedure
    .input(
      z.object({
        coachName: z.string().min(1).max(255),
        team: z.string().min(1).max(255),
        school: z.string().min(1).max(255),
        term: termSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const inserted = await db
        .insert(allocations)
        .values({
          coachName: input.coachName.trim(),
          team: input.team.trim(),
          school: input.school.trim(),
          term: input.term,
        })
        .returning();
      return inserted[0];
    }),

  listByTerm: publicProcedure
    .input(z.object({ term: termSchema }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(allocations)
        .where(eq(allocations.term, input.term));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(allocations).where(eq(allocations.id, input.id));
      return { success: true };
    }),
});
