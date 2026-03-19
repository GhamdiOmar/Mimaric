"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

const LAND_STATUSES = ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"];

export async function getLandParcels() {
  const session = await requirePermission("land:read");
  const orgId = session.organizationId;

  const parcels = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: LAND_STATUSES as any },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(parcels));
}

export async function createLandParcel(data: {
  name: string;
  parcelNumber?: string;
  deedNumber?: string;
  landUse?: string;
  totalAreaSqm?: number;
  region?: string;
  city?: string;
  district?: string;
  estimatedValueSar?: number;
  landOwner?: string;
  landOwnerType?: string;
  latitude?: number;
  longitude?: number;
}) {
  const session = await requirePermission("land:write");
  const orgId = session.organizationId;

  const parcel = await db.project.create({
    data: {
      name: data.name,
      type: "RESIDENTIAL",
      status: "LAND_IDENTIFIED",
      organizationId: orgId,
      parcelNumber: data.parcelNumber || undefined,
      deedNumber: data.deedNumber || undefined,
      landUse: (data.landUse || undefined) as any,
      totalAreaSqm: data.totalAreaSqm || undefined,
      region: data.region || undefined,
      city: data.city || undefined,
      district: data.district || undefined,
      estimatedValueSar: data.estimatedValueSar || undefined,
      landOwner: data.landOwner || undefined,
      landOwnerType: data.landOwnerType || undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    },
  });

  return JSON.parse(JSON.stringify(parcel));
}

export async function updateLandStatus(projectId: string, newStatus: string) {
  const session = await requirePermission("land:write");
  const orgId = session.organizationId;

  // Validate the project belongs to this org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      status: newStatus as any,
      ...(newStatus === "LAND_ACQUIRED" ? { acquisitionDate: new Date() } : {}),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getLandDetail(projectId: string) {
  const session = await requirePermission("land:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      dueDiligence: true,
      constraints: { orderBy: { createdAt: "desc" } },
      feasibilityAssessments: { orderBy: { createdAt: "desc" } },
      decisionGates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  return JSON.parse(JSON.stringify(project));
}

export async function updateLandFields(projectId: string, data: {
  landOwner?: string;
  landOwnerType?: string;
  acquisitionPrice?: number;
  landLegalNotes?: string;
  latitude?: number;
  longitude?: number;
}) {
  const session = await requirePermission("land:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      landOwner: data.landOwner,
      landOwnerType: data.landOwnerType,
      acquisitionPrice: data.acquisitionPrice,
      landLegalNotes: data.landLegalNotes,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

const DEFAULT_ITEMS: Record<string, { label: string; checked: boolean }[]> = {
  LEGAL: [
    { label: "التحقق من صك الملكية", checked: false },
    { label: "فحص الرهون والقيود", checked: false },
    { label: "التحقق من عدم وجود نزاعات", checked: false },
    { label: "مراجعة التوكيلات والوكالات", checked: false },
  ],
  ZONING: [
    { label: "التحقق من نظام البناء المسموح", checked: false },
    { label: "مراجعة ارتفاعات البناء", checked: false },
    { label: "التأكد من الاستخدام المسموح", checked: false },
  ],
  VALUATION: [
    { label: "تقييم سوقي مستقل", checked: false },
    { label: "مقارنة بأسعار المنطقة", checked: false },
    { label: "تقدير تكلفة التطوير", checked: false },
  ],
  ENVIRONMENTAL: [
    { label: "فحص التربة", checked: false },
    { label: "تقييم المخاطر البيئية", checked: false },
    { label: "فحص مستوى المياه الجوفية", checked: false },
  ],
  UTILITY: [
    { label: "توفر الكهرباء", checked: false },
    { label: "توفر المياه", checked: false },
    { label: "توفر الصرف الصحي", checked: false },
    { label: "وصول الطرق", checked: false },
  ],
};

export async function getDueDiligence(projectId: string) {
  const session = await requirePermission("land:read");
  const orgId = session.organizationId;

  const existing = await db.dueDiligence.findMany({
    where: { projectId },
    orderBy: { category: "asc" },
  });

  // If no checklists exist, create default ones
  if (existing.length === 0) {
    const categories = Object.keys(DEFAULT_ITEMS);
    for (const cat of categories) {
      await db.dueDiligence.create({
        data: {
          projectId,
          category: cat,
          items: DEFAULT_ITEMS[cat] ?? [],
          organizationId: orgId,
        },
      });
    }
    const created = await db.dueDiligence.findMany({
      where: { projectId },
      orderBy: { category: "asc" },
    });
    return JSON.parse(JSON.stringify(created));
  }

  return JSON.parse(JSON.stringify(existing));
}

export async function updateDueDiligenceItems(id: string, items: any[]) {
  const session = await requirePermission("land:write");

  const allChecked = items.every((i: any) => i.checked);

  await db.dueDiligence.update({
    where: { id },
    data: {
      items,
      completedAt: allChecked ? new Date() : null,
    },
  });
}

export async function deleteLandParcel(projectId: string) {
  const session = await requirePermission("land:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId, status: { in: LAND_STATUSES as any } },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  // Delete related records first
  await db.dueDiligence.deleteMany({ where: { projectId } });
  await db.constraintRecord.deleteMany({ where: { projectId } });
  await db.feasibilityAssessment.deleteMany({ where: { projectId } });
  await db.decisionGate.deleteMany({ where: { projectId } });

  await db.project.delete({ where: { id: projectId } });

  return { success: true };
}

export async function getAcquiredLands() {
  const session = await requirePermission("land:read");
  const orgId = session.organizationId;

  const lands = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: "LAND_ACQUIRED" as any,
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(lands));
}
