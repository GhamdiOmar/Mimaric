"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// Helper to extract siteMetadata fields
function parseSiteMetadata(meta: any): { totalAreaSqm: number; location: string } {
  const m = (meta ?? {}) as Record<string, any>;
  const parts = [m.district, m.city, m.region].filter(Boolean);
  return {
    totalAreaSqm: Number(m.totalAreaSqm ?? 0),
    location: parts.join("، ") || "",
  };
}

// ─── Parcel Schedule Export ──────────────────────────────────────────────────

/**
 * Get parcel schedule data for a scenario (export-ready).
 */
export async function getParcelSchedule(scenarioId: string) {
  const session = await requirePermission("planning:export");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, workspace: { organizationId: orgId } },
    include: {
      workspace: { select: { name: true, siteMetadata: true } },
      subdivisionPlan: {
        include: {
          blocks: {
            include: {
              plots: {
                orderBy: { plotNumber: "asc" },
              },
            },
            orderBy: { blockNumber: "asc" },
          },
          roads: true,
        },
      },
      feasibilitySet: true,
    },
  });

  if (!scenario) throw new Error("Scenario not found");

  const siteMeta = parseSiteMetadata(scenario.workspace.siteMetadata);

  const plots: {
    blockNumber: string;
    plotNumber: string;
    landUse: string;
    areaSqm: number;
    frontageM: number | null;
    depthM: number | null;
    estimatedPrice: number | null;
    pricePerSqm: number | null;
  }[] = [];

  // Extract pricing from assumptions JSON
  const pricingAssumptions = (scenario.feasibilitySet?.pricingAssumptions ?? {}) as Record<string, any>;
  const defaultPrice = pricingAssumptions?.RESIDENTIAL?.pricePerSqm ?? 0;

  let totalSellable = 0;
  let totalRoadArea = 0;

  for (const block of scenario.subdivisionPlan?.blocks ?? []) {
    for (const plot of block.plots) {
      const area = Number(plot.areaSqm ?? 0);
      totalSellable += area;

      const landUse = (plot.landUse ?? "RESIDENTIAL").toString();
      const dims = (plot.dimensions ?? {}) as Record<string, any>;
      const luPrice = pricingAssumptions?.[landUse]?.pricePerSqm ?? defaultPrice;
      const estPrice = luPrice > 0 ? area * luPrice : null;

      plots.push({
        blockNumber: block.blockNumber ?? `B${block.id.slice(0, 4)}`,
        plotNumber: plot.plotNumber ?? `P${plot.id.slice(0, 4)}`,
        landUse,
        areaSqm: area,
        frontageM: dims.frontage ? Number(dims.frontage) : null,
        depthM: dims.depth ? Number(dims.depth) : null,
        estimatedPrice: estPrice ? Math.round(estPrice) : null,
        pricePerSqm: estPrice && area > 0 ? Math.round(estPrice / area) : null,
      });
    }
  }

  for (const road of scenario.subdivisionPlan?.roads ?? []) {
    totalRoadArea += Number(road.lengthMeters ?? 0) * Number(road.widthMeters ?? 0);
  }

  const siteArea = siteMeta.totalAreaSqm || (totalSellable + totalRoadArea);
  const totalOpenSpace = Math.max(0, siteArea - totalSellable - totalRoadArea);

  return {
    workspace: {
      name: scenario.workspace.name,
      location: siteMeta.location,
      totalAreaSqm: siteArea,
    },
    scenario: {
      name: scenario.name,
      version: scenario.version,
      status: scenario.status,
    },
    summary: {
      totalPlots: plots.length,
      totalSellableArea: Math.round(totalSellable),
      totalRoadArea: Math.round(totalRoadArea),
      totalOpenSpace: Math.round(totalOpenSpace),
      sellablePercent: siteArea > 0 ? Math.round((totalSellable / siteArea) * 100) : 0,
      roadPercent: siteArea > 0 ? Math.round((totalRoadArea / siteArea) * 100) : 0,
      openSpacePercent: siteArea > 0 ? Math.round((totalOpenSpace / siteArea) * 100) : 0,
    },
    plots,
    landUseBreakdown: aggregateLandUse(plots),
  };
}

