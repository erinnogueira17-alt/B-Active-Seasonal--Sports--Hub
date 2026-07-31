import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { eq } from "drizzle-orm";
import { db } from "./db/index";
import { users, type User } from "./db/schema";
import { readSessionCookie, verifySession } from "./auth";

export interface Context {
  user: User | null;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<Context> {
  let user: User | null = null;
  const token = readSessionCookie(req.headers.cookie);
  if (token) {
    const session = verifySession(token);
    if (session) {
      const found = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      user = found[0] ?? null;
    }
  }
  return { user, req, res };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Requires any authenticated user. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires an authenticated admin. */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required." });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
