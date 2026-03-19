"use server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";

/** Get all operational assets for a project */
export async function getOperationalAssets(projectId: string, filters?: { assetClass?: string; operationalStatus?: string; maintenanceZone?: string }) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const where: any = { projectId, organizationId: orgId };
  if (filters?.assetClass) where.assetClass = filters.assetClass;
  if (filters?.operationalStatus) where.operationalStatus = filters.operationalStatus;
  if (filters?.maintenanceZone) where.maintenanceZone = filters.maintenanceZone;

  const assets = await db.operationalAsset.findMany({
    where,
    orderBy: { assetCode: "asc" },
  });

  return JSON.parse(JSON.stringify(assets));
}

/** Create an operational asset */
export async function createOperationalAsset(data: {
  projectId: string;
  assetClass: string;
  assetName: string;
  assetNameArabic?: string;
  installationDate?: string;
  warrantyEndDate?: string;
  maintenanceZone?: string;
  operationalOwner?: string;
  specifications?: any;
  geometry?: any;
  sourceHandoverId?: string;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  // Auto-generate asset code
  const count = await db.operationalAsset.count({
    where: { projectId: data.projectId, assetClass: data.assetClass, organizationId: orgId },
  });
  const assetCode = `${data.assetClass.substring(0, 4)}-${String(count + 1).padStart(4, "0")}`;

  const asset = await db.operationalAsset.create({
    data: {
      projectId: data.projectId,
      assetCode,
      assetClass: data.assetClass,
      assetName: data.assetName,
      assetNameArabic: data.assetNameArabic,
      installationDate: data.installationDate ? new Date(data.installationDate) : undefined,
      warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : undefined,
      maintenanceZone: data.maintenanceZone,
      operationalOwner: data.operationalOwner,
      specifications: data.specifications,
      geometry: data.geometry,
      sourceHandoverId: data.sourceHandoverId,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard/gis/assets");
  return JSON.parse(JSON.stringify(asset));
}

/** Update operational asset status */
export async function updateAssetStatus(assetId: string, operationalStatus: string) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const existing = await db.operationalAsset.findFirst({
    where: { id: assetId, organizationId: orgId },
  });
  if (!existing) throw new Error("Operational asset not found.");

  const updated = await db.operationalAsset.update({
    where: { id: assetId },
    data: { operationalStatus },
  });

  revalidatePath("/dashboard/gis/assets");
  return JSON.parse(JSON.stringify(updated));
}

/** Get asset registry stats */
export async function getAssetStats(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const [statusGroups, classGroups, warrantyExpired] = await Promise.all([
    db.operationalAsset.groupBy({
      by: ["operationalStatus"],
      where: { projectId, organizationId: orgId },
      _count: { id: true },
    }),
    db.operationalAsset.groupBy({
      by: ["assetClass"],
      where: { projectId, organizationId: orgId },
      _count: { id: true },
    }),
    db.operationalAsset.count({
      where: {
        projectId,
        organizationId: orgId,
        warrantyEndDate: { lt: new Date() },
        operationalStatus: "ACTIVE",
      },
    }),
  ]);

  const total = statusGroups.reduce((s, g) => s + g._count.id, 0);
  const active = statusGroups.find(g => g.operationalStatus === "ACTIVE")?._count.id ?? 0;

  return {
    total, active, warrantyExpired,
    byStatus: statusGroups.map(g => ({ status: g.operationalStatus, count: g._count.id })),
    byClass: classGroups.map(g => ({ assetClass: g.assetClass, count: g._count.id })),
  };
}
