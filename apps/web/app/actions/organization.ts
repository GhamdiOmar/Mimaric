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
  nameArabic?: string;
  nameEnglish?: string;
  tradeNameArabic?: string;
  tradeNameEnglish?: string;
  crNumber?: string;
  unifiedNumber?: string;
  vatNumber?: string;
  entityType?: any;
  legalForm?: any;
  registrationStatus?: any;
  registrationDate?: string;
  expiryDate?: string;
  capitalAmountSar?: number;
  mainActivityCode?: string;
  mainActivityNameAr?: string;
  contactInfo?: any;
  nationalAddress?: any;
  managerInfo?: any;
}) {
  const session = await getSessionOrThrow();

  if (!["SUPER_ADMIN", "DEV_ADMIN"].includes(session.role)) {
    throw new Error("Only administrators can update organization settings");
  }

  const updateData: any = { ...data };
  if (data.registrationDate) updateData.registrationDate = new Date(data.registrationDate);
  if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);

  const org = await db.organization.update({
    where: { id: session.organizationId },
    data: updateData,
  });

  revalidatePath("/dashboard/settings");
  return org;
}
