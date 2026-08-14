import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
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
import { isBootstrapAdmin } from "../lib/roles.js";
import { verifyCoachPin, normalizeCoachName, coachEmail, COACH_PIN } from "../lib/coachAccess.js";

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

  // Simple coach sign-in: first name + surname + the shared access code.
  // No per-coach password. Keys a coach account row from the name so photo
  // uploads etc. stay attributed.
  coachLogin: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(120),
        surname: z.string().min(1).max(120),
        pin: z.string().min(1).max(40),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!verifyCoachPin(input.pin)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect access code." });
      }
      const { display } = normalizeCoachName(input.firstName, input.surname);
      const email = coachEmail(input.firstName, input.surname);

      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
      let user = found[0];
      if (user) {
        await db
          .update(users)
          .set({ name: display, lastSignedIn: new Date() })
          .where(eq(users.id, user.id));
        user = { ...user, name: display };
      } else {
        // Placeholder hash — coaches never sign in by password.
        const passwordHash = await hashPassword(`coach:${email}:${COACH_PIN}`);
        const inserted = await db
          .insert(users)
          .values({
            name: display,
            email,
            passwordHash,
            role: "user",
            loginMethod: "coach_pin",
            lastSignedIn: new Date(),
          })
          .returning();
        user = inserted[0];
      }
      ctx.res.setHeader("Set-Cookie", buildSessionCookie(signSession(user.id)));
      return publicUser(user);
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", buildClearCookie());
    return { success: true };
  }),

  // ── Admin: manage the team ────────────────────────────────────
  listUsers: adminProcedure.query(async () => {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map(publicUser);
  }),

  // Create a new admin account (email + password). Admins are the only
  // password-based logins.
  createAdmin: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(255),
        password: z.string().min(8).max(200),
      }),
    )
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase().trim();
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing[0]) {
        // Promote an existing account to admin with a fresh password.
        const passwordHash = await hashPassword(input.password);
        await db
          .update(users)
          .set({ name: input.name.trim(), role: "admin", passwordHash, loginMethod: "password", updatedAt: new Date() })
          .where(eq(users.id, existing[0].id));
        return { success: true, promoted: true };
      }
      const passwordHash = await hashPassword(input.password);
      await db.insert(users).values({
        name: input.name.trim(),
        email,
        passwordHash,
        role: "admin",
        loginMethod: "password",
      });
      return { success: true, promoted: false };
    }),

  // Demote an admin back to a coach.
  setRole: adminProcedure
    .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't remove your own admin role." });
      }
      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
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
