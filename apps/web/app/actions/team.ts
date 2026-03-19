"use server";

import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { validatePassword } from "../../lib/password-policy";
import { isSystemRole } from "../../lib/permissions";
import { checkLimit, FEATURE_KEYS } from "../../lib/entitlements";

export async function getTeamMembers() {
  const session = await requirePermission("team:read");

  return db.user.findMany({
    where: { organizationId: session.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function inviteTeamMember(data: {
  name: string;
  email: string;
  role: any;
  password: string;
}) {
  const session = await requirePermission("team:write");

  // Guard: non-system users cannot assign system roles
  if (isSystemRole(data.role) && !isSystemRole(session.role)) {
    throw new Error("You don't have permission to assign system-level roles. Please contact a system administrator.");
  }

  // Entitlement check: users.max
  const userCount = await db.user.count({ where: { organizationId: session.organizationId } });
  const entitlement = await checkLimit(session.organizationId, FEATURE_KEYS.USERS_MAX, userCount);
  if (!entitlement.granted) {
    throw new Error(entitlement.reason ?? "Team member limit reached. Please upgrade your plan.");
  }

  // Validate password strength
  const validation = validatePassword(data.password, { name: data.name, email: data.email });
  if (!validation.valid) {
    throw new Error(validation.errors.map((e) => e.en).join(" "));
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("A user with this email address already exists. Please use a different email or check the existing team members.");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      password: hashedPassword,
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "CREATE", resource: "User", resourceId: user.id, metadata: { role: data.role }, organizationId: session.organizationId });

  revalidatePath("/dashboard/settings/team");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function updateTeamMember(userId: string, data: { role?: any; name?: string }) {
  const session = await requirePermission("team:write");

  // Guard: non-system users cannot assign system roles
  if (data.role && isSystemRole(data.role) && !isSystemRole(session.role)) {
    throw new Error("You don't have permission to assign system-level roles. Please contact a system administrator.");
  }

  // Verify user belongs to same org
  const user = await db.user.findFirst({
    where: { id: userId, organizationId: session.organizationId },
  });
  if (!user) throw new Error("Team member not found. Please verify they belong to your organization.");

  const updated = await db.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "User", resourceId: userId, metadata: { fields: Object.keys(data) }, organizationId: session.organizationId });

  revalidatePath("/dashboard/settings/team");
  return updated;
}

export async function removeTeamMember(userId: string) {
  const session = await requirePermission("team:delete");

  // Can't remove yourself
  if (userId === session.userId) {
    throw new Error("You cannot remove your own account. Please ask another administrator to do this.");
  }

  const user = await db.user.findFirst({
    where: { id: userId, organizationId: session.organizationId },
  });
  if (!user) throw new Error("Team member not found. Please verify they belong to your organization.");

  await db.user.delete({ where: { id: userId } });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "DELETE", resource: "User", resourceId: userId, organizationId: session.organizationId });

  revalidatePath("/dashboard/settings/team");
}
