import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware uses edge-safe authConfig (no bcrypt/prisma adapter).
 * Only validates the JWT and checks the `authorized` callback.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all dashboard routes — redirect to login if not authenticated.
     * Exclude: auth pages, API routes, static files, images.
     */
    "/dashboard/:path*",
  ],
};
