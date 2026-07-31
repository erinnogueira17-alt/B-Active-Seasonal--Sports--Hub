import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  signSession,
  buildSessionCookie,
  buildClearCookie,
} from "../auth.js";
import { isBootstrapAdmin } from "../lib/roles.js";

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

      // The very first account, or one matching ADMIN_EMAIL, becomes an admin.
      // Everyone else is a coach with immediate access (no approval needed).
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const bootstrapAdmin = isBootstrapAdmin(count, process.env.ADMIN_EMAIL, email);

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
      // Log them in straight away — coaches are active immediately.
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

  // A signed-in coach asks to become an admin. An existing admin then approves
  // (promotes) them from the Team page.
  requestAdmin: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      return { success: true, alreadyAdmin: true };
    }
    await db
      .update(users)
      .set({ adminRequested: true, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));
    return { success: true, alreadyAdmin: false };
  }),

  // ── Admin: manage the team ────────────────────────────────────
  listUsers: adminProcedure.query(async () => {
    const rows = await db
      .select()
      .from(users)
      // Admin requests first, then newest.
      .orderBy(desc(users.adminRequested), desc(users.createdAt));
    return rows.map(publicUser);
  }),

  // Promote a coach to admin (approve) or demote an admin back to coach.
  setRole: adminProcedure
    .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't remove your own admin role." });
      }
      await db
        .update(users)
        .set({ role: input.role, adminRequested: false, updatedAt: new Date() })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  // Dismiss a coach's admin request without promoting them.
  dismissAdminRequest: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ adminRequested: false, updatedAt: new Date() })
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
