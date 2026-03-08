import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no Node.js-only imports (bcrypt, prisma adapter).
 * Used by middleware.ts for route protection.
 * Full auth with DB + bcrypt lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnboarding = nextUrl.pathname === "/dashboard/onboarding";

      if (isOnDashboard) {
        if (!isLoggedIn) return false; // Redirect to login

        // Redirect un-onboarded users to onboarding wizard
        const onboardingDone = (auth?.user as any)?.onboardingCompleted !== false;
        if (!onboardingDone && !isOnboarding) {
          return Response.redirect(new URL("/dashboard/onboarding", nextUrl));
        }

        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.onboardingCompleted = (user as any).onboardingCompleted ?? true;
        token.accountType = (user as any).accountType ?? null;
      }
      // Refresh token data on session update (e.g., after onboarding completion)
      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.organizationId !== undefined) {
          token.organizationId = session.organizationId;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        (session.user as any).role = (token.role as string) ?? "USER";
        (session.user as any).organizationId = (token.organizationId as string) ?? "";
        (session.user as any).onboardingCompleted = token.onboardingCompleted ?? true;
        (session.user as any).accountType = token.accountType ?? null;
      }
      return session;
    },
  },
  providers: [], // Providers added in full auth.ts
} satisfies NextAuthConfig;
