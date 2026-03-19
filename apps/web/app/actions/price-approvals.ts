"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { revalidatePath } from "next/cache";

// ─── RED: Price Change Requests ─────────────────────────────────────────────

const VARIANCE_ESCALATION_THRESHOLD = 15; // Auto-escalate if variance > 15%

export async function createPriceChangeRequest(data: {
  inventoryItemId?: string;
  projectId: string;
  proposedPrice: number;
  reason: string;
  reasonArabic?: string;
  justification?: string;
}) {
  const session = await requirePermission("price_approval:write");

  // Get current price from inventory item
  let currentPrice = 0;
  if (data.inventoryItemId) {
    const item = await db.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, organizationId: session.organizationId },
    });
    if (!item) throw new Error("Inventory item not found. Please refresh the page and try again.");
    currentPrice = Number(item.finalPriceSar ?? item.basePriceSar ?? 0);
  }

  if (currentPrice === 0) {
    throw new Error("The current price must be greater than zero to request a price change.");
  }

  const variancePct = ((data.proposedPrice - currentPrice) / currentPrice) * 100;
  const shouldEscalate = Math.abs(variancePct) > VARIANCE_ESCALATION_THRESHOLD;

  const request = await db.priceChangeRequest.create({
    data: {
      inventoryItemId: data.inventoryItemId,
      projectId: data.projectId,
      requestedBy: session.userId,
      currentPrice,
      proposedPrice: data.proposedPrice,
      variancePct,
      reason: data.reason,
      reasonArabic: data.reasonArabic,
      justification: data.justification,
      escalated: shouldEscalate,
      status: shouldEscalate ? "ESCALATED_PRICE_CHANGE" : "PENDING_PRICE_CHANGE",
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "CREATE",
    resource: "PriceChangeRequest",
    resourceId: request.id,
    metadata: { variancePct, escalated: shouldEscalate },
    organizationId: session.organizationId,
  });

  return JSON.parse(JSON.stringify(request));
}

