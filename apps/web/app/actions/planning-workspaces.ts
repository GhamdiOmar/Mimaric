"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { createNotification, notifyAdmins } from "../../lib/create-notification";

// ─── Planning Workspace CRUD ────────────────────────────────────────────────

export async function getPlanningWorkspaces() {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const workspaces = await db.planningWorkspace.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { scenarios: true, spatialLayers: true, comments: true } },
      scenarios: {
        select: { id: true, name: true, status: true, isBaseline: true },
        orderBy: { version: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return JSON.parse(JSON.stringify(workspaces));
}

export async function getPlanningWorkspaceDetail(id: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id, organizationId: orgId },
    include: {
      scenarios: {
        include: {
          subdivisionPlan: {
            include: {
              plots: { orderBy: { plotNumber: "asc" } },
              blocks: { orderBy: { blockNumber: "asc" } },
              roads: { orderBy: { name: "asc" } },
              utilityCorridors: { orderBy: { name: "asc" } },
            },
          },
          feasibilitySet: true,
          _count: { select: { complianceResults: true } },
        },
        orderBy: { version: "desc" },
      },
      spatialLayers: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!workspace) throw new Error("Planning workspace not found or you don't have access. Please refresh and try again.");
  return JSON.parse(JSON.stringify(workspace));
}

export async function createPlanningWorkspace(data: {
  name: string;
  nameArabic?: string;
  description?: string;
  landRecordId?: string;
  projectId?: string;
  siteMetadata?: any;
}) {
  const session = await requirePermission("planning:write");
  const orgId = session.organizationId;

  // If linking to land record, verify it exists and belongs to org
  if (data.landRecordId) {
    const land = await db.project.findFirst({
      where: {
        id: data.landRecordId,
        organizationId: orgId,
        status: { in: ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"] },
      },
    });
    if (!land) throw new Error("Land record not found or you don't have access. Please verify the record exists.");

    // Auto-populate site metadata from land record if not provided
    if (!data.siteMetadata) {
      data.siteMetadata = {
        totalAreaSqm: land.totalAreaSqm,
        region: land.region,
        city: land.city,
        district: land.district,
        latitude: land.latitude,
        longitude: land.longitude,
        parcelNumber: land.parcelNumber,
        deedNumber: land.deedNumber,
        landUse: land.landUse,
      };
    }
  }

  // If linking to project, verify it exists
  if (data.projectId) {
    const project = await db.project.findFirst({
      where: { id: data.projectId, organizationId: orgId },
    });
    if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

    if (!data.siteMetadata) {
      data.siteMetadata = {
        totalAreaSqm: project.totalAreaSqm,
        region: project.region,
        city: project.city,
        district: project.district,
        latitude: project.latitude,
        longitude: project.longitude,
        parcelNumber: project.parcelNumber,
        deedNumber: project.deedNumber,
        landUse: project.landUse,
      };
    }
  }

  const workspace = await db.planningWorkspace.create({
    data: {
      name: data.name,
      nameArabic: data.nameArabic,
      description: data.description,
      landRecordId: data.landRecordId,
      projectId: data.projectId,
      siteMetadata: data.siteMetadata,
      status: "DRAFT",
      createdBy: session.userId,
      organizationId: orgId,
    },
  });

  // Notify admins
  await notifyAdmins({
    type: "PLANNING_WORKSPACE_CREATED",
    title: `تم إنشاء مساحة تخطيط جديدة: ${data.name}`,
    titleEn: `New planning workspace created: ${data.name}`,
    message: `قام ${session.name || session.email} بإنشاء مساحة تخطيط جديدة`,
    messageEn: `${session.name || session.email} created a new planning workspace`,
    link: `/dashboard/planning/${workspace.id}`,
    organizationId: orgId,
  });

  return JSON.parse(JSON.stringify(workspace));
}

export async function updatePlanningWorkspace(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    description?: string;
    status?: string;
    siteMetadata?: any;
  }
) {
  const session = await requirePermission("planning:write");
  const orgId = session.organizationId;

  const existing = await db.planningWorkspace.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Planning workspace not found or you don't have access. Please refresh and try again.");

  const updated = await db.planningWorkspace.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.siteMetadata !== undefined && { siteMetadata: data.siteMetadata }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deletePlanningWorkspace(id: string) {
  const session = await requirePermission("planning:delete");
  const orgId = session.organizationId;

  const existing = await db.planningWorkspace.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Planning workspace not found or you don't have access. Please refresh and try again.");

  await db.planningWorkspace.delete({ where: { id } });
}

// ─── Open in Planning (from Land or Project) ────────────────────────────────

export async function createWorkspaceFromLand(landRecordId: string) {
  const session = await requirePermission("planning:write");
  const orgId = session.organizationId;

  const land = await db.project.findFirst({
    where: {
      id: landRecordId,
      organizationId: orgId,
      status: { in: ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"] },
    },
  });
  if (!land) throw new Error("Land record not found or you don't have access. Please verify the record exists.");

  // Check if workspace already exists for this land
  const existingWorkspace = await db.planningWorkspace.findFirst({
    where: { landRecordId, organizationId: orgId },
  });
  if (existingWorkspace) {
    return JSON.parse(JSON.stringify(existingWorkspace));
  }

  return createPlanningWorkspace({
    name: `${land.name} - Planning`,
    nameArabic: land.name ? `${land.name} - تخطيط` : undefined,
    landRecordId,
  });
}

export async function createWorkspaceFromProject(projectId: string) {
  const session = await requirePermission("planning:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  // Check if workspace already exists for this project
  const existingWorkspace = await db.planningWorkspace.findFirst({
    where: { projectId, organizationId: orgId },
  });
  if (existingWorkspace) {
    return JSON.parse(JSON.stringify(existingWorkspace));
  }

  return createPlanningWorkspace({
    name: `${project.name} - Planning`,
    nameArabic: project.name ? `${project.name} - تخطيط` : undefined,
    projectId,
  });
}

// ─── Linked Workspaces Query ─────────────────────────────────────────────────

export async function getLinkedWorkspaces(projectId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const workspaces = await db.planningWorkspace.findMany({
    where: {
      organizationId: orgId,
      OR: [{ projectId }, { landRecordId: projectId }],
    },
    select: {
      id: true,
      name: true,
      nameArabic: true,
      status: true,
      updatedAt: true,
      _count: { select: { scenarios: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return JSON.parse(JSON.stringify(workspaces));
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getPlanningDashboardStats() {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const [totalWorkspaces, activeWorkspaces, approvedScenarios, totalScenarios] = await Promise.all([
    db.planningWorkspace.count({ where: { organizationId: orgId } }),
    db.planningWorkspace.count({ where: { organizationId: orgId, status: { in: ["ACTIVE", "UNDER_REVIEW"] } } }),
    db.planningScenario.count({ where: { organizationId: orgId, status: "APPROVED" } }),
    db.planningScenario.count({ where: { organizationId: orgId } }),
  ]);

  // Workspace status distribution
  const statusDist = await db.planningWorkspace.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: true,
  });

  return {
    totalWorkspaces,
    activeWorkspaces,
    approvedScenarios,
    totalScenarios,
    statusDistribution: statusDist.map((s) => ({ status: s.status, count: s._count })),
  };
}
