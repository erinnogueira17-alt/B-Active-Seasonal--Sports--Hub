import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  signSession,
  buildSessionCookie,
  buildClearCookie,
} from "../auth.js";

function publicUser(u: User) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ? publicUser(ctx.user) : null;
  }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(255),
        password: z.string().min(8).max(200),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with that email already exists.",
        });
      }

      // The very first account, or one matching ADMIN_EMAIL, becomes admin.
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const bootstrapAdmin =
        count === 0 ||
        (!!process.env.ADMIN_EMAIL &&
          process.env.ADMIN_EMAIL.toLowerCase().trim() === email);

      const passwordHash = await hashPassword(input.password);
      const inserted = await db
        .insert(users)
        .values({
          name: input.name.trim(),
          email,
          passwordHash,
          role: bootstrapAdmin ? "admin" : "user",
          loginMethod: "password",
          lastSignedIn: new Date(),
        })
        .returning();

      const user = inserted[0];
      ctx.res.setHeader("Set-Cookie", buildSessionCookie(signSession(user.id)));
      return publicUser(user);
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(255),
        password: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const found = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = found[0];
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));
      ctx.res.setHeader("Set-Cookie", buildSessionCookie(signSession(user.id)));
      return publicUser(user);
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", buildClearCookie());
    return { success: true };
  }),
});
