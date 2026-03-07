import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

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

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          if (!user.password) {
            throw new Error("INVALID_PASSWORD");
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) {
            throw new Error("INVALID_PASSWORD");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
          };
        } catch (error: any) {
          if (error.message === "USER_NOT_FOUND" || error.message === "INVALID_PASSWORD") {
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
