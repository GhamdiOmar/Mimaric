"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Subdivision Plan ──────────────────────────────────────────────────────

export async function getSubdivisionPlans(projectId: string) {
  const session = await requirePermission("subdivision:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const plans = await db.subdivisionPlan.findMany({
    where: { projectId },
    include: {
      _count: { select: { plots: true, blocks: true, roads: true, utilityCorridors: true } },
    },
    orderBy: { version: "desc" },
  });

  return JSON.parse(JSON.stringify(plans));
}

export async function getSubdivisionPlanDetail(planId: string) {
  const session = await requirePermission("subdivision:read");
  const orgId = session.organizationId;

  const plan = await db.subdivisionPlan.findFirst({
    where: { id: planId, organizationId: orgId },
    include: {
      plots: { orderBy: { plotNumber: "asc" } },
      blocks: { orderBy: { blockNumber: "asc" } },
      roads: { orderBy: { name: "asc" } },
      utilityCorridors: { orderBy: { name: "asc" } },
    },
  });
  if (!plan) throw new Error("Subdivision plan not found or you don't have access. Please refresh and try again.");

  return JSON.parse(JSON.stringify(plan));
}

export async function createSubdivisionPlan(data: {
  projectId: string;
  name: string;
  nameArabic?: string;
  totalAreaSqm?: number;
  developableAreaSqm?: number;
  numberOfPhases?: number;
  boundaryGeoJson?: any;
}) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  // Get next version number
  const existing = await db.subdivisionPlan.count({
    where: { projectId: data.projectId },
  });

  const plan = await db.subdivisionPlan.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      nameArabic: data.nameArabic,
      version: existing + 1,
      totalAreaSqm: data.totalAreaSqm,
      developableAreaSqm: data.developableAreaSqm,
      numberOfPhases: data.numberOfPhases,
      boundaryGeoJson: data.boundaryGeoJson,
      status: "DRAFT",
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(plan));
}

