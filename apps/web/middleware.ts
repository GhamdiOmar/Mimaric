import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Middleware uses edge-safe authConfig (no bcrypt/prisma adapter).
 * Only validates the JWT and checks the `authorized` callback.
 */
const { auth } = NextAuth(authConfig);

export default auth as (req: NextRequest) => Promise<NextResponse | Response | undefined | null | void>;

export const config = {
  matcher: [
    /*
     * Match all dashboard routes — redirect to login if not authenticated.
     * Exclude: auth pages, API routes, static files, images.
     */
    "/dashboard/:path*",
  ],
};
