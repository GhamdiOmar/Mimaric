"use server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";

/** Get all land records (projects in LAND_* status) for the GIS land bank map */
export async function getLandBankGeoData() {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const lands = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"] },
    },
    select: {
      id: true, name: true, description: true, status: true,
      latitude: true, longitude: true, boundaries: true,
      totalAreaSqm: true, region: true, city: true, district: true,
      landUse: true, estimatedValueSar: true, suitabilityScore: true,
      landOwner: true, landOwnerType: true, acquisitionPrice: true,
      acquisitionDate: true, landLegalNotes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(lands));
}

/** Update land boundary GeoJSON on the project record */
export async function updateLandBoundary(projectId: string, boundaries: any) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Land record not found or you don't have access.");

  const updated = await db.project.update({
    where: { id: projectId },
    data: { boundaries },
  });

  revalidatePath("/dashboard/gis/land-bank");
  return JSON.parse(JSON.stringify(updated));
}

/** Get land scorecard metrics */
export async function getLandScorecard(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: {
      id: true, name: true, status: true,
      totalAreaSqm: true, estimatedValueSar: true, suitabilityScore: true,
      landOwner: true, landOwnerType: true, acquisitionPrice: true,
      landLegalNotes: true, region: true, city: true, district: true,
      landUse: true, boundaries: true, latitude: true, longitude: true,
      _count: { select: { dueDiligence: true, constraints: true } },
    },
  });
  if (!project) throw new Error("Land record not found or you don't have access.");

  return JSON.parse(JSON.stringify(project));
}
