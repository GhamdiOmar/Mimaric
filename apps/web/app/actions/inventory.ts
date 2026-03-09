"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Inventory Items ─────────────────────────────────────────────────────────

export async function getInventoryItems(projectId: string) {
  const session = await requirePermission("inventory:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const items = await db.inventoryItem.findMany({
    where: { projectId },
    orderBy: { itemNumber: "asc" },
  });

  return JSON.parse(JSON.stringify(items));
}

export async function createInventoryItem(data: {
  projectId: string;
  itemNumber: string;
  productType: string;
  productLabel?: string;
  productLabelArabic?: string;
  areaSqm?: number;
  basePriceSar?: number;
  finalPriceSar?: number;
  pricePerSqm?: number;
  releasePhase?: number;
  releaseDate?: string;
  channel?: string;
}) {
  const session = await requirePermission("inventory:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const item = await db.inventoryItem.create({
    data: {
      projectId: data.projectId,
      itemNumber: data.itemNumber,
      productType: data.productType as any,
      productLabel: data.productLabel,
      productLabelArabic: data.productLabelArabic,
      areaSqm: data.areaSqm,
      basePriceSar: data.basePriceSar,
      finalPriceSar: data.finalPriceSar,
      pricePerSqm: data.pricePerSqm,
      releasePhase: data.releasePhase,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      channel: data.channel as any,
      status: "UNRELEASED" as any,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(item));
}

export async function updateInventoryItem(
  id: string,
  data: {
    itemNumber?: string;
    productType?: string;
    productLabel?: string;
    productLabelArabic?: string;
    areaSqm?: number;
    basePriceSar?: number;
    finalPriceSar?: number;
    pricePerSqm?: number;
    pricingDetails?: any;
    releasePhase?: number;
    releaseDate?: string;
    status?: string;
    channel?: string;
  }
) {
  const session = await requirePermission("inventory:write");
  const orgId = session.organizationId;

  const existing = await db.inventoryItem.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Inventory item not found");

  const updated = await db.inventoryItem.update({
    where: { id },
    data: {
      ...(data.itemNumber !== undefined && { itemNumber: data.itemNumber }),
      ...(data.productType !== undefined && { productType: data.productType as any }),
      ...(data.productLabel !== undefined && { productLabel: data.productLabel }),
      ...(data.productLabelArabic !== undefined && { productLabelArabic: data.productLabelArabic }),
      ...(data.areaSqm !== undefined && { areaSqm: data.areaSqm }),
      ...(data.basePriceSar !== undefined && { basePriceSar: data.basePriceSar }),
      ...(data.finalPriceSar !== undefined && { finalPriceSar: data.finalPriceSar }),
      ...(data.pricePerSqm !== undefined && { pricePerSqm: data.pricePerSqm }),
      ...(data.pricingDetails !== undefined && { pricingDetails: data.pricingDetails }),
      ...(data.releasePhase !== undefined && { releasePhase: data.releasePhase }),
      ...(data.releaseDate !== undefined && { releaseDate: new Date(data.releaseDate) }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.channel !== undefined && { channel: data.channel as any }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteInventoryItem(id: string) {
  const session = await requirePermission("inventory:write");
  const orgId = session.organizationId;

  const existing = await db.inventoryItem.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Inventory item not found");

  // Only allow deleting unreleased items
  if (existing.status !== "UNRELEASED") {
    throw new Error("Can only delete unreleased inventory items");
  }

  await db.inventoryItem.delete({ where: { id } });
}

/**
 * Generate inventory items from approved plots in a subdivision plan.
 */
export async function generateInventoryFromPlots(
  projectId: string,
  subdivisionPlanId: string
) {
  const session = await requirePermission("inventory:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  // Get all plots from the subdivision plan
  const plots = await db.plot.findMany({
    where: { subdivisionPlanId, organizationId: orgId },
    orderBy: { plotNumber: "asc" },
  });

  if (plots.length === 0) throw new Error("No plots found in subdivision plan");

  // Check for existing inventory items to avoid duplicates
  const existingItems = await db.inventoryItem.findMany({
    where: { projectId },
    select: { itemNumber: true },
  });
  const existingNumbers = new Set(existingItems.map((i) => i.itemNumber));

  const created: any[] = [];
  for (const plot of plots) {
    const itemNumber = `INV-${plot.plotNumber}`;
    if (existingNumbers.has(itemNumber)) continue;

    // Map plot landUse to product type
    const productType = mapLandUseToProductType(plot.landUse);

    const item = await db.inventoryItem.create({
      data: {
        projectId,
        itemNumber,
        productType: productType as any,
        productLabel: `Plot ${plot.plotNumber} - ${plot.landUse ?? "Mixed"}`,
        areaSqm: plot.areaSqm ?? undefined,
        releasePhase: plot.phase ?? 1,
        status: "UNRELEASED" as any,
        organizationId: orgId,
      },
    });
    created.push(item);
  }

  return JSON.parse(JSON.stringify(created));
}

/**
 * Release inventory items (change status from UNRELEASED to AVAILABLE).
 */
export async function releaseInventory(ids: string[]) {
  const session = await requirePermission("inventory:write");
  const orgId = session.organizationId;

  const updated = await db.inventoryItem.updateMany({
    where: {
      id: { in: ids },
      organizationId: orgId,
      status: "UNRELEASED",
    },
    data: {
      status: "AVAILABLE_INV" as any,
      releaseDate: new Date(),
    },
  });

  return { count: updated.count };
}

/**
 * Get inventory statistics for a project.
 */
export async function getInventoryStats(projectId: string) {
  const session = await requirePermission("inventory:read");
  const orgId = session.organizationId;

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
  });

  const total = items.length;
  const unreleased = items.filter((i) => i.status === "UNRELEASED").length;
  const available = items.filter((i) => i.status === "AVAILABLE_INV").length;
  const reserved = items.filter((i) => i.status === "RESERVED_INV").length;
  const sold = items.filter((i) => i.status === "SOLD_INV").length;
  const held = items.filter((i) => i.status === "HELD_INV").length;
  const withdrawn = items.filter((i) => i.status === "WITHDRAWN").length;

  const totalValue = items.reduce(
    (sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : i.basePriceSar ? Number(i.basePriceSar) : 0), 0
  );
  const totalArea = items.reduce((sum, i) => sum + (i.areaSqm ?? 0), 0);

  // By product type
  const byProductType: Record<string, number> = {};
  for (const i of items) {
    byProductType[i.productType] = (byProductType[i.productType] ?? 0) + 1;
  }

  // By phase
  const byPhase: Record<number, number> = {};
  for (const i of items) {
    const phase = i.releasePhase ?? 1;
    byPhase[phase] = (byPhase[phase] ?? 0) + 1;
  }

  return { total, unreleased, available, reserved, sold, held, withdrawn, totalValue, totalArea, byProductType, byPhase };
}

// ─── Global Inventory (Cross-Module) ────────────────────────────────────────

/**
 * Get all inventory items across all projects in the organization.
 */
export async function getAllInventoryItems() {
  const session = await requirePermission("inventory:read");
  const orgId = session.organizationId;

  const items = await db.inventoryItem.findMany({
    where: { organizationId: orgId },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(items));
}

/**
 * Get global inventory statistics across all projects.
 */
export async function getGlobalInventoryStats() {
  const session = await requirePermission("inventory:read");
  const orgId = session.organizationId;

  const items = await db.inventoryItem.findMany({
    where: { organizationId: orgId },
    select: { status: true, productType: true, finalPriceSar: true, basePriceSar: true, areaSqm: true },
  });

  const total = items.length;
  const available = items.filter((i) => i.status === "AVAILABLE_INV").length;
  const reserved = items.filter((i) => i.status === "RESERVED_INV").length;
  const sold = items.filter((i) => i.status === "SOLD_INV").length;
  const unreleased = items.filter((i) => i.status === "UNRELEASED").length;
  const totalValue = items.reduce(
    (sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : i.basePriceSar ? Number(i.basePriceSar) : 0), 0
  );

  return { total, available, reserved, sold, unreleased, totalValue };
}

// Helper
function mapLandUseToProductType(landUse: string | null): string {
  switch (landUse) {
    case "RESIDENTIAL": return "VILLA_PLOT";
    case "COMMERCIAL": return "COMMERCIAL_LOT";
    case "MIXED_USE": return "MIXED_USE_LOT";
    case "INDUSTRIAL": return "RAW_LAND_PLOT";
    default: return "RAW_LAND_PLOT";
  }
}
