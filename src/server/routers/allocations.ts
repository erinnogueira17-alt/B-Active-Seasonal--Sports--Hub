import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "../trpc";
import { db } from "../db/index";
import { allocations } from "../db/schema";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

export const allocationsRouter = router({
  // NOTE: create/delete are intentionally public for ease of bulk data loading.
  // See SECURITY NOTES — restrict to admin for a production hardening pass.
  create: publicProcedure
    .input(
      z.object({
        coachName: z.string().min(1).max(255),
        team: z.string().min(1).max(255),
        school: z.string().min(1).max(255),
        term: termSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const inserted = await db.insert(allocations).values(input).returning();
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

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(allocations).where(eq(allocations.id, input.id));
      return { success: true };
    }),
});
