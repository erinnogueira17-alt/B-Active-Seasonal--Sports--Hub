import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { resources } from "../db/schema.js";
import { uploadBase64 } from "../blob.js";

const categorySchema = z.enum([
  "football",
  "rugby",
  "hockey",
  "netball",
  "swimming",
  "athletics",
  "softball",
  "basketball",
  "tennis",
]);
const subcategorySchema = z.enum(["coaching_guides", "refereeing_umpiring"]);

const MAX_RESOURCE_BYTES = 16 * 1024 * 1024; // 16 MB

export const resourcesRouter = router({
  upload: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        category: categorySchema,
        subcategory: subcategorySchema.optional(),
        fileData: z.string().min(1), // base64
        fileName: z.string().min(1),
        fileType: z.string().max(100),
        fileSize: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.fileSize && input.fileSize > MAX_RESOURCE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File too large (max 16 MB).",
        });
      }
      const { url, key, size } = await uploadBase64(
        "resources",
        input.fileName,
        input.fileData,
        input.fileType,
      );
      if (size > MAX_RESOURCE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File too large (max 16 MB).",
        });
      }
      const inserted = await db
        .insert(resources)
        .values({
          title: input.title,
          description: input.description,
          category: input.category,
          subcategory: input.subcategory,
          fileUrl: url,
          fileKey: key,
          fileType: input.fileType,
          fileSize: size,
          uploadedBy: ctx.user.id,
        })
        .returning();
      return { success: true, url, resource: inserted[0] };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        category: categorySchema,
        subcategory: subcategorySchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(resources)
        .set({
          title: input.title,
          description: input.description,
          category: input.category,
          subcategory: input.subcategory,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, input.id));
      return { success: true };
    }),

  list: publicProcedure.query(async () => {
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(resources).where(eq(resources.id, input.id));
      return { success: true };
    }),
});
