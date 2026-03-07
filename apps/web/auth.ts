import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { logAuditEvent } from "./lib/audit";

/**
 * In-memory rate limiter for login attempts.
 * Thresholds:  5 fails → 30s,  10 fails → 5min,  20 fails → 15min
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(email: string): { blocked: boolean; retryAfterSeconds: number } {
  const entry = loginAttempts.get(email);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };

  const now = Date.now();
  const elapsed = (now - entry.lastAttempt) / 1000;

  let cooldown = 0;
  if (entry.count >= 20) cooldown = 900; // 15 minutes
  else if (entry.count >= 10) cooldown = 300; // 5 minutes
  else if (entry.count >= 5) cooldown = 30; // 30 seconds

  if (cooldown > 0 && elapsed < cooldown) {
    return { blocked: true, retryAfterSeconds: Math.ceil(cooldown - elapsed) };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

function recordFailedAttempt(email: string) {
  const entry = loginAttempts.get(email);
  loginAttempts.set(email, { count: (entry?.count ?? 0) + 1, lastAttempt: Date.now() });
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

/**
 * Full auth config — extends edge-safe authConfig with Node.js-only features:
 * PrismaAdapter, bcrypt password verification, Credentials provider.
 */
const result = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        // Rate limit check
        const rateCheck = checkRateLimit(email);
        if (rateCheck.blocked) {
          throw new Error(`RATE_LIMITED:${rateCheck.retryAfterSeconds}`);
        }

        try {
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            recordFailedAttempt(email);
            throw new Error("USER_NOT_FOUND");
          }

          if (!user.password) {
            recordFailedAttempt(email);
            throw new Error("INVALID_PASSWORD");
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) {
            recordFailedAttempt(email);
            throw new Error("INVALID_PASSWORD");
          }

          // Success — clear rate limit counter
          clearAttempts(email);

          // Log successful login
          logAuditEvent({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: "LOGIN",
            resource: "Auth",
            organizationId: user.organizationId,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
          };
        } catch (error: any) {
          if (error.message === "USER_NOT_FOUND" || error.message === "INVALID_PASSWORD" || error.message.startsWith("RATE_LIMITED")) {
            throw error;
          }
          console.error("Auth error:", error);
          throw new Error("DATABASE_ERROR");
        }
      },
    }),
  ],
});

export const handlers = result.handlers;
export const auth: any = result.auth;
export const signIn: any = result.signIn;
export const signOut: any = result.signOut;
