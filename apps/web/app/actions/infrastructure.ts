"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Infrastructure Readiness ────────────────────────────────────────────────

export async function getInfrastructureItems(projectId: string) {
  const session = await requirePermission("infrastructure:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const items = await db.infrastructureReadiness.findMany({
    where: { projectId },
    orderBy: { category: "asc" },
  });

  return JSON.parse(JSON.stringify(items));
}

export async function createInfrastructureItem(data: {
  projectId: string;
  category: string;
  status?: string;
  readinessScore?: number;
  estimatedCostSar?: number;
  targetDate?: string;
  contractor?: string;
  notes?: string;
  wave?: number;
  checklistItems?: any;
}) {
  const session = await requirePermission("infrastructure:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const item = await db.infrastructureReadiness.create({
    data: {
      projectId: data.projectId,
      category: data.category as any,
      status: (data.status as any) ?? "NOT_STARTED",
      readinessScore: data.readinessScore,
      estimatedCostSar: data.estimatedCostSar,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      contractor: data.contractor,
      notes: data.notes,
      wave: data.wave,
      checklistItems: data.checklistItems,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(item));
}

export async function updateInfrastructureItem(
  id: string,
  data: {
    status?: string;
    readinessScore?: number;
    estimatedCostSar?: number;
    actualCostSar?: number;
    targetDate?: string;
    completedDate?: string;
    contractor?: string;
    notes?: string;
    wave?: number;
    checklistItems?: any;
  }
) {
  const session = await requirePermission("infrastructure:write");
  const orgId = session.organizationId;

  const existing = await db.infrastructureReadiness.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Infrastructure item not found. Please refresh and try again.");

  const updated = await db.infrastructureReadiness.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.readinessScore !== undefined && { readinessScore: data.readinessScore }),
      ...(data.estimatedCostSar !== undefined && { estimatedCostSar: data.estimatedCostSar }),
      ...(data.actualCostSar !== undefined && { actualCostSar: data.actualCostSar }),
      ...(data.targetDate !== undefined && { targetDate: new Date(data.targetDate) }),
      ...(data.completedDate !== undefined && { completedDate: new Date(data.completedDate) }),
      ...(data.contractor !== undefined && { contractor: data.contractor }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.wave !== undefined && { wave: data.wave }),
      ...(data.checklistItems !== undefined && { checklistItems: data.checklistItems }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteInfrastructureItem(id: string) {
  const session = await requirePermission("infrastructure:write");
  const orgId = session.organizationId;

  const existing = await db.infrastructureReadiness.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Infrastructure item not found. Please refresh and try again.");

  await db.infrastructureReadiness.delete({ where: { id } });
}

/**
 * Calculate overall infrastructure readiness score for a project.
 */
export async function getOverallReadinessScore(projectId: string) {
  const session = await requirePermission("infrastructure:read");
  const orgId = session.organizationId;

  const items = await db.infrastructureReadiness.findMany({
    where: { projectId, organizationId: orgId },
  });

  if (items.length === 0) return { overallScore: 0, totalCategories: 0, completed: 0, inProgress: 0, notStarted: 0, delayed: 0, totalEstimatedCost: 0, totalActualCost: 0 };

  const scores = items.map((i) => i.readinessScore ?? 0);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const completed = items.filter((i) => i.status === "COMPLETED_INFRA").length;
  const inProgress = items.filter((i) => ["DESIGN_PHASE", "TENDERING", "IN_PROGRESS_INFRA", "TESTING"].includes(i.status)).length;
  const notStarted = items.filter((i) => i.status === "NOT_STARTED").length;
  const delayed = items.filter((i) => i.status === "DELAYED").length;

  const totalEstimatedCost = items.reduce(
    (sum, i) => sum + (i.estimatedCostSar ? Number(i.estimatedCostSar) : 0), 0
  );
  const totalActualCost = items.reduce(
    (sum, i) => sum + (i.actualCostSar ? Number(i.actualCostSar) : 0), 0
  );

  return {
    overallScore,
    totalCategories: items.length,
    completed,
    inProgress,
    notStarted,
    delayed,
    totalEstimatedCost,
    totalActualCost,
  };
}
