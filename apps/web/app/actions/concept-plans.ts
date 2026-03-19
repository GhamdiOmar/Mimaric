"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getConceptPlans(projectId: string) {
  const session = await requirePermission("concept_plans:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const plans = await db.conceptPlan.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(plans));
}

export async function createConceptPlan(data: {
  projectId: string;
  name: string;
  nameArabic?: string;
  description?: string;
  totalPlots?: number;
  totalGfaSqm?: number;
  farRatio?: number;
  densityUnitsPerHa?: number;
  openSpacePct?: number;
  roadNetworkSummary?: any;
  amenities?: any;
}) {
  const session = await requirePermission("concept_plans:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  // Get the next version number
  const existing = await db.conceptPlan.count({
    where: { projectId: data.projectId },
  });

  const plan = await db.conceptPlan.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      nameArabic: data.nameArabic,
      version: existing + 1,
      description: data.description,
      totalPlots: data.totalPlots,
      totalGfaSqm: data.totalGfaSqm,
      farRatio: data.farRatio,
      densityUnitsPerHa: data.densityUnitsPerHa,
      openSpacePct: data.openSpacePct,
      roadNetworkSummary: data.roadNetworkSummary,
      amenities: data.amenities,
      status: "DRAFT",
      createdBy: session.userId,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(plan));
}

export async function updateConceptPlan(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    description?: string;
    totalPlots?: number;
    totalGfaSqm?: number;
    farRatio?: number;
    densityUnitsPerHa?: number;
    openSpacePct?: number;
    roadNetworkSummary?: any;
    amenities?: any;
    status?: string;
  }
) {
  const session = await requirePermission("concept_plans:write");
  const orgId = session.organizationId;

  const existing = await db.conceptPlan.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Concept plan not found. Please refresh and try again.");

  const updated = await db.conceptPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.totalPlots !== undefined && { totalPlots: data.totalPlots }),
      ...(data.totalGfaSqm !== undefined && { totalGfaSqm: data.totalGfaSqm }),
      ...(data.farRatio !== undefined && { farRatio: data.farRatio }),
      ...(data.densityUnitsPerHa !== undefined && { densityUnitsPerHa: data.densityUnitsPerHa }),
      ...(data.openSpacePct !== undefined && { openSpacePct: data.openSpacePct }),
      ...(data.roadNetworkSummary !== undefined && { roadNetworkSummary: data.roadNetworkSummary }),
      ...(data.amenities !== undefined && { amenities: data.amenities }),
      ...(data.status !== undefined && { status: data.status as any }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteConceptPlan(id: string) {
  const session = await requirePermission("concept_plans:write");
  const orgId = session.organizationId;

  const existing = await db.conceptPlan.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Concept plan not found. Please refresh and try again.");

  await db.conceptPlan.delete({ where: { id } });
}

/**
 * Select a concept plan as the chosen option.
 * Deselects any previously selected plan for the same project.
 */
export async function selectConceptPlan(id: string) {
  const session = await requirePermission("concept_plans:write");
  const orgId = session.organizationId;

  const plan = await db.conceptPlan.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!plan) throw new Error("Concept plan not found. Please refresh and try again.");

  // Deselect all others for this project
  await db.conceptPlan.updateMany({
    where: { projectId: plan.projectId, isSelected: true },
    data: { isSelected: false },
  });

  // Select this one
  const updated = await db.conceptPlan.update({
    where: { id },
    data: { isSelected: true, status: "APPROVED" as any },
  });

  return JSON.parse(JSON.stringify(updated));
}
