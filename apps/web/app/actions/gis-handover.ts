"use server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";

/** Get handover records for a project */
export async function getHandoverRecords(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const records = await db.handoverRecord.findMany({
    where: { projectId, organizationId: orgId },
    include: {
      defects: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(records));
}

/** Create a handover record */
export async function createHandoverRecord(data: {
  projectId: string;
  assetType: string;
  assetId: string;
  assetName: string;
  assetNameArabic?: string;
  geometry?: any;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const record = await db.handoverRecord.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard/gis/handover");
  return JSON.parse(JSON.stringify(record));
}

/** Update handover record status */
export async function updateHandoverStatus(recordId: string, data: {
  inspectionStatus?: string;
  handoverStatus?: string;
  inspectionDate?: string;
  receiverEntity?: string;
  notes?: string;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const existing = await db.handoverRecord.findFirst({
    where: { id: recordId, organizationId: orgId },
  });
  if (!existing) throw new Error("Handover record not found.");

  const updateData: any = {};
  if (data.inspectionStatus) updateData.inspectionStatus = data.inspectionStatus;
  if (data.handoverStatus) {
    updateData.handoverStatus = data.handoverStatus;
    if (data.handoverStatus === "HANDED_OVER") updateData.handoverDate = new Date();
  }
  if (data.inspectionDate) updateData.inspectionDate = new Date(data.inspectionDate);
  if (data.receiverEntity !== undefined) updateData.receiverEntity = data.receiverEntity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Recount defects
  const defectCounts = await db.handoverDefect.groupBy({
    by: ["severity"],
    where: { handoverRecordId: recordId, status: { not: "RESOLVED" } },
    _count: { id: true },
  });
  updateData.criticalDefectCount = defectCounts.find(d => d.severity === "CRITICAL")?._count.id ?? 0;
  updateData.minorDefectCount = defectCounts.filter(d => d.severity !== "CRITICAL").reduce((sum, d) => sum + d._count.id, 0);

  const updated = await db.handoverRecord.update({
    where: { id: recordId },
    data: updateData,
  });

  revalidatePath("/dashboard/gis/handover");
  return JSON.parse(JSON.stringify(updated));
}

/** Create a defect on a handover record */
export async function createHandoverDefect(data: {
  handoverRecordId: string;
  title: string;
  titleArabic?: string;
  description?: string;
  severity: string;
  locationDescription?: string;
  locationGeoJson?: any;
  assignedTo?: string;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const record = await db.handoverRecord.findFirst({
    where: { id: data.handoverRecordId, organizationId: orgId },
  });
  if (!record) throw new Error("Handover record not found.");

  const defect = await db.handoverDefect.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });

  // Update defect counts on parent record
  await updateDefectCounts(data.handoverRecordId, orgId);

  revalidatePath("/dashboard/gis/handover");
  return JSON.parse(JSON.stringify(defect));
}

/** Update defect status */
export async function updateDefectStatus(defectId: string, status: string) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const defect = await db.handoverDefect.findFirst({
    where: { id: defectId, organizationId: orgId },
  });
  if (!defect) throw new Error("Defect not found.");

  const updateData: any = { status };
  if (status === "RESOLVED") updateData.resolvedAt = new Date();
  if (status === "VERIFIED") updateData.verifiedAt = new Date();

  const updated = await db.handoverDefect.update({
    where: { id: defectId },
    data: updateData,
  });

  await updateDefectCounts(defect.handoverRecordId, orgId);

  revalidatePath("/dashboard/gis/handover");
  return JSON.parse(JSON.stringify(updated));
}

/** Get handover stats for a project */
export async function getHandoverStats(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const records = await db.handoverRecord.findMany({
    where: { projectId, organizationId: orgId },
    select: {
      handoverStatus: true,
      inspectionStatus: true,
      criticalDefectCount: true,
      minorDefectCount: true,
      assetType: true,
    },
  });

  const total = records.length;
  const handedOver = records.filter(r => r.handoverStatus === "HANDED_OVER").length;
  const ready = records.filter(r => r.handoverStatus === "READY").length;
  const pending = records.filter(r => r.handoverStatus === "PENDING").length;
  const totalCriticalDefects = records.reduce((s, r) => s + r.criticalDefectCount, 0);
  const totalMinorDefects = records.reduce((s, r) => s + r.minorDefectCount, 0);

  return {
    total, handedOver, ready, pending,
    totalCriticalDefects, totalMinorDefects,
    handoverPercentage: total > 0 ? Math.round((handedOver / total) * 100) : 0,
    byAssetType: Object.entries(
      records.reduce((acc, r) => {
        acc[r.assetType] = (acc[r.assetType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({ type, count })),
  };
}

// Internal helper
async function updateDefectCounts(handoverRecordId: string, orgId: string) {
  const defects = await db.handoverDefect.findMany({
    where: { handoverRecordId, status: { notIn: ["RESOLVED", "VERIFIED", "WONT_FIX"] } },
    select: { severity: true },
  });
  const criticalDefectCount = defects.filter(d => d.severity === "CRITICAL").length;
  const minorDefectCount = defects.length - criticalDefectCount;
  await db.handoverRecord.update({
    where: { id: handoverRecordId },
    data: { criticalDefectCount, minorDefectCount },
  });
}
