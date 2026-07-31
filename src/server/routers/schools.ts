import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { db } from "../db/index";
import { schools } from "../db/schema";

export const schoolsRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(schools).orderBy(asc(schools.name));
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      const inserted = await db
        .insert(schools)
        .values({ name: input.name.trim() })
        .returning();
      return inserted[0];
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      await db
        .update(schools)
        .set({ name: input.name.trim(), updatedAt: new Date() })
        .where(eq(schools.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schools).where(eq(schools.id, input.id));
      return { success: true };
    }),
});
