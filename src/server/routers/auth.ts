import { z } from "zod";
import { eq, sql, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
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

      // The very first account, or one matching ADMIN_EMAIL, becomes an
      // approved admin. Everyone else starts as a pending coach account that
      // an admin must approve before it can sign in.
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
          approved: bootstrapAdmin,
          loginMethod: "password",
          lastSignedIn: bootstrapAdmin ? new Date() : null,
        })
        .returning();

      const user = inserted[0];
      // Only log the user in immediately if they're already approved (the
      // bootstrap admin). Pending coaches must wait for approval.
      if (user.approved) {
        ctx.res.setHeader("Set-Cookie", buildSessionCookie(signSession(user.id)));
      }
      return { ...publicUser(user), pending: !user.approved };
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
      if (!user.approved && user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is awaiting admin approval.",
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

  // ── Admin: manage coach accounts ──────────────────────────────
  listUsers: adminProcedure.query(async () => {
    const rows = await db
      .select()
      .from(users)
      // Pending accounts first, then newest.
      .orderBy(asc(users.approved), desc(users.createdAt));
    return rows.map(publicUser);
  }),

  setApproved: adminProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && !input.approved) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't revoke your own access." });
      }
      await db
        .update(users)
        .set({ approved: input.approved, updatedAt: new Date() })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  setRole: adminProcedure
    .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't remove your own admin role." });
      }
      // Promoting to admin implies approval.
      await db
        .update(users)
        .set({
          role: input.role,
          ...(input.role === "admin" ? { approved: true } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't delete your own account." });
      }
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
});
