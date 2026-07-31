import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

export const SESSION_COOKIE = "ssh_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it in your environment variables.");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: number): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as { userId: number };
    if (typeof decoded.userId !== "number") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  return cookies[SESSION_COOKIE] ?? null;
}

export function buildSessionCookie(token: string): string {
  return serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function buildClearCookie(): string {
  return serialize(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
