"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getSiteLogs(
  projectId: string,
  filters?: { type?: string; severity?: string }
) {
  const session = await requirePermission("projects:read");
  const orgId = session.organizationId;

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found");

  const where: any = { projectId };
  if (filters?.type) where.type = filters.type;
  if (filters?.severity) where.severity = filters.severity;

  const logs = await db.siteLog.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return JSON.parse(JSON.stringify(logs));
}

export async function createSiteLog(data: {
  projectId: string;
  date: string;
  type: string;
  description: string;
  severity?: string;
  reportedBy?: string;
}) {
  const session = await requirePermission("projects:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found");

  const log = await db.siteLog.create({
    data: {
      projectId: data.projectId,
      date: new Date(data.date),
      type: data.type,
      description: data.description,
      severity: data.severity,
      reportedBy: data.reportedBy ?? session.name ?? "Unknown",
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(log));
}

export async function resolveSiteLog(id: string) {
  const session = await requirePermission("projects:write");

  const log = await db.siteLog.findFirst({
    where: { id },
    include: { project: { select: { organizationId: true } } },
  });
  if (!log || log.project.organizationId !== session.organizationId) {
    throw new Error("Log not found");
  }

  await db.siteLog.update({
    where: { id },
    data: { resolvedAt: new Date() },
  });
}