export async function updateSubdivisionPlan(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    status?: string;
    totalAreaSqm?: number;
    developableAreaSqm?: number;
    numberOfPhases?: number;
    boundaryGeoJson?: any;
  }
) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.subdivisionPlan.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Subdivision plan not found or you don't have access. Please refresh and try again.");

  const updated = await db.subdivisionPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.totalAreaSqm !== undefined && { totalAreaSqm: data.totalAreaSqm }),
      ...(data.developableAreaSqm !== undefined && { developableAreaSqm: data.developableAreaSqm }),
      ...(data.numberOfPhases !== undefined && { numberOfPhases: data.numberOfPhases }),
      ...(data.boundaryGeoJson !== undefined && { boundaryGeoJson: data.boundaryGeoJson }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Create a new version of a subdivision plan (copies structure, supersedes old).
 */
export async function createNewPlanVersion(planId: string) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.subdivisionPlan.findFirst({
    where: { id: planId, organizationId: orgId },
  });
  if (!existing) throw new Error("Subdivision plan not found or you don't have access. Please refresh and try again.");

  // Supersede the old version
  await db.subdivisionPlan.update({
    where: { id: planId },
    data: { status: "SUPERSEDED" as any },
  });

  // Create the new version
  const newPlan = await db.subdivisionPlan.create({
    data: {
      projectId: existing.projectId,
      name: existing.name,
      nameArabic: existing.nameArabic,
      version: existing.version + 1,
      totalAreaSqm: existing.totalAreaSqm,
      developableAreaSqm: existing.developableAreaSqm,
      numberOfPhases: existing.numberOfPhases,
      boundaryGeoJson: existing.boundaryGeoJson as any,
      status: "DRAFT",
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(newPlan));
}

// ─── Blocks ─────────────────────────────────────────────────────────────────

export async function createBlock(data: {
  subdivisionPlanId: string;
  blockNumber: string;
  areaSqm?: number;
  landUse?: string;
  numberOfPlots?: number;
  boundaryGeoJson?: any;
}) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const block = await db.block.create({
    data: {
      subdivisionPlanId: data.subdivisionPlanId,
      blockNumber: data.blockNumber,
      areaSqm: data.areaSqm,
      landUse: data.landUse as any,
      numberOfPlots: data.numberOfPlots,
      boundaryGeoJson: data.boundaryGeoJson,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(block));
}

export async function deleteBlock(id: string) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.block.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new Error("Block not found. Please refresh and try again.");

  await db.block.delete({ where: { id } });
}

// ─── Plots ──────────────────────────────────────────────────────────────────

export async function createPlot(data: {
  subdivisionPlanId: string;
  plotNumber: string;
  blockId?: string;
  areaSqm?: number;
  landUse?: string;
  phase?: number;
  dimensions?: any;
  productType?: string;
  boundaryGeoJson?: any;
}) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const plot = await db.plot.create({
    data: {
      subdivisionPlanId: data.subdivisionPlanId,
      plotNumber: data.plotNumber,
      blockId: data.blockId,
      areaSqm: data.areaSqm,
      landUse: data.landUse as any,
      phase: data.phase,
      dimensions: data.dimensions,
      productType: data.productType,
      boundaryGeoJson: data.boundaryGeoJson,
      status: "PLANNED",
      organizationId: orgId,
    },
  });

  // Update plan counts
  await updatePlanCounts(data.subdivisionPlanId);

  return JSON.parse(JSON.stringify(plot));
}

export async function updatePlot(
  id: string,
  data: {
    plotNumber?: string;
    blockId?: string;
    areaSqm?: number;
    landUse?: string;
    phase?: number;
    dimensions?: any;
    productType?: string;
    status?: string;
    boundaryGeoJson?: any;
  }
) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.plot.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new Error("Plot not found. Please refresh and try again.");

  const updated = await db.plot.update({
    where: { id },
    data: {
      ...(data.plotNumber !== undefined && { plotNumber: data.plotNumber }),
      ...(data.blockId !== undefined && { blockId: data.blockId }),
      ...(data.areaSqm !== undefined && { areaSqm: data.areaSqm }),
      ...(data.landUse !== undefined && { landUse: data.landUse as any }),
      ...(data.phase !== undefined && { phase: data.phase }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
      ...(data.productType !== undefined && { productType: data.productType }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.boundaryGeoJson !== undefined && { boundaryGeoJson: data.boundaryGeoJson }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deletePlot(id: string) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.plot.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new Error("Plot not found. Please refresh and try again.");

  await db.plot.delete({ where: { id } });
  await updatePlanCounts(existing.subdivisionPlanId);
}

// ─── Roads ──────────────────────────────────────────────────────────────────

export async function createRoad(data: {
  subdivisionPlanId: string;
  name?: string;
  type: string;
  widthMeters?: number;
  lengthMeters?: number;
  areaSqm?: number;
  lineGeoJson?: any;
}) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const road = await db.road.create({
    data: {
      subdivisionPlanId: data.subdivisionPlanId,
      name: data.name,
      type: data.type as any,
      widthMeters: data.widthMeters,
      lengthMeters: data.lengthMeters,
      areaSqm: data.areaSqm,
      lineGeoJson: data.lineGeoJson,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(road));
}

export async function deleteRoad(id: string) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.road.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new Error("Road not found. Please refresh and try again.");

  await db.road.delete({ where: { id } });
}

// ─── Utility Corridors ──────────────────────────────────────────────────────

export async function createUtilityCorridor(data: {
  subdivisionPlanId: string;
  name?: string;
  utilityType: string;
  widthMeters?: number;
  lengthMeters?: number;
  lineGeoJson?: any;
}) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const corridor = await db.utilityCorridor.create({
    data: {
      subdivisionPlanId: data.subdivisionPlanId,
      name: data.name,
      utilityType: data.utilityType as any,
      widthMeters: data.widthMeters,
      lengthMeters: data.lengthMeters,
      lineGeoJson: data.lineGeoJson,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(corridor));
}

export async function deleteUtilityCorridor(id: string) {
  const session = await requirePermission("subdivision:write");
  const orgId = session.organizationId;

  const existing = await db.utilityCorridor.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new Error("Utility corridor not found. Please refresh and try again.");

  await db.utilityCorridor.delete({ where: { id } });
}

// ─── Summary helpers ────────────────────────────────────────────────────────

export async function getSubdivisionSummary(planId: string) {
  const session = await requirePermission("subdivision:read");
  const orgId = session.organizationId;

  const plan = await db.subdivisionPlan.findFirst({
    where: { id: planId, organizationId: orgId },
    include: {
      plots: true,
      blocks: true,
      roads: true,
      utilityCorridors: true,
    },
  });
  if (!plan) throw new Error("Subdivision plan not found or you don't have access. Please refresh and try again.");

  const plots = plan.plots;
  const totalPlotArea = plots.reduce((sum, p) => sum + (p.areaSqm ?? 0), 0);
  const totalRoadArea = plan.roads.reduce((sum, r) => sum + (r.areaSqm ?? 0), 0);
  const plotsByPhase: Record<number, number> = {};
  for (const p of plots) {
    const phase = p.phase ?? 1;
    plotsByPhase[phase] = (plotsByPhase[phase] ?? 0) + 1;
  }
  const plotsByStatus: Record<string, number> = {};
  for (const p of plots) {
    plotsByStatus[p.status] = (plotsByStatus[p.status] ?? 0) + 1;
  }

  return {
    plotCount: plots.length,
    blockCount: plan.blocks.length,
    roadCount: plan.roads.length,
    corridorCount: plan.utilityCorridors.length,
    totalPlotArea,
    totalRoadArea,
    plotsByPhase,
    plotsByStatus,
    developableAreaSqm: plan.developableAreaSqm,
    totalAreaSqm: plan.totalAreaSqm,
  };
}

/** Recalculate plot and block counts on the plan. */
async function updatePlanCounts(planId: string) {
  const plotCount = await db.plot.count({ where: { subdivisionPlanId: planId } });
  const blockCount = await db.block.count({ where: { subdivisionPlanId: planId } });

  await db.subdivisionPlan.update({
    where: { id: planId },
    data: { plotCount, blockCount },
  });
}
