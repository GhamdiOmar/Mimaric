import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

type AuthHandler = (req: NextRequest) => Promise<NextResponse | Response | undefined | null | void>;

export async function proxy(req: NextRequest): Promise<NextResponse | Response | undefined | null | void> {
  // Redirect bare root to default (Arabic) locale
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/ar", req.url));
  }

  // Delegate dashboard auth protection to NextAuth
  return (auth as AuthHandler)(req);
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
