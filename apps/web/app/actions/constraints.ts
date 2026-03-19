"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getConstraints(projectId: string) {
  const session = await requirePermission("constraints:read");
  const orgId = session.organizationId;

  // Verify project belongs to this org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const constraints = await db.constraintRecord.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(constraints));
}

export async function createConstraint(data: {
  projectId: string;
  type: string;
  label: string;
  labelArabic?: string;
  severity?: string;
  description?: string;
  source?: string;
  mitigationPlan?: string;
  metadata?: any;
}) {
  const session = await requirePermission("constraints:write");
  const orgId = session.organizationId;

  // Verify project belongs to this org
  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const constraint = await db.constraintRecord.create({
    data: {
      projectId: data.projectId,
      type: data.type as any,
      label: data.label,
      labelArabic: data.labelArabic,
      severity: (data.severity as any) ?? "MEDIUM",
      description: data.description,
      source: data.source,
      mitigationPlan: data.mitigationPlan,
      status: "IDENTIFIED",
      metadata: data.metadata,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(constraint));
}

export async function updateConstraint(
  id: string,
  data: {
    label?: string;
    labelArabic?: string;
    severity?: string;
    description?: string;
    source?: string;
    mitigationPlan?: string;
    status?: string;
    metadata?: any;
  }
) {
  const session = await requirePermission("constraints:write");
  const orgId = session.organizationId;

  const existing = await db.constraintRecord.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Constraint not found. Please refresh and try again.");

  const updated = await db.constraintRecord.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.labelArabic !== undefined && { labelArabic: data.labelArabic }),
      ...(data.severity !== undefined && { severity: data.severity as any }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.mitigationPlan !== undefined && { mitigationPlan: data.mitigationPlan }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteConstraint(id: string) {
  const session = await requirePermission("constraints:write");
  const orgId = session.organizationId;

  const existing = await db.constraintRecord.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Constraint not found. Please refresh and try again.");

  await db.constraintRecord.delete({ where: { id } });
}

export async function getConstraintStats(projectId: string) {
  const session = await requirePermission("constraints:read");
  const orgId = session.organizationId;

  const constraints = await db.constraintRecord.findMany({
    where: { projectId, organizationId: orgId },
  });

  const total = constraints.length;
  const blockers = constraints.filter((c: any) => c.severity === "BLOCKER").length;
  const high = constraints.filter((c: any) => c.severity === "HIGH").length;
  const mitigated = constraints.filter((c: any) => c.status === "MITIGATED").length;
  const unresolved = constraints.filter(
    (c: any) => c.status === "IDENTIFIED" || c.status === "UNDER_REVIEW"
  ).length;

  return { total, blockers, high, mitigated, unresolved };
}
