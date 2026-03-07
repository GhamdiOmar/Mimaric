"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function registerFileInDb(data: {
  name: string;
  url: string;
  type: string;
  size?: number;
  projectId?: string;
  customerId?: string;
  category?: any;
}) {
  const session = await getSessionOrThrow();

  const document = await db.document.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      projectId: data.projectId,
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
  const session = await getSessionOrThrow();

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
  const session = await getSessionOrThrow();

  await db.document.delete({
    where: { id: documentId, organizationId: session.organizationId },
  });

  revalidatePath("/dashboard/documents");
}
