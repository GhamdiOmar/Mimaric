"use server";

import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function getTeamMembers() {
  const session = await getSessionOrThrow();

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
  const session = await getSessionOrThrow();

  // Only admins can invite
  if (!["SUPER_ADMIN", "DEV_ADMIN"].includes(session.role)) {
    throw new Error("Only administrators can invite team members");
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("A user with this email already exists");

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

  revalidatePath("/dashboard/settings/team");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function updateTeamMember(userId: string, data: { role?: any; name?: string }) {
  const session = await getSessionOrThrow();

  // Only admins can update roles
  if (!["SUPER_ADMIN", "DEV_ADMIN"].includes(session.role)) {
    throw new Error("Only administrators can update team members");
  }

  // Verify user belongs to same org
  const user = await db.user.findFirst({
    where: { id: userId, organizationId: session.organizationId },
  });
  if (!user) throw new Error("User not found");

  const updated = await db.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true },
  });

  revalidatePath("/dashboard/settings/team");
  return updated;
}

export async function removeTeamMember(userId: string) {
  const session = await getSessionOrThrow();

  if (!["SUPER_ADMIN", "DEV_ADMIN"].includes(session.role)) {
    throw new Error("Only administrators can remove team members");
  }

  // Can't remove yourself
  if (userId === session.userId) {
    throw new Error("Cannot remove yourself");
  }

  const user = await db.user.findFirst({
    where: { id: userId, organizationId: session.organizationId },
  });
  if (!user) throw new Error("User not found");

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/settings/team");
}
