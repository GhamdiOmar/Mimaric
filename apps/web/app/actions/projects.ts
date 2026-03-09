"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

export async function createProject(data: {
  name: string;
  description?: string;
  type: any;
  status?: string;
  buildings?: { name: string; numberOfFloors?: number; buildingAreaSqm?: number; buildingType?: string }[];
  // Balady-aligned fields
  parcelNumber?: string;
  plotNumber?: string;
  blockNumber?: string;
  deedNumber?: string;
  landUse?: any;
  totalAreaSqm?: number;
  region?: string;
  city?: string;
  district?: string;
  streetName?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  boundaries?: any;
  utilities?: any;
  estimatedValueSar?: number;
}) {
  const session = await requirePermission("projects:write");

  const project = await db.project.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status as any || undefined,
      organizationId: session.organizationId,
      parcelNumber: data.parcelNumber,
      plotNumber: data.plotNumber,
      blockNumber: data.blockNumber,
      deedNumber: data.deedNumber,
      landUse: data.landUse,
      totalAreaSqm: data.totalAreaSqm,
      region: data.region,
      city: data.city,
      district: data.district,
      streetName: data.streetName,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      boundaries: data.boundaries,
      utilities: data.utilities,
      estimatedValueSar: data.estimatedValueSar,
      buildings: data.buildings
        ? {
            create: data.buildings.map((b) => ({
              name: b.name,
              numberOfFloors: b.numberOfFloors,
              buildingAreaSqm: b.buildingAreaSqm,
            })),
          }
        : undefined,
    },
    include: { buildings: true },
  });

  revalidatePath("/dashboard/projects");
  return JSON.parse(JSON.stringify(project));
}

export async function getProjects() {
  const session = await requirePermission("projects:read");

  const projects = await db.project.findMany({
    where: { organizationId: session.organizationId },
    include: {
      buildings: {
        include: {
          units: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return JSON.parse(JSON.stringify(projects));
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    type?: any;
    status?: any;
    parcelNumber?: string;
    plotNumber?: string;
    blockNumber?: string;
    deedNumber?: string;
    landUse?: any;
    totalAreaSqm?: number;
    region?: string;
    city?: string;
    district?: string;
    streetName?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    boundaries?: any;
    utilities?: any;
    estimatedValueSar?: number;
  }
) {
  const session = await requirePermission("projects:write");

  const project = await db.project.update({
    where: { id: projectId, organizationId: session.organizationId },
    data,
  });

  revalidatePath("/dashboard/projects");
  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(projectId: string) {
  const session = await requirePermission("projects:delete");

  await db.project.delete({
    where: { id: projectId, organizationId: session.organizationId },
  });

  revalidatePath("/dashboard/projects");
}

export async function createBuilding(data: {
  name: string;
  projectId: string;
  numberOfFloors?: number;
  buildingAreaSqm?: number;
  constructionYear?: number;
  buildingType?: string;
}) {
  const session = await requirePermission("projects:write");

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const building = await db.building.create({
    data: {
      name: data.name,
      projectId: data.projectId,
      numberOfFloors: data.numberOfFloors,
      buildingAreaSqm: data.buildingAreaSqm,
      constructionYear: data.constructionYear,
      buildingType: data.buildingType,
    },
  });

  revalidatePath("/dashboard/projects");
  return JSON.parse(JSON.stringify(building));
}

export async function getProjectDetail(projectId: string) {
  const session = await requirePermission("projects:read");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
    include: {
      buildings: {
        include: {
          units: true,
          _count: { select: { units: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { buildings: true, siteLogs: true },
      },
    },
  });

  if (!project) throw new Error("Project not found");
  return JSON.parse(JSON.stringify(project));
}

export async function updateBuilding(
  buildingId: string,
  data: {
    name?: string;
    numberOfFloors?: number;
    buildingAreaSqm?: number;
    constructionYear?: number;
    buildingType?: string;
  }
) {
  const session = await requirePermission("projects:write");

  // Verify the building belongs to the org
  const building = await db.building.findFirst({
    where: { id: buildingId, project: { organizationId: session.organizationId } },
  });
  if (!building) throw new Error("Building not found");

  const updated = await db.building.update({
    where: { id: buildingId },
    data,
  });

  revalidatePath("/dashboard/projects");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteBuilding(buildingId: string) {
  const session = await requirePermission("projects:delete");

  const building = await db.building.findFirst({
    where: { id: buildingId, project: { organizationId: session.organizationId } },
  });
  if (!building) throw new Error("Building not found");

  await db.building.delete({ where: { id: buildingId } });

  revalidatePath("/dashboard/projects");
}

export async function getProjectDocuments(projectId: string) {
  const session = await requirePermission("documents:read");

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const documents = await db.document.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(documents));
}

export async function registerProjectDocument(data: {
  projectId: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  category?: any;
  buildingId?: string;
}) {
  const session = await requirePermission("documents:write");

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const document = await db.document.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      category: data.category || "GENERAL",
      projectId: data.projectId,
      buildingId: data.buildingId,
      organizationId: session.organizationId,
      userId: session.userId,
    },
  });

  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return JSON.parse(JSON.stringify(document));
}

export async function deleteProjectDocument(documentId: string) {
  const session = await requirePermission("documents:delete");

  const doc = await db.document.findFirst({
    where: { id: documentId, organizationId: session.organizationId },
  });
  if (!doc) throw new Error("Document not found");

  await db.document.delete({ where: { id: documentId } });

  if (doc.projectId) {
    revalidatePath(`/dashboard/projects/${doc.projectId}`);
  }
  revalidatePath("/dashboard/documents");
}