function aggregateLandUse(plots: { landUse: string; areaSqm: number }[]) {
  const map: Record<string, { count: number; totalArea: number }> = {};
  for (const p of plots) {
    if (!map[p.landUse]) map[p.landUse] = { count: 0, totalArea: 0 };
    map[p.landUse]!.count++;
    map[p.landUse]!.totalArea += p.areaSqm;
  }
  return Object.entries(map).map(([landUse, data]) => ({
    landUse,
    count: data.count,
    totalArea: Math.round(data.totalArea),
  }));
}

// ─── Scenario Comparison Export ─────────────────────────────────────────────

/**
 * Get comparison data for multiple scenarios (export-ready).
 */
export async function getScenarioComparisonExport(workspaceId: string) {
  const session = await requirePermission("planning:export");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id: workspaceId, organizationId: orgId },
    include: {
      scenarios: {
        include: {
          subdivisionPlan: {
            include: {
              blocks: { include: { plots: true } },
              roads: true,
            },
          },
          feasibilitySet: true,
        },
        orderBy: { version: "asc" },
      },
    },
  });

  if (!workspace) throw new Error("Workspace not found");

  const siteMeta = parseSiteMetadata(workspace.siteMetadata);

  const rows = workspace.scenarios.map((s) => {
    const plots = s.subdivisionPlan?.blocks.flatMap((b) => b.plots) ?? [];
    const roads = s.subdivisionPlan?.roads ?? [];
    const totalPlotArea = plots.reduce((sum: number, p) => sum + Number(p.areaSqm ?? 0), 0);
    const totalRoadArea = roads.reduce((sum: number, r) => sum + Number(r.lengthMeters ?? 0) * Number(r.widthMeters ?? 0), 0);
    const siteArea = siteMeta.totalAreaSqm || (totalPlotArea + totalRoadArea);
    const openSpace = Math.max(0, siteArea - totalPlotArea - totalRoadArea);

    const metrics = s.metrics as Record<string, any> | null;
    const feasCalc = (s.feasibilitySet?.calculatedMetrics ?? {}) as Record<string, any>;

    return {
      name: s.name,
      version: s.version,
      status: s.status,
      isBaseline: s.isBaseline,
      totalPlots: plots.length,
      totalBlocks: s.subdivisionPlan?.blocks.length ?? 0,
      sellableAreaSqm: Math.round(totalPlotArea),
      roadAreaSqm: Math.round(totalRoadArea),
      openSpaceSqm: Math.round(openSpace),
      sellablePercent: siteArea > 0 ? Math.round((totalPlotArea / siteArea) * 100) : 0,
      estimatedRevenue: metrics?.totalRevenue ?? feasCalc.totalRevenue ?? null,
      estimatedCost: metrics?.totalCost ?? feasCalc.totalCost ?? null,
      estimatedProfit: metrics?.netProfit ?? feasCalc.netProfit ?? null,
      roi: metrics?.roi ?? feasCalc.roi ?? null,
    };
  });

  return {
    workspace: {
      name: workspace.name,
      location: siteMeta.location,
      totalAreaSqm: siteMeta.totalAreaSqm,
    },
    scenarios: rows,
  };
}

// ─── Feasibility Export ─────────────────────────────────────────────────────

/**
 * Get feasibility analysis data for a scenario (export-ready).
 */
