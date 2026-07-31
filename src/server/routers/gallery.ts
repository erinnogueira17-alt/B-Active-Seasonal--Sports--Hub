import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "../db/index";
import { gallery } from "../db/schema";
import { uploadBase64 } from "../blob";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const galleryRouter = router({
  upload: publicProcedure
    .input(
      z.object({
        title: z.string().max(255).optional(),
        caption: z.string().optional(),
        imageData: z.string().min(1), // base64
        fileName: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { url, key, size } = await uploadBase64(
        "gallery",
        input.fileName,
        input.imageData,
      );
      if (size > MAX_IMAGE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image too large (max 10 MB).",
        });
      }
      const inserted = await db
        .insert(gallery)
        .values({
          title: input.title,
          caption: input.caption,
          imageUrl: url,
          imageKey: key,
          uploadedBy: ctx.user?.id,
        })
        .returning();
      return { success: true, photo: inserted[0] };
    }),

  list: publicProcedure.query(async () => {
    return db.select().from(gallery).orderBy(desc(gallery.createdAt));
  }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(gallery).where(eq(gallery.id, input.id));
      return { success: true };
    }),

  updateCaption: protectedProcedure
    .input(z.object({ id: z.number(), caption: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(gallery)
        .set({ caption: input.caption, updatedAt: new Date() })
        .where(eq(gallery.id, input.id));
      return { success: true };
    }),
});