export async function reviewPriceChangeRequest(
  requestId: string,
  decision: "APPROVED_PRICE_CHANGE" | "REJECTED_PRICE_CHANGE",
  notes?: string
) {
  const session = await requirePermission("price_approval:approve");

  const request = await db.priceChangeRequest.findFirst({
    where: { id: requestId, organizationId: session.organizationId },
  });
  if (!request) throw new Error("Price change request not found. Please refresh and try again.");

  if (request.status !== "PENDING_PRICE_CHANGE" && request.status !== "ESCALATED_PRICE_CHANGE") {
    throw new Error("This request has already been reviewed and is no longer pending.");
  }

  const updated = await db.priceChangeRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      reviewedBy: session.userId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  });

  // If approved, update the inventory item price
  if (decision === "APPROVED_PRICE_CHANGE" && request.inventoryItemId) {
    await db.inventoryItem.update({
      where: { id: request.inventoryItemId },
      data: {
        finalPriceSar: request.proposedPrice,
        pricePerSqm: null, // Reset — will be recalculated
      },
    });
  }

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "PriceChangeRequest",
    resourceId: requestId,
    before: { status: request.status },
    after: { status: decision },
    metadata: { decision, notes },
    organizationId: session.organizationId,
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function escalatePriceChangeRequest(requestId: string, escalatedTo: string) {
  const session = await requirePermission("price_approval:write");

  const request = await db.priceChangeRequest.findFirst({
    where: { id: requestId, organizationId: session.organizationId },
  });
  if (!request) throw new Error("Price change request not found. Please refresh and try again.");

  const updated = await db.priceChangeRequest.update({
    where: { id: requestId },
    data: {
      status: "ESCALATED_PRICE_CHANGE",
      escalated: true,
      escalatedTo,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getPriceChangeRequests(projectId: string, params?: { page?: number; pageSize?: number }) {
  const session = await requirePermission("price_approval:read");

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where = { projectId, organizationId: session.organizationId };

  const [data, total] = await Promise.all([
    db.priceChangeRequest.findMany({
      where,
      include: { inventoryItem: { select: { itemNumber: true, productLabel: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.priceChangeRequest.count({ where }),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── RED: Price List Versioning ─────────────────────────────────────────────

export async function createPriceListVersion(projectId: string) {
  const session = await requirePermission("pricing:write");

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: session.organizationId },
    select: {
      id: true,
      itemNumber: true,
      productType: true,
      productLabel: true,
      basePriceSar: true,
      finalPriceSar: true,
      pricePerSqm: true,
      areaSqm: true,
    },
  });

  // Get next version number
  const lastVersion = await db.priceListVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
  });

  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const version = await db.priceListVersion.create({
    data: {
      projectId,
      versionNumber,
      name: `Price List v${versionNumber}`,
      effectiveDate: new Date(),
      snapshot: JSON.parse(JSON.stringify(items)),
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "CREATE",
    resource: "PriceListVersion",
    resourceId: version.id,
    metadata: { versionNumber },
    organizationId: session.organizationId,
  });

  return JSON.parse(JSON.stringify(version));
}

export async function approvePriceListVersion(versionId: string) {
  const session = await requirePermission("price_approval:approve");

  const version = await db.priceListVersion.findFirst({
    where: { id: versionId, organizationId: session.organizationId },
  });
  if (!version) throw new Error("Price list version not found. Please refresh and try again.");

  if (version.status !== "DRAFT_PRICE_LIST" && version.status !== "PENDING_PRICE_APPROVAL") {
    throw new Error("This version has already been reviewed and is no longer pending approval.");
  }

  // Supersede previous approved versions for same project
  await db.priceListVersion.updateMany({
    where: {
      projectId: version.projectId,
      status: "APPROVED_PRICE_LIST",
    },
    data: { status: "SUPERSEDED" },
  });

  const updated = await db.priceListVersion.update({
    where: { id: versionId },
    data: {
      status: "APPROVED_PRICE_LIST",
      approvedBy: session.userId,
      approvedAt: new Date(),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getPriceListVersions(projectId: string) {
  const session = await requirePermission("pricing:read");

  const versions = await db.priceListVersion.findMany({
    where: { projectId, organizationId: session.organizationId },
    orderBy: { versionNumber: "desc" },
  });

  return JSON.parse(JSON.stringify(versions));
}

export async function comparePriceListVersions(versionId1: string, versionId2: string) {
  const session = await requirePermission("pricing:read");

  const [v1, v2] = await Promise.all([
    db.priceListVersion.findFirst({
      where: { id: versionId1, organizationId: session.organizationId },
    }),
    db.priceListVersion.findFirst({
      where: { id: versionId2, organizationId: session.organizationId },
    }),
  ]);

  if (!v1 || !v2) throw new Error("One or both price list versions were not found. Please refresh and try again.");

  const snap1 = (v1.snapshot as any[]) ?? [];
  const snap2 = (v2.snapshot as any[]) ?? [];

  // Build lookup by item ID
  const map1 = new Map(snap1.map((i: any) => [i.id, i]));
  const map2 = new Map(snap2.map((i: any) => [i.id, i]));

  const diffs: Array<{
    itemId: string;
    itemNumber: string;
    oldPrice: number | null;
    newPrice: number | null;
    change: number;
  }> = [];

  // Check items in v2 vs v1
  for (const [id, item2] of map2) {
    const item1 = map1.get(id);
    const oldPrice = item1 ? Number(item1.finalPriceSar ?? item1.basePriceSar ?? 0) : null;
    const newPrice = Number((item2 as any).finalPriceSar ?? (item2 as any).basePriceSar ?? 0);

    if (oldPrice !== newPrice) {
      diffs.push({
        itemId: id,
        itemNumber: (item2 as any).itemNumber,
        oldPrice,
        newPrice,
        change: oldPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 100,
      });
    }
  }

  return {
    version1: { id: v1.id, versionNumber: v1.versionNumber, effectiveDate: v1.effectiveDate },
    version2: { id: v2.id, versionNumber: v2.versionNumber, effectiveDate: v2.effectiveDate },
    diffs,
    totalChanges: diffs.length,
  };
}
