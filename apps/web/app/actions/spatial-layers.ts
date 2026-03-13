"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Spatial Layer CRUD ─────────────────────────────────────────────────────

export async function getSpatialLayers(workspaceId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const layers = await db.spatialLayer.findMany({
    where: { workspaceId, organizationId: orgId },
    orderBy: { createdAt: "asc" },
  });

  return JSON.parse(JSON.stringify(layers));
}

export async function createSpatialLayer(data: {
  workspaceId: string;
  name: string;
  nameArabic?: string;
  type?: string;
  style?: any;
  geoJson?: any;
  sourceFile?: string;
}) {
  const session = await requirePermission("planning:import");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id: data.workspaceId, organizationId: orgId },
  });
  if (!workspace) throw new Error("Workspace not found");

  // Count features in GeoJSON
  let featureCount = 0;
  if (data.geoJson) {
    if (data.geoJson.type === "FeatureCollection") {
      featureCount = data.geoJson.features?.length ?? 0;
    } else if (data.geoJson.type === "Feature") {
      featureCount = 1;
    }
  }

  const layer = await db.spatialLayer.create({
    data: {
      name: data.name,
      nameArabic: data.nameArabic,
      type: (data.type as any) || "IMPORTED",
      style: data.style || { color: "#3388ff", fillColor: "#3388ff", fillOpacity: 0.2, weight: 2 },
      geoJson: data.geoJson,
      sourceFile: data.sourceFile,
      featureCount,
      workspaceId: data.workspaceId,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(layer));
}

export async function updateSpatialLayer(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    visible?: boolean;
    locked?: boolean;
    opacity?: number;
    style?: any;
    geoJson?: any;
  }
) {
  const session = await requirePermission("planning:import");
  const orgId = session.organizationId;

  const existing = await db.spatialLayer.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Spatial layer not found");

  let featureCount = existing.featureCount;
  if (data.geoJson) {
    if (data.geoJson.type === "FeatureCollection") {
      featureCount = data.geoJson.features?.length ?? 0;
    }
  }

  const updated = await db.spatialLayer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.visible !== undefined && { visible: data.visible }),
      ...(data.locked !== undefined && { locked: data.locked }),
      ...(data.opacity !== undefined && { opacity: data.opacity }),
      ...(data.style !== undefined && { style: data.style }),
      ...(data.geoJson !== undefined && { geoJson: data.geoJson, featureCount }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteSpatialLayer(id: string) {
  const session = await requirePermission("planning:import");
  const orgId = session.organizationId;

  const existing = await db.spatialLayer.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Spatial layer not found");

  await db.spatialLayer.delete({ where: { id } });
}

export async function toggleLayerVisibility(id: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const existing = await db.spatialLayer.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Spatial layer not found");

  const updated = await db.spatialLayer.update({
    where: { id },
    data: { visible: !existing.visible },
  });

  return JSON.parse(JSON.stringify(updated));
}
