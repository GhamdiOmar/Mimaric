"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { checkLimit, FEATURE_KEYS } from "../../lib/entitlements";

// ─── RED: Project Approval State Machine ────────────────────────────────────

const PROJECT_APPROVAL_TRANSITIONS: Record<string, string[]> = {
  DRAFT_PROJECT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED_PROJECT", "REJECTED_PROJECT"],
  APPROVED_PROJECT: ["ACTIVATED"],
  REJECTED_PROJECT: ["DRAFT_PROJECT"],
  ACTIVATED: [],
};

// City code lookup for project code generation
const CITY_CODES: Record<string, string> = {
  riyadh: "RYD", jeddah: "JED", makkah: "MKH", madinah: "MED",
  dammam: "DMM", khobar: "KHB", dhahran: "DHR", jubail: "JUB",
  tabuk: "TBK", abha: "ABH", taif: "TAF", hail: "HAL",
  jazan: "JZN", najran: "NJR", yanbu: "YNB", buraydah: "BUR",
  khamis_mushait: "KMS", al_ahsa: "AHS", neom: "NOM",
};

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

  // Entitlement check: projects.max
  const projectCount = await db.project.count({ where: { organizationId: session.organizationId } });
  const entitlement = await checkLimit(session.organizationId, FEATURE_KEYS.PROJECTS_MAX, projectCount);
  if (!entitlement.granted) {
    throw new Error(entitlement.reason ?? "Project limit reached. Please upgrade your plan.");
  }

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

  // RED: Off-plan edit restriction post-activation
  const existing = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!existing) throw new Error("Project not found");

  if (existing.approvalStatus === "ACTIVATED") {
    const RESTRICTED_FIELDS = ["name", "type", "parcelNumber", "plotNumber", "blockNumber", "deedNumber", "landUse", "totalAreaSqm", "region", "city", "district", "streetName", "postalCode", "latitude", "longitude", "boundaries", "utilities", "estimatedValueSar"];
    const attempted = Object.keys(data).filter((k) => RESTRICTED_FIELDS.includes(k) && (data as any)[k] !== undefined);
    if (attempted.length > 0) {
      throw new Error(`Cannot modify ${attempted.join(", ")} on an activated project`);
    }
  }

  const project = await db.project.update({
    where: { id: projectId, organizationId: session.organizationId },
    data,
  });

  revalidatePath("/dashboard/projects");
  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(projectId: string) {
  const session = await requirePermission("projects:delete");

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "DELETE",
    resource: "Project",
    resourceId: projectId,
    organizationId: session.organizationId,
  });

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
        include: { versions: { orderBy: { versionNumber: "desc" } } },
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

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "DELETE",
    resource: "Building",
    resourceId: buildingId,
    organizationId: session.organizationId,
  });

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

export async function uploadDocumentVersion(data: {
  documentId: string;
  url: string;
  size?: number;
  changeNote?: string;
}) {
  const session = await requirePermission("documents:write");

  const doc = await db.document.findFirst({
    where: { id: data.documentId, organizationId: session.organizationId },
  });
  if (!doc) throw new Error("Document not found");

  const nextVersion = doc.version + 1;

  // Archive current version
  await db.documentVersion.create({
    data: {
      documentId: data.documentId,
      versionNumber: doc.version,
      url: doc.url,
      size: doc.size,
      uploadedBy: doc.userId,
      changeNote: data.changeNote || `Version ${doc.version}`,
    },
  });

  // Update document to new version
  await db.document.update({
    where: { id: data.documentId },
    data: {
      url: data.url,
      size: data.size,
      version: nextVersion,
      userId: session.userId,
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Document",
    resourceId: data.documentId,
    metadata: { version: nextVersion, changeNote: data.changeNote },
    organizationId: session.organizationId,
  });

  if (doc.projectId) {
    revalidatePath(`/dashboard/projects/${doc.projectId}`);
  }
  return { version: nextVersion };
}

export async function deleteProjectDocument(documentId: string) {
  const session = await requirePermission("documents:delete");

  const doc = await db.document.findFirst({
    where: { id: documentId, organizationId: session.organizationId },
  });
  if (!doc) throw new Error("Document not found");

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "DELETE",
    resource: "Document",
    resourceId: documentId,
    metadata: { name: doc.name },
    organizationId: session.organizationId,
  });

  await db.document.delete({ where: { id: documentId } });

  if (doc.projectId) {
    revalidatePath(`/dashboard/projects/${doc.projectId}`);
  }
  revalidatePath("/dashboard/documents");
}

