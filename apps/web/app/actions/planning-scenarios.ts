"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { createNotification, notifyAdmins } from "../../lib/create-notification";

// ─── Planning Scenario CRUD ─────────────────────────────────────────────────

export async function createPlanningScenario(data: {
  workspaceId: string;
  name: string;
  nameArabic?: string;
}) {
  const session = await requirePermission("planning:scenarios");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id: data.workspaceId, organizationId: orgId },
    include: { _count: { select: { scenarios: true } } },
  });
  if (!workspace) throw new Error("Planning workspace not found");

  // Auto-increment version
  const version = workspace._count.scenarios + 1;

  // Create subdivision plan for geometry storage
  const subdivisionPlan = await db.subdivisionPlan.create({
    data: {
      projectId: workspace.projectId || workspace.landRecordId || "",
      name: `${data.name} - Subdivision`,
      nameArabic: data.nameArabic ? `${data.nameArabic} - تقسيم` : undefined,
      version,
      status: "DRAFT",
      totalAreaSqm: (workspace.siteMetadata as any)?.totalAreaSqm,
      organizationId: orgId,
    },
  });

  const scenario = await db.planningScenario.create({
    data: {
      name: data.name,
      nameArabic: data.nameArabic,
      version,
      workspaceId: data.workspaceId,
      subdivisionPlanId: subdivisionPlan.id,
      status: "DRAFT",
      organizationId: orgId,
    },
  });

  // Update workspace status to ACTIVE if still DRAFT
  if (workspace.status === "DRAFT") {
    await db.planningWorkspace.update({
      where: { id: data.workspaceId },
      data: { status: "ACTIVE" },
    });
  }

  return JSON.parse(JSON.stringify(scenario));
}

export async function duplicateScenario(scenarioId: string, newName: string, newNameArabic?: string) {
  const session = await requirePermission("planning:scenarios");
  const orgId = session.organizationId;

  const source = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
    include: {
      subdivisionPlan: {
        include: {
          plots: true,
          blocks: true,
          roads: true,
          utilityCorridors: true,
        },
      },
      feasibilitySet: true,
      workspace: { include: { _count: { select: { scenarios: true } } } },
    },
  });
  if (!source) throw new Error("Scenario not found");

  const nextVersion = source.workspace._count.scenarios + 1;

  // Duplicate subdivision plan
  let newSubPlanId: string | undefined;
  if (source.subdivisionPlan) {
    const sp = source.subdivisionPlan;
    const newSubPlan = await db.subdivisionPlan.create({
      data: {
        projectId: sp.projectId,
        name: `${newName} - Subdivision`,
        nameArabic: newNameArabic ? `${newNameArabic} - تقسيم` : sp.nameArabic,
        version: nextVersion,
        status: "DRAFT",
        totalAreaSqm: sp.totalAreaSqm,
        developableAreaSqm: sp.developableAreaSqm,
        numberOfPhases: sp.numberOfPhases,
        boundaryGeoJson: sp.boundaryGeoJson as any,
        metadata: sp.metadata as any,
        organizationId: orgId,
      },
    });
    newSubPlanId = newSubPlan.id;

    // Duplicate blocks
    const blockIdMap: Record<string, string> = {};
    for (const block of sp.blocks) {
      const newBlock = await db.block.create({
        data: {
          subdivisionPlanId: newSubPlan.id,
          blockNumber: block.blockNumber,
          areaSqm: block.areaSqm,
          landUse: block.landUse,
          numberOfPlots: block.numberOfPlots,
          boundaryGeoJson: block.boundaryGeoJson as any,
          organizationId: orgId,
        },
      });
      blockIdMap[block.id] = newBlock.id;
    }

    // Duplicate plots
    for (const plot of sp.plots) {
      await db.plot.create({
        data: {
          subdivisionPlanId: newSubPlan.id,
          plotNumber: plot.plotNumber,
          blockId: plot.blockId ? blockIdMap[plot.blockId] : null,
          areaSqm: plot.areaSqm,
          landUse: plot.landUse,
          phase: plot.phase,
          dimensions: plot.dimensions as any,
          productType: plot.productType,
          boundaryGeoJson: plot.boundaryGeoJson as any,
          status: "PLANNED",
          organizationId: orgId,
        },
      });
    }

    // Duplicate roads
    for (const road of sp.roads) {
      await db.road.create({
        data: {
          subdivisionPlanId: newSubPlan.id,
          name: road.name,
          type: road.type,
          widthMeters: road.widthMeters,
          lengthMeters: road.lengthMeters,
          areaSqm: road.areaSqm,
          lineGeoJson: road.lineGeoJson as any,
          organizationId: orgId,
        },
      });
    }

    // Duplicate utility corridors
    for (const uc of sp.utilityCorridors) {
      await db.utilityCorridor.create({
        data: {
          subdivisionPlanId: newSubPlan.id,
          name: uc.name,
          utilityType: uc.utilityType,
          widthMeters: uc.widthMeters,
          lengthMeters: uc.lengthMeters,
          lineGeoJson: uc.lineGeoJson as any,
          organizationId: orgId,
        },
      });
    }

    // Update counts
    const plotCount = sp.plots.length;
    const blockCount = sp.blocks.length;
    await db.subdivisionPlan.update({
      where: { id: newSubPlan.id },
      data: { plotCount, blockCount },
    });
  }

  // Create new scenario
  const newScenario = await db.planningScenario.create({
    data: {
      name: newName,
      nameArabic: newNameArabic,
      version: nextVersion,
      workspaceId: source.workspaceId,
      subdivisionPlanId: newSubPlanId,
      status: "DRAFT",
      metrics: source.metrics as any,
      organizationId: orgId,
    },
  });

  // Duplicate feasibility assumptions
  if (source.feasibilitySet) {
    const fs = source.feasibilitySet;
    await db.feasibilityAssumptionSet.create({
      data: {
        name: `${newName} - Feasibility`,
        nameArabic: newNameArabic ? `${newNameArabic} - دراسة الجدوى` : undefined,
        scenarioId: newScenario.id,
        landPriceSarPerSqm: fs.landPriceSarPerSqm,
        constructionCostPerSqm: fs.constructionCostPerSqm,
        infrastructureCostTotal: fs.infrastructureCostTotal,
        contingencyPct: fs.contingencyPct,
        profitMarginPct: fs.profitMarginPct,
        pricingAssumptions: fs.pricingAssumptions as any,
        costAssumptions: fs.costAssumptions as any,
        calculatedMetrics: fs.calculatedMetrics as any,
        organizationId: orgId,
      },
    });
  }

  return JSON.parse(JSON.stringify(newScenario));
}

