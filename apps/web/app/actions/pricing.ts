"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Pricing Rules ───────────────────────────────────────────────────────────

export async function getPricingRules(projectId: string) {
  const session = await requirePermission("pricing:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const rules = await db.pricingRule.findMany({
    where: { projectId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return JSON.parse(JSON.stringify(rules));
}

export async function createPricingRule(data: {
  projectId: string;
  name: string;
  nameArabic?: string;
  type: string;
  factor?: number;
  fixedAmountSar?: number;
  appliesTo?: any;
  condition?: any;
  priority?: number;
}) {
  const session = await requirePermission("pricing:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const rule = await db.pricingRule.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      nameArabic: data.nameArabic,
      type: data.type as any,
      factor: data.factor,
      fixedAmountSar: data.fixedAmountSar,
      appliesTo: data.appliesTo,
      condition: data.condition,
      priority: data.priority ?? 0,
      isActive: true,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(rule));
}

export async function updatePricingRule(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    type?: string;
    factor?: number;
    fixedAmountSar?: number;
    appliesTo?: any;
    condition?: any;
    priority?: number;
    isActive?: boolean;
  }
) {
  const session = await requirePermission("pricing:write");
  const orgId = session.organizationId;

  const existing = await db.pricingRule.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Pricing rule not found. Please refresh and try again.");

  const updated = await db.pricingRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.factor !== undefined && { factor: data.factor }),
      ...(data.fixedAmountSar !== undefined && { fixedAmountSar: data.fixedAmountSar }),
      ...(data.appliesTo !== undefined && { appliesTo: data.appliesTo }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deletePricingRule(id: string) {
  const session = await requirePermission("pricing:write");
  const orgId = session.organizationId;

  const existing = await db.pricingRule.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Pricing rule not found. Please refresh and try again.");

  await db.pricingRule.delete({ where: { id } });
}

/**
 * Toggle a pricing rule active/inactive.
 */
export async function togglePricingRule(id: string) {
  const session = await requirePermission("pricing:write");
  const orgId = session.organizationId;

  const existing = await db.pricingRule.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Pricing rule not found. Please refresh and try again.");

  const updated = await db.pricingRule.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Calculate price for a single inventory item by applying all active pricing rules.
 */
export async function calculatePrice(
  projectId: string,
  inventoryItemId: string
) {
  const session = await requirePermission("pricing:read");
  const orgId = session.organizationId;

  const item = await db.inventoryItem.findFirst({
    where: { id: inventoryItemId, organizationId: orgId },
  });
  if (!item) throw new Error("Inventory item not found. Please refresh the page and try again.");

  const rules = await db.pricingRule.findMany({
    where: { projectId, isActive: true, organizationId: orgId },
    orderBy: { priority: "asc" },
  });

  let basePrice = 0;
  let totalMultiplier = 1;
  let totalFixed = 0;
  const appliedRules: any[] = [];

  for (const rule of rules) {
    // Check if rule applies to this item
    if (!doesRuleApply(rule, item)) continue;

    if (rule.type === "BASE_PRICE_PER_SQM") {
      basePrice = (item.areaSqm ?? 0) * (rule.factor ?? 0);
      appliedRules.push({ name: rule.name, type: rule.type, effect: basePrice });
    } else if (rule.fixedAmountSar) {
      totalFixed += Number(rule.fixedAmountSar);
      appliedRules.push({ name: rule.name, type: rule.type, effect: Number(rule.fixedAmountSar) });
    } else if (rule.factor) {
      totalMultiplier *= rule.factor;
      appliedRules.push({ name: rule.name, type: rule.type, effect: `×${rule.factor}` });
    }
  }

  const finalPrice = Math.round(basePrice * totalMultiplier + totalFixed);
  const pricePerSqm = item.areaSqm ? Math.round(finalPrice / item.areaSqm) : 0;

  return {
    basePriceSar: Math.round(basePrice),
    finalPriceSar: finalPrice,
    pricePerSqm,
    appliedRules,
  };
}

/**
 * Bulk calculate and apply prices for all inventory items in a project.
 */
export async function bulkCalculatePrices(projectId: string) {
  const session = await requirePermission("pricing:write");
  const orgId = session.organizationId;

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
  });

  const rules = await db.pricingRule.findMany({
    where: { projectId, isActive: true, organizationId: orgId },
    orderBy: { priority: "asc" },
  });

  let updated = 0;
  for (const item of items) {
    let basePrice = 0;
    let totalMultiplier = 1;
    let totalFixed = 0;
    const appliedRules: any[] = [];

    for (const rule of rules) {
      if (!doesRuleApply(rule, item)) continue;

      if (rule.type === "BASE_PRICE_PER_SQM") {
        basePrice = (item.areaSqm ?? 0) * (rule.factor ?? 0);
        appliedRules.push({ name: rule.name, type: rule.type, effect: basePrice });
      } else if (rule.fixedAmountSar) {
        totalFixed += Number(rule.fixedAmountSar);
        appliedRules.push({ name: rule.name, type: rule.type, effect: Number(rule.fixedAmountSar) });
      } else if (rule.factor) {
        totalMultiplier *= rule.factor;
        appliedRules.push({ name: rule.name, type: rule.type, effect: `×${rule.factor}` });
      }
    }

    const finalPrice = Math.round(basePrice * totalMultiplier + totalFixed);
    const pricePerSqm = item.areaSqm ? Math.round(finalPrice / item.areaSqm) : 0;

    await db.inventoryItem.update({
      where: { id: item.id },
      data: {
        basePriceSar: Math.round(basePrice),
        finalPriceSar: finalPrice,
        pricePerSqm,
        pricingDetails: { appliedRules, calculatedAt: new Date().toISOString() },
      },
    });
    updated++;
  }

  return { updated };
}

/**
 * Get pricing summary for a project.
 */
export async function getPricingSummary(projectId: string) {
  const session = await requirePermission("pricing:read");
  const orgId = session.organizationId;

  const rules = await db.pricingRule.findMany({
    where: { projectId, organizationId: orgId },
  });

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
  });

  const activeRules = rules.filter((r) => r.isActive).length;
  const inactiveRules = rules.filter((r) => !r.isActive).length;
  const pricedItems = items.filter((i) => i.finalPriceSar !== null).length;
  const unpricedItems = items.filter((i) => i.finalPriceSar === null).length;
  const totalRevenue = items.reduce(
    (sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : 0), 0
  );
  const avgPricePerSqm = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + (i.pricePerSqm ? Number(i.pricePerSqm) : 0), 0) / Math.max(pricedItems, 1))
    : 0;

  return { activeRules, inactiveRules, pricedItems, unpricedItems, totalRevenue, avgPricePerSqm };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function doesRuleApply(rule: any, item: any): boolean {
  if (!rule.appliesTo) return true; // No filter = applies to all

  const appliesTo = rule.appliesTo as any;

  // Check product type filter
  if (appliesTo.productTypes?.length > 0) {
    if (!appliesTo.productTypes.includes(item.productType)) return false;
  }

  // Check phase filter
  if (appliesTo.phases?.length > 0) {
    if (!appliesTo.phases.includes(item.releasePhase)) return false;
  }

  // Check area conditions
  if (rule.condition) {
    const cond = rule.condition as any;
    if (cond.minArea && (item.areaSqm ?? 0) < cond.minArea) return false;
    if (cond.maxArea && (item.areaSqm ?? 0) > cond.maxArea) return false;
  }

  return true;
}
