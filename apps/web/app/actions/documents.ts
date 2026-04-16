"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

export async function registerFileInDb(data: {
  name: string;
  url: string;
  type: string;
  size?: number;
  customerId?: string;
  category?: any;
}) {
  const session = await requirePermission("documents:write");

  const document = await db.document.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      customerId: data.customerId,
      category: data.category || "GENERAL",
      organizationId: session.organizationId,
      userId: session.userId,
    },
  });

  revalidatePath("/dashboard/documents");
  return document;
}

export async function getDocuments(filters?: {
  category?: string;
  search?: string;
}) {
  const session = await requirePermission("documents:read");

  const where: any = { organizationId: session.organizationId };

  if (filters?.category) {
    where.category = filters.category;
  }
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  return db.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(documentId: string) {
  const session = await requirePermission("documents:delete");

  await db.document.delete({
    where: { id: documentId, organizationId: session.organizationId },
  });

  revalidatePath("/dashboard/documents");
}
