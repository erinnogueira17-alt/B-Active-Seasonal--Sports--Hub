import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { notices } from "../db/schema.js";

export const noticesRouter = router({
  list: publicProcedure.query(async () => {
    try {
      return await db.select().from(notices).orderBy(desc(notices.createdAt));
    } catch {
      // Table may not exist yet (before the one-time migration) — show empty.
      return [];
    }
  }),

  create: adminProcedure
    .input(z.object({ body: z.string().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const inserted = await db
        .insert(notices)
        .values({ body: input.body.trim(), createdBy: ctx.user.id })
        .returning();
      return inserted[0];
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(notices).where(eq(notices.id, input.id));
      return { success: true };
    }),
});
