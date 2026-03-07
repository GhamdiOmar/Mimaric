"use server";

import { db } from "@repo/db";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function registerFileInDb(data: {
  name: string;
  url: string;
  type: string;
  projectId?: string;
  customerId?: string;
  category?: any;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // We need the organizationId from the user's session
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  if (!user) throw new Error("User organization not found");

  const document = await db.document.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      projectId: data.projectId,
      customerId: data.customerId,
      category: data.category || "GENERAL",
      organizationId: user.organizationId,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/documents");
  return document;
}

export async function getDocuments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  if (!user) return [];

  return db.document.findMany({
    where: {
      organizationId: user.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
