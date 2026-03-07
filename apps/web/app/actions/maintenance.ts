"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function createMaintenanceRequest(data: {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  unitId: string;
}) {
  const session = await getSessionOrThrow();

  const request = await db.maintenanceRequest.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: (data.priority as any) ?? "MEDIUM",
      unitId: data.unitId,
      organizationId: session.organizationId,
    },
  });

  revalidatePath("/dashboard/maintenance");
  return request;
}

export async function getMaintenanceRequests(filters?: {
  status?: string;
  priority?: string;
}) {
  const session = await getSessionOrThrow();

  const where: any = { organizationId: session.organizationId };
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  const results = await db.maintenanceRequest.findMany({
    where,
    include: {
      unit: { include: { building: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return JSON.parse(JSON.stringify(results));
}

export async function updateMaintenanceRequest(
  requestId: string,
  data: {
    status?: string;
    assignedToId?: string;
    resolvedAt?: Date;
  }
) {
  const session = await getSessionOrThrow();

  const request = await db.maintenanceRequest.findFirst({
    where: { id: requestId, organizationId: session.organizationId },
  });
  if (!request) throw new Error("Request not found");

  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.assignedToId) updateData.assignedToId = data.assignedToId;
  if (data.status === "RESOLVED") updateData.resolvedAt = new Date();

  const updated = await db.maintenanceRequest.update({
    where: { id: requestId },
    data: updateData,
  });

  revalidatePath("/dashboard/maintenance");
  return updated;
}