export async function getFeasibilityExport(scenarioId: string) {
  const session = await requirePermission("planning:export");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, workspace: { organizationId: orgId } },
    include: {
      workspace: { select: { name: true, siteMetadata: true } },
      feasibilitySet: true,
      subdivisionPlan: {
        include: {
          blocks: { include: { plots: true } },
        },
      },
    },
  });

  if (!scenario) throw new Error("Scenario not found");

  const siteMeta = parseSiteMetadata(scenario.workspace.siteMetadata);
  const f = scenario.feasibilitySet;
  const calcMetrics = (f?.calculatedMetrics ?? {}) as Record<string, any>;
  const pricingA = (f?.pricingAssumptions ?? {}) as Record<string, any>;
  const costA = (f?.costAssumptions ?? {}) as Record<string, any>;
  const plots = scenario.subdivisionPlan?.blocks.flatMap((b) => b.plots) ?? [];
  const totalPlotArea = plots.reduce((sum, p) => sum + Number(p.areaSqm ?? 0), 0);

  const landUseMap: Record<string, number> = {};
  for (const p of plots) {
    const lu = (p.landUse ?? "RESIDENTIAL").toString();
    landUseMap[lu] = (landUseMap[lu] ?? 0) + Number(p.areaSqm ?? 0);
  }

  return {
    workspace: {
      name: scenario.workspace.name,
      location: siteMeta.location,
      totalAreaSqm: siteMeta.totalAreaSqm,
    },
    scenario: {
      name: scenario.name,
      version: scenario.version,
      status: scenario.status,
    },
    assumptions: f ? {
      landPriceSarPerSqm: Number(f.landPriceSarPerSqm ?? 0),
      constructionCostPerSqm: Number(f.constructionCostPerSqm ?? 0),
      infrastructureCostTotal: Number(f.infrastructureCostTotal ?? 0),
      contingencyPct: Number(f.contingencyPct ?? 10),
      profitMarginPct: Number(f.profitMarginPct ?? 15),
      pricingByLandUse: pricingA,
      additionalCosts: costA,
    } : null,
    results: {
      totalSellableArea: Math.round(totalPlotArea),
      totalRevenue: calcMetrics.totalRevenue ?? 0,
      totalCost: calcMetrics.totalCost ?? 0,
      grossProfit: calcMetrics.grossProfit ?? 0,
      netProfit: calcMetrics.netProfit ?? 0,
      roi: calcMetrics.roi ?? 0,
      pricePerSqmSellable: calcMetrics.pricePerSqmSellable ?? 0,
      costPerSqmSellable: calcMetrics.costPerSqmSellable ?? 0,
    },
    landUseBreakdown: Object.entries(landUseMap).map(([use, area]) => ({
      landUse: use,
      areaSqm: Math.round(area),
      revenueEstimate: calcMetrics.revenueByLandUse?.[use] ?? 0,
    })),
  };
}

// ─── Compliance Report Export ───────────────────────────────────────────────

/**
 * Get compliance check results for a scenario (export-ready).
 */
export async function getComplianceExport(scenarioId: string) {
  const session = await requirePermission("planning:export");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, workspace: { organizationId: orgId } },
    include: { workspace: { select: { name: true } } },
  });

  if (!scenario) throw new Error("Scenario not found");

  const results = await db.complianceResult.findMany({
    where: { scenarioId },
    include: { rule: true },
    orderBy: [{ status: "asc" }, { featureType: "asc" }],
  });

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warnings = results.filter((r) => r.status === "WARNING").length;

  return {
    workspace: scenario.workspace.name,
    scenario: { name: scenario.name, version: scenario.version },
    summary: {
      totalChecks: results.length,
      passed,
      failed,
      warnings,
      complianceScore: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
    },
    results: results.map((r) => ({
      ruleName: r.rule.name,
      ruleCategory: r.rule.category,
      status: r.status,
      featureType: r.featureType,
      featureLabel: r.featureLabel,
      actualValue: Number(r.actualValue),
      expectedValue: r.expectedValue,
    })),
  };
}

// ─── Planning Dashboard Stats (for main dashboard integration) ──────────────

/**
 * Get planning stats for the main dashboard.
 */
export async function getDashboardPlanningStats() {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const [
    totalWorkspaces,
    activeWorkspaces,
    totalScenarios,
    approvedBaselines,
    statusDist,
  ] = await Promise.all([
    db.planningWorkspace.count({ where: { organizationId: orgId } }),
    db.planningWorkspace.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
    db.planningScenario.count({
      where: { workspace: { organizationId: orgId } },
    }),
    db.planningScenario.count({
      where: {
        workspace: { organizationId: orgId },
        isBaseline: true,
        status: "APPROVED",
      },
    }),
    db.planningWorkspace.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
  ]);

  const statusDistribution: Record<string, number> = {};
  for (const s of statusDist) {
    statusDistribution[s.status] = s._count.id;
  }

  // Get recent scenarios for compliance scoring
  const recentScenarios = await db.planningScenario.findMany({
    where: { workspace: { organizationId: orgId } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      metrics: true,
    },
  });

  let avgComplianceScore = 0;
  let complianceCount = 0;
  for (const s of recentScenarios) {
    const metrics = s.metrics as Record<string, any> | null;
    if (metrics?.complianceScore != null) {
      avgComplianceScore += metrics.complianceScore;
      complianceCount++;
    }
  }
  if (complianceCount > 0) avgComplianceScore = Math.round(avgComplianceScore / complianceCount);

  return {
    totalWorkspaces,
    activeWorkspaces,
    totalScenarios,
    approvedBaselines,
    avgComplianceScore,
    statusDistribution,
  };
}
