"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

export async function createProject(data: {
  name: string;
  description?: string;
  type: any;
  buildings?: { name: string; numberOfFloors?: number; buildingAreaSqm?: number }[];
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
