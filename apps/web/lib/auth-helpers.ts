"use server";

import { auth } from "../auth";
import { db } from "@repo/db";
import { hasPermission, type Permission } from "./permissions";

export type AuthSession = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
};

/**
 * Get the authenticated session or throw an error.
 * Use this in all server actions to enforce auth + get org context.
 */
export async function getSessionOrThrow(): Promise<AuthSession> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // If session already has organizationId (from JWT), use it directly
  if (session.user.organizationId && session.user.role) {
    return {
      userId: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? null,
      role: session.user.role,
      organizationId: session.user.organizationId,
    };
  }

  // Fallback: fetch from DB (shouldn't happen if JWT callbacks are working)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true, name: true },
  });

  if (!user?.organizationId) {
    throw new Error("User has no organization");
  }

  return {
    userId: session.user.id,
    email: session.user.email!,
    name: user.name ?? session.user.name ?? null,
    role: user.role,
    organizationId: user.organizationId,
  };
}

/**
 * Get session and require a specific permission, or throw Forbidden.
 */
export async function requirePermission(permission: Permission): Promise<AuthSession> {
  const session = await getSessionOrThrow();
  if (!hasPermission(session.role, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
  return session;
}

/**
 * Get session with a convenience `can()` method for checking permissions inline.
 */
export async function getSessionWithPermissions(): Promise<AuthSession & { can: (p: Permission) => boolean }> {
  const session = await getSessionOrThrow();
  return {
    ...session,
    can: (p: Permission) => hasPermission(session.role, p),
  };
}
