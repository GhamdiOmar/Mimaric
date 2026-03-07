"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function createProject(data: {
  name: string;
  description?: string;
  type: any;
  buildings?: { name: string }[];
}) {
  const session = await getSessionOrThrow();

  const project = await db.project.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      organizationId: session.organizationId,
      buildings: data.buildings
        ? { create: data.buildings.map((b) => ({ name: b.name })) }
        : undefined,
    },
    include: { buildings: true },
  });

  revalidatePath("/dashboard/projects");
  return project;
}

export async function getProjects() {
  const session = await getSessionOrThrow();

  return await db.project.findMany({
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
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; type?: any; status?: any }
) {
  const session = await getSessionOrThrow();

  const project = await db.project.update({
    where: { id: projectId, organizationId: session.organizationId },
    data,
  });

  revalidatePath("/dashboard/projects");
  return project;
}

export async function deleteProject(projectId: string) {
  const session = await getSessionOrThrow();

  await db.project.delete({
    where: { id: projectId, organizationId: session.organizationId },
  });

  revalidatePath("/dashboard/projects");
}

export async function createBuilding(data: {
  name: string;
  projectId: string;
}) {
  const session = await getSessionOrThrow();

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const building = await db.building.create({
    data: { name: data.name, projectId: data.projectId },
  });

  revalidatePath("/dashboard/projects");
  return building;
}
