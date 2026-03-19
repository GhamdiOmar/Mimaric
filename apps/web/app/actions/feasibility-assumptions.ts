"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Feasibility Assumption Set CRUD ────────────────────────────────────────

export async function getFeasibilityAssumptionSet(scenarioId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const set = await db.feasibilityAssumptionSet.findFirst({
    where: { scenarioId, organizationId: orgId },
  });

  return set ? JSON.parse(JSON.stringify(set)) : null;
}

export async function upsertFeasibilityAssumptions(
  scenarioId: string,
  data: {
    landPriceSarPerSqm?: number;
    constructionCostPerSqm?: number;
    infrastructureCostTotal?: number;
    contingencyPct?: number;
    profitMarginPct?: number;
    pricingAssumptions?: any;
    costAssumptions?: any;
  }
) {
  const session = await requirePermission("planning:feasibility");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
    include: {
      subdivisionPlan: {
        include: { plots: true, roads: true, utilityCorridors: true },
      },
    },
  });
  if (!scenario) throw new Error("Planning scenario not found. Please refresh and try again.");

  // Calculate metrics from geometry + assumptions
  const calculatedMetrics = calculateFeasibility(scenario.subdivisionPlan, data);

  const existing = await db.feasibilityAssumptionSet.findFirst({
    where: { scenarioId },
  });

  let result;
  if (existing) {
    result = await db.feasibilityAssumptionSet.update({
      where: { id: existing.id },
      data: {
        ...(data.landPriceSarPerSqm !== undefined && { landPriceSarPerSqm: data.landPriceSarPerSqm }),
        ...(data.constructionCostPerSqm !== undefined && { constructionCostPerSqm: data.constructionCostPerSqm }),
        ...(data.infrastructureCostTotal !== undefined && { infrastructureCostTotal: data.infrastructureCostTotal }),
        ...(data.contingencyPct !== undefined && { contingencyPct: data.contingencyPct }),
        ...(data.profitMarginPct !== undefined && { profitMarginPct: data.profitMarginPct }),
        ...(data.pricingAssumptions !== undefined && { pricingAssumptions: data.pricingAssumptions }),
        ...(data.costAssumptions !== undefined && { costAssumptions: data.costAssumptions }),
        calculatedMetrics,
      },
    });
  } else {
    result = await db.feasibilityAssumptionSet.create({
      data: {
        name: "Feasibility Assumptions",
        nameArabic: "افتراضات دراسة الجدوى",
        scenarioId,
        landPriceSarPerSqm: data.landPriceSarPerSqm,
        constructionCostPerSqm: data.constructionCostPerSqm,
        infrastructureCostTotal: data.infrastructureCostTotal,
        contingencyPct: data.contingencyPct ?? 10,
        profitMarginPct: data.profitMarginPct ?? 15,
        pricingAssumptions: data.pricingAssumptions,
        costAssumptions: data.costAssumptions,
        calculatedMetrics,
        organizationId: orgId,
      },
    });
  }

  // Update scenario cached metrics
  await db.planningScenario.update({
    where: { id: scenarioId },
    data: {
      metrics: {
        ...(scenario.metrics as any || {}),
        ...calculatedMetrics,
      },
    },
  });

  return JSON.parse(JSON.stringify(result));
}

// ─── Calculation Engine ─────────────────────────────────────────────────────

function calculateFeasibility(subdivisionPlan: any, assumptions: any) {
  if (!subdivisionPlan) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      netProfit: 0,
      roi: 0,
      sellableArea: 0,
      nonSellableArea: 0,
      sellablePct: 0,
    };
  }

  const sp = subdivisionPlan;
  const totalArea = sp.totalAreaSqm ?? 0;
  const plots = sp.plots ?? [];
  const roads = sp.roads ?? [];
  const corridors = sp.utilityCorridors ?? [];

  // Area calculations
  const plotArea = plots.reduce((sum: number, p: any) => sum + (p.areaSqm ?? 0), 0);
  const roadArea = roads.reduce((sum: number, r: any) => sum + (r.areaSqm ?? 0), 0);
  const corridorArea = corridors.reduce((sum: number, c: any) => sum + ((c.widthMeters ?? 0) * (c.lengthMeters ?? 0)), 0);
  const nonSellableArea = roadArea + corridorArea;
  const sellableArea = totalArea > 0 ? totalArea - nonSellableArea : plotArea;
  const sellablePct = totalArea > 0 ? (sellableArea / totalArea) * 100 : 0;

  // Revenue calculation
  const pricing = assumptions.pricingAssumptions || {};
  const defaultPrice = assumptions.landPriceSarPerSqm || 0;

  let totalRevenue = 0;
  const revenueByLandUse: Record<string, number> = {};

  for (const plot of plots) {
    const lu = plot.landUse || "RESIDENTIAL";
    const pricePerSqm = pricing[lu]?.pricePerSqm || defaultPrice;
    const plotRevenue = (plot.areaSqm ?? 0) * pricePerSqm;
    totalRevenue += plotRevenue;
    revenueByLandUse[lu] = (revenueByLandUse[lu] ?? 0) + plotRevenue;
  }

  // Cost calculation
  const constructionCost = sellableArea * (assumptions.constructionCostPerSqm || 0);
  const infraCost = assumptions.infrastructureCostTotal || 0;
  const costAssumptions = assumptions.costAssumptions || {};
  const softCosts = costAssumptions.softCosts || 0;
  const marketingPct = costAssumptions.marketingPct || 0;
  const marketingCost = totalRevenue * (marketingPct / 100);

  const baseCost = constructionCost + infraCost + softCosts + marketingCost;
  const contingency = baseCost * ((assumptions.contingencyPct ?? 10) / 100);
  const totalCost = baseCost + contingency;

  const grossProfit = totalRevenue - totalCost;
  const profitMarginPct = assumptions.profitMarginPct ?? 15;
  const netProfit = grossProfit * (1 - profitMarginPct / 100);
  const roi = totalCost > 0 ? ((grossProfit / totalCost) * 100) : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    totalCost: Math.round(totalCost),
    grossProfit: Math.round(grossProfit),
    netProfit: Math.round(netProfit),
    roi: Math.round(roi * 10) / 10,
    sellableArea: Math.round(sellableArea),
    nonSellableArea: Math.round(nonSellableArea),
    sellablePct: Math.round(sellablePct * 10) / 10,
    constructionCost: Math.round(constructionCost),
    infrastructureCost: Math.round(infraCost),
    marketingCost: Math.round(marketingCost),
    contingency: Math.round(contingency),
    revenueByLandUse,
    plotCount: plots.length,
    avgPlotArea: plots.length > 0 ? Math.round(plotArea / plots.length) : 0,
    pricePerSqmSellable: sellableArea > 0 ? Math.round(totalRevenue / sellableArea) : 0,
    costPerSqmSellable: sellableArea > 0 ? Math.round(totalCost / sellableArea) : 0,
  };
}
