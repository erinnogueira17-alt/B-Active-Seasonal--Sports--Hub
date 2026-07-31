import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "../db/index";
import { events } from "../db/schema";

const categorySchema = z.enum(["fixture", "festival", "tournament", "training"]);

export const eventsRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(events).orderBy(asc(events.date));
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        date: z.coerce.date(),
        category: categorySchema.default("fixture"),
        color: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const inserted = await db
        .insert(events)
        .values({
          title: input.title,
          description: input.description,
          date: input.date,
          category: input.category,
          color: input.color ?? "#F59E0B",
          createdBy: ctx.user.id,
        })
        .returning();
      return inserted[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        date: z.coerce.date(),
        category: categorySchema,
        color: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(events)
        .set({
          title: input.title,
          description: input.description,
          date: input.date,
          category: input.category,
          color: input.color,
          updatedAt: new Date(),
        })
        .where(eq(events.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),
});