// ─── RED: Project Governance Actions ──────────────────────────────────────────

/**
 * Generate a unique project code: PRJ-{CITY}-{YEAR}-{SEQ}
 */
export async function generateProjectCode(projectId: string) {
  const session = await requirePermission("projects:write");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const cityKey = (project.city ?? "riyadh").toLowerCase().replace(/\s+/g, "_");
  const cityCode = CITY_CODES[cityKey] ?? cityKey.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();

  // Count existing projects with codes in this org for sequencing
  const existingCount = await db.project.count({
    where: {
      organizationId: session.organizationId,
      projectCode: { not: null },
    },
  });

  const seq = String(existingCount + 1).padStart(3, "0");
  const code = `PRJ-${cityCode}-${year}-${seq}`;

  const updated = await db.project.update({
    where: { id: projectId },
    data: { projectCode: code },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    metadata: { projectCode: code },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Assign project owners (internal PM and finance contact)
 */
export async function assignProjectOwners(
  projectId: string,
  data: { internalOwnerId?: string; financeOwnerId?: string }
) {
  const session = await requirePermission("projects:write");

  const before = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!before) throw new Error("Project not found");

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      internalOwnerId: data.internalOwnerId,
      financeOwnerId: data.financeOwnerId,
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    before: { internalOwnerId: before.internalOwnerId, financeOwnerId: before.financeOwnerId },
    after: { internalOwnerId: updated.internalOwnerId, financeOwnerId: updated.financeOwnerId },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Submit a project for approval: DRAFT_PROJECT → PENDING_APPROVAL
 */
export async function submitProjectForApproval(projectId: string) {
  const session = await requirePermission("projects:write");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const allowed = PROJECT_APPROVAL_TRANSITIONS[project.approvalStatus] ?? [];
  if (!allowed.includes("PENDING_APPROVAL")) {
    throw new Error(`Cannot submit project from status '${project.approvalStatus}'`);
  }

  // Validate minimum requirements before submission
  if (!project.projectCode) {
    throw new Error("Project code is required before submission");
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: { approvalStatus: "PENDING_APPROVAL" as any },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    before: { approvalStatus: project.approvalStatus },
    after: { approvalStatus: "PENDING_APPROVAL" },
    metadata: { transition: "DRAFT_PROJECT → PENDING_APPROVAL" },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Approve a project: PENDING_APPROVAL → APPROVED_PROJECT
 */
export async function approveProject(projectId: string, notes?: string) {
  const session = await requirePermission("projects:approve");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const allowed = PROJECT_APPROVAL_TRANSITIONS[project.approvalStatus] ?? [];
  if (!allowed.includes("APPROVED_PROJECT")) {
    throw new Error(`Cannot approve project from status '${project.approvalStatus}'`);
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: { approvalStatus: "APPROVED_PROJECT" as any },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    before: { approvalStatus: project.approvalStatus },
    after: { approvalStatus: "APPROVED_PROJECT" },
    metadata: { transition: "PENDING_APPROVAL → APPROVED_PROJECT", notes },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Reject a project: PENDING_APPROVAL → REJECTED_PROJECT
 */
export async function rejectProject(projectId: string, reason: string) {
  const session = await requirePermission("projects:approve");

  if (!reason?.trim()) throw new Error("Rejection reason is required");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const allowed = PROJECT_APPROVAL_TRANSITIONS[project.approvalStatus] ?? [];
  if (!allowed.includes("REJECTED_PROJECT")) {
    throw new Error(`Cannot reject project from status '${project.approvalStatus}'`);
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: { approvalStatus: "REJECTED_PROJECT" as any },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    before: { approvalStatus: project.approvalStatus },
    after: { approvalStatus: "REJECTED_PROJECT" },
    metadata: { transition: "PENDING_APPROVAL → REJECTED_PROJECT", reason },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Compute project readiness flags for activation checks.
 */
export async function computeReadinessFlags(projectId: string) {
  const session = await requirePermission("projects:read");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
    include: {
      approvalSubmissions: { where: { status: { not: "APPROVED_FINAL" } } },
      infrastructureReadiness: true,
      escrowAccount: true,
      inventoryItems: { where: { status: "AVAILABLE_INV" } },
      buildings: { include: { _count: { select: { units: true } } } },
    },
  });
  if (!project) throw new Error("Project not found");

  const blockers: string[] = [];

  // Check: all critical approvals approved
  const pendingApprovals = (project as any).approvalSubmissions?.length ?? 0;
  if (pendingApprovals > 0) {
    blockers.push(`${pendingApprovals} approval(s) still pending`);
  }

  // Check: infrastructure readiness
  const infra = (project as any).infrastructureReadiness?.[0];
  const infraReady = infra?.electricityReady && infra?.waterReady && infra?.roadAccess;
  if (!infraReady) {
    blockers.push("Infrastructure readiness incomplete");
  }

  // Check: escrow account active (for off-plan projects)
  const isOffPlan = project.status === "OFF_PLAN_LAUNCHED" || project.status === "LAUNCH_READINESS";
  if (isOffPlan && !(project as any).escrowAccount) {
    blockers.push("Escrow account not set up (required for off-plan)");
  }

  // Check: at least 1 released inventory item
  const releasedCount = (project as any).inventoryItems?.length ?? 0;
  if (releasedCount === 0) {
    blockers.push("No released inventory items");
  }

  // Check: at least 1 building with units
  const hasUnits = (project as any).buildings?.some((b: any) => b._count.units > 0);
  if (!hasUnits) {
    blockers.push("No buildings with units defined");
  }

  const launchReady = blockers.length === 0;
  const handoverReady = launchReady && project.status === "READY";

  return { launchReady, handoverReady, blockers };
}

/**
 * Activate a project: APPROVED_PROJECT → ACTIVATED.
 * Validates readiness before allowing activation.
 */
export async function activateProject(projectId: string) {
  const session = await requirePermission("projects:approve");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) throw new Error("Project not found");

  const allowed = PROJECT_APPROVAL_TRANSITIONS[project.approvalStatus] ?? [];
  if (!allowed.includes("ACTIVATED")) {
    throw new Error(`Cannot activate project from status '${project.approvalStatus}'`);
  }

  // Validate readiness
  const readiness = await computeReadinessFlags(projectId);
  if (!readiness.launchReady) {
    throw new Error(`Project not ready for activation: ${readiness.blockers.join("; ")}`);
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      approvalStatus: "ACTIVATED" as any,
      activatedAt: new Date(),
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Project",
    resourceId: projectId,
    before: { approvalStatus: project.approvalStatus },
    after: { approvalStatus: "ACTIVATED" },
    metadata: { transition: "APPROVED_PROJECT → ACTIVATED" },
    organizationId: session.organizationId,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * Get full project hierarchy tree: Project → Phases → Buildings → Units
 */
export async function getProjectTree(projectId: string) {
  const session = await requirePermission("projects:read");

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
    include: {
      phases: {
        include: {
          buildings: {
            include: {
              units: {
                select: {
                  id: true,
                  number: true,
                  type: true,
                  status: true,
                  area: true,
                  floor: true,
                },
                orderBy: { number: "asc" },
              },
              _count: { select: { units: true } },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      // Also include buildings not assigned to a phase
      buildings: {
        where: { phaseId: null },
        include: {
          units: {
            select: {
              id: true,
              number: true,
              type: true,
              status: true,
              area: true,
              floor: true,
            },
            orderBy: { number: "asc" },
          },
          _count: { select: { units: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) throw new Error("Project not found");
  return JSON.parse(JSON.stringify(project));
}
