"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function getOrganization() {
  const session = await getSessionOrThrow();

  return db.organization.findUnique({
    where: { id: session.organizationId },
  });
}

export async function updateOrganization(data: {
  name?: string;
  crNumber?: string;
  vatNumber?: string;
}) {
  const session = await getSessionOrThrow();

  // Only admins can update org settings
  if (!["SUPER_ADMIN", "DEV_ADMIN"].includes(session.role)) {
    throw new Error("Only administrators can update organization settings");
  }

  const org = await db.organization.update({
    where: { id: session.organizationId },
    data,
  });

  revalidatePath("/dashboard/settings");
  return org;
}
