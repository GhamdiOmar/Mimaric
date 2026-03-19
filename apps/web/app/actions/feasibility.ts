"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getFeasibilityAssessments(projectId: string) {
  const session = await requirePermission("feasibility:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const assessments = await db.feasibilityAssessment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(assessments));
}

export async function createFeasibilityAssessment(data: {
  projectId: string;
  type: string;
  score?: number;
  recommendation?: string;
  findings?: any;
  notes?: string;
  attachmentIds?: string[];
}) {
  const session = await requirePermission("feasibility:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const assessment = await db.feasibilityAssessment.create({
    data: {
      projectId: data.projectId,
      type: data.type as any,
      score: data.score,
      recommendation: data.recommendation,
      assessedBy: session.userId,
      assessedAt: new Date(),
      findings: data.findings,
      notes: data.notes,
      attachmentIds: data.attachmentIds ?? [],
      organizationId: orgId,
    },
  });

  // Recalculate suitability score
  await recalculateSuitabilityScore(data.projectId);

  return JSON.parse(JSON.stringify(assessment));
}

export async function updateFeasibilityAssessment(
  id: string,
  data: {
    score?: number;
    recommendation?: string;
    findings?: any;
    notes?: string;
    attachmentIds?: string[];
  }
) {
  const session = await requirePermission("feasibility:write");
  const orgId = session.organizationId;

  const existing = await db.feasibilityAssessment.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Feasibility assessment not found. Please refresh and try again.");

  const updated = await db.feasibilityAssessment.update({
    where: { id },
    data: {
      ...(data.score !== undefined && { score: data.score }),
      ...(data.recommendation !== undefined && { recommendation: data.recommendation }),
      ...(data.findings !== undefined && { findings: data.findings }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.attachmentIds !== undefined && { attachmentIds: data.attachmentIds }),
      assessedBy: session.userId,
      assessedAt: new Date(),
    },
  });

  // Recalculate suitability score
  await recalculateSuitabilityScore(existing.projectId);

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteFeasibilityAssessment(id: string) {
  const session = await requirePermission("feasibility:write");
  const orgId = session.organizationId;

  const existing = await db.feasibilityAssessment.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Feasibility assessment not found. Please refresh and try again.");

  await db.feasibilityAssessment.delete({ where: { id } });

  // Recalculate suitability score
  await recalculateSuitabilityScore(existing.projectId);
}

/**
 * Recalculate weighted suitability score from all assessments.
 * Weights: LEGAL=25%, COMMERCIAL=25%, TECHNICAL=20%, ENVIRONMENTAL=15%, FINANCIAL=15%
 */
async function recalculateSuitabilityScore(projectId: string) {
  const assessments = await db.feasibilityAssessment.findMany({
    where: { projectId, score: { not: null } },
  });

  if (assessments.length === 0) {
    await db.project.update({
      where: { id: projectId },
      data: { suitabilityScore: null },
    });
    return;
  }

  const weights: Record<string, number> = {
    LEGAL: 0.25,
    COMMERCIAL: 0.25,
    TECHNICAL: 0.2,
    ENVIRONMENTAL_FEASIBILITY: 0.15,
    FINANCIAL: 0.15,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const a of assessments) {
    if (a.score !== null) {
      const w = weights[a.type] ?? 0.2;
      weightedSum += a.score * w;
      totalWeight += w;
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

  await db.project.update({
    where: { id: projectId },
    data: { suitabilityScore: score },
  });
}

export async function getSuitabilityScore(projectId: string) {
  const session = await requirePermission("feasibility:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { suitabilityScore: true },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  return project.suitabilityScore;
}
