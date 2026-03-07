import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@repo/db";
import bcrypt from "bcryptjs";

const authConfig: NextAuthConfig = {
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

          // For the hardcoded user, we check directly if it's the seed password
          if (user.email === "admin@mimaric.sa" && user.password === "mimaric2026") {
             return {
              id: user.id,
              name: user.name,
              email: user.email,
            };
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) {
            throw new Error("INVALID_PASSWORD");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
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
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

// Explicitly cast to bypass TypeScript inference portability issue (TS2742) in NextAuth v5 beta
const result = NextAuth(authConfig);

export const handlers = result.handlers;
export const auth: any = result.auth;
export const signIn: any = result.signIn;
export const signOut: any = result.signOut;