export async function updateScenarioStatus(
  scenarioId: string,
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  notes?: string
) {
  const session = await requirePermission(
    status === "APPROVED" || status === "REJECTED" ? "planning:approve" : "planning:scenarios"
  );
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
    include: { workspace: true },
  });
  if (!scenario) throw new Error("Scenario not found");

  // G12: Compliance gate — block approval if compliance failures exist
  if (status === "APPROVED") {
    const failedResults = await db.complianceResult.count({
      where: { scenarioId, status: "FAIL" },
    });
    if (failedResults > 0) {
      throw new Error(
        `Cannot approve scenario with ${failedResults} compliance failure(s). ` +
        `Run compliance check and resolve all issues first.`
      );
    }
  }

  const updateData: any = {
    status,
    reviewNotes: notes,
  };

  if (status === "APPROVED") {
    updateData.approvedBy = session.userId;
    updateData.approvedAt = new Date();
  } else if (status === "REJECTED") {
    updateData.rejectedBy = session.userId;
    updateData.rejectedAt = new Date();
  }

  const updated = await db.planningScenario.update({
    where: { id: scenarioId },
    data: updateData,
  });

  // Send notifications
  const notifType = status === "APPROVED"
    ? "PLANNING_SCENARIO_APPROVED"
    : status === "REJECTED"
      ? "PLANNING_SCENARIO_REJECTED"
      : "PLANNING_REVIEW_REQUESTED";

  await notifyAdmins({
    type: notifType,
    title: status === "APPROVED"
      ? `تمت الموافقة على السيناريو: ${scenario.name}`
      : status === "REJECTED"
        ? `تم رفض السيناريو: ${scenario.name}`
        : `طلب مراجعة السيناريو: ${scenario.name}`,
    titleEn: status === "APPROVED"
      ? `Scenario approved: ${scenario.name}`
      : status === "REJECTED"
        ? `Scenario rejected: ${scenario.name}`
        : `Scenario review requested: ${scenario.name}`,
    message: `${session.name || session.email} - ${scenario.workspace.name}`,
    messageEn: `${session.name || session.email} - ${scenario.workspace.name}`,
    link: `/dashboard/planning/${scenario.workspaceId}`,
    organizationId: orgId,
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function setScenarioAsBaseline(scenarioId: string) {
  const session = await requirePermission("planning:approve");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
  });
  if (!scenario) throw new Error("Scenario not found");

  // Clear existing baseline in workspace
  await db.planningScenario.updateMany({
    where: { workspaceId: scenario.workspaceId, isBaseline: true },
    data: { isBaseline: false },
  });

  // Set this one as baseline
  const updated = await db.planningScenario.update({
    where: { id: scenarioId },
    data: { isBaseline: true, status: "APPROVED", approvedBy: session.userId, approvedAt: new Date() },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteScenario(scenarioId: string) {
  const session = await requirePermission("planning:delete");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
  });
  if (!scenario) throw new Error("Scenario not found");

  // Delete linked subdivision plan if exists
  if (scenario.subdivisionPlanId) {
    await db.subdivisionPlan.delete({ where: { id: scenario.subdivisionPlanId } });
  }

  await db.planningScenario.delete({ where: { id: scenarioId } });
}

// ─── Scenario Metrics Calculation ───────────────────────────────────────────

export async function recalculateScenarioMetrics(scenarioId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
    include: {
      subdivisionPlan: {
        include: {
          plots: true,
          blocks: true,
          roads: true,
          utilityCorridors: true,
        },
      },
      feasibilitySet: true,
    },
  });
  if (!scenario) throw new Error("Scenario not found");

  const sp = scenario.subdivisionPlan;
  if (!sp) return null;

  const totalArea = sp.totalAreaSqm ?? 0;
  const plotArea = sp.plots.reduce((sum, p) => sum + (p.areaSqm ?? 0), 0);
  const roadArea = sp.roads.reduce((sum, r) => sum + (r.areaSqm ?? 0), 0);
  const corridorArea = sp.utilityCorridors.reduce((sum, c) => sum + ((c.widthMeters ?? 0) * (c.lengthMeters ?? 0)), 0);
  const nonSellableArea = roadArea + corridorArea;
  const sellableArea = totalArea > 0 ? totalArea - nonSellableArea : plotArea;
  const sellablePct = totalArea > 0 ? (sellableArea / totalArea) * 100 : 0;

  // Plot counts by type
  const plotsByType: Record<string, number> = {};
  const plotsByLandUse: Record<string, { count: number; area: number }> = {};
  for (const p of sp.plots) {
    const pt = p.productType || "UNSPECIFIED";
    plotsByType[pt] = (plotsByType[pt] ?? 0) + 1;
    const lu = p.landUse || "RESIDENTIAL";
    if (!plotsByLandUse[lu]) plotsByLandUse[lu] = { count: 0, area: 0 };
    plotsByLandUse[lu].count += 1;
    plotsByLandUse[lu].area += p.areaSqm ?? 0;
  }

  // Feasibility calcs
  let estimatedRevenue = 0;
  let estimatedCost = 0;
  if (scenario.feasibilitySet) {
    const fs = scenario.feasibilitySet;
    const pricing = (fs.pricingAssumptions as any) || {};

    // Revenue per land use
    for (const [lu, data] of Object.entries(plotsByLandUse)) {
      const pricePerSqm = pricing[lu]?.pricePerSqm || fs.landPriceSarPerSqm || 0;
      estimatedRevenue += (data as any).area * (pricePerSqm as number);
    }

    // Cost estimates
    estimatedCost = (
      (sellableArea * (fs.constructionCostPerSqm ?? 0)) +
      (fs.infrastructureCostTotal ?? 0)
    );
    const contingency = estimatedCost * ((fs.contingencyPct ?? 10) / 100);
    estimatedCost += contingency;
  }

  const metrics = {
    totalArea,
    sellableArea,
    nonSellableArea,
    sellablePct: Math.round(sellablePct * 10) / 10,
    plotCount: sp.plots.length,
    blockCount: sp.blocks.length,
    roadCount: sp.roads.length,
    roadArea,
    corridorArea,
    plotsByType,
    plotsByLandUse,
    estimatedRevenue: Math.round(estimatedRevenue),
    estimatedCost: Math.round(estimatedCost),
    estimatedProfit: Math.round(estimatedRevenue - estimatedCost),
  };

  await db.planningScenario.update({
    where: { id: scenarioId },
    data: { metrics },
  });

  return metrics;
}

// ─── Scenario Comparison ────────────────────────────────────────────────────

export async function compareScenarios(scenarioIds: string[]) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const scenarios = await db.planningScenario.findMany({
    where: { id: { in: scenarioIds }, organizationId: orgId },
    include: {
      subdivisionPlan: {
        include: {
          _count: { select: { plots: true, blocks: true, roads: true } },
        },
      },
      feasibilitySet: true,
      _count: { select: { complianceResults: true } },
    },
    orderBy: { version: "asc" },
  });

  return JSON.parse(JSON.stringify(scenarios));
}
