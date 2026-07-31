import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { db } from "../db/index";
import { coaches } from "../db/schema";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

export const coachesRouter = router({
  list: publicProcedure
    .input(z.object({ term: termSchema.optional() }).optional())
    .query(async ({ input }) => {
      if (input?.term) {
        return db.select().from(coaches).where(eq(coaches.term, input.term));
      }
      return db.select().from(coaches);
    }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1).max(255), term: termSchema }))
    .mutation(async ({ input }) => {
      const inserted = await db
        .insert(coaches)
        .values({ name: input.name.trim(), term: input.term })
        .returning();
      return inserted[0];
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      await db
        .update(coaches)
        .set({ name: input.name.trim(), updatedAt: new Date() })
        .where(eq(coaches.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(coaches).where(eq(coaches.id, input.id));
      return { success: true };
    }),

  copyRoster: adminProcedure
    .input(
      z.object({
        fromTerm: termSchema,
        toTerm: termSchema,
        overwrite: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.overwrite) {
        await db.delete(coaches).where(eq(coaches.term, input.toTerm));
      }
      const source = await db
        .select()
        .from(coaches)
        .where(eq(coaches.term, input.fromTerm));

      // Avoid duplicating names that already exist in the target term.
      const existing = await db
        .select()
        .from(coaches)
        .where(eq(coaches.term, input.toTerm));
      const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

      const toInsert = source
        .filter((c) => !existingNames.has(c.name.toLowerCase()))
        .map((c) => ({ name: c.name, term: input.toTerm }));

      if (toInsert.length > 0) {
        await db.insert(coaches).values(toInsert);
      }
      return { success: true, copied: toInsert.length };
    }),
});
