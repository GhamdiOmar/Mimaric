"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

async function verifyProjectAccess(projectId: string, orgId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");
  return project;
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getEtmamRegistration(projectId: string) {
  const session = await requirePermission("etmam:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
    include: {
      etmamRegistration: {
        include: {
          syncLogs: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!license?.etmamRegistration) return null;
  return JSON.parse(JSON.stringify(license.etmamRegistration));
}

export async function getEtmamSyncHistory(
  projectId: string,
  options?: { limit?: number; syncType?: string }
) {
  const session = await requirePermission("etmam:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
    include: { etmamRegistration: { select: { id: true } } },
  });
  if (!license?.etmamRegistration) return [];

  const logs = await db.etmamSyncLog.findMany({
    where: {
      etmamRegistrationId: license.etmamRegistration.id,
      ...(options?.syncType ? { syncType: options.syncType as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });

  return JSON.parse(JSON.stringify(logs));
}

export async function getNextSyncSchedule(projectId: string) {
  const session = await requirePermission("etmam:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
    include: { etmamRegistration: { select: { nextSyncDue: true, lastSyncAt: true } } },
  });

  if (!license?.etmamRegistration) return null;

  const reg = license.etmamRegistration;
  return {
    lastSyncAt: reg.lastSyncAt,
    nextSyncDue: reg.nextSyncDue,
    isOverdue: reg.nextSyncDue ? new Date() > new Date(reg.nextSyncDue) : false,
  };
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function registerWithEtmam(projectId: string) {
  const session = await requirePermission("etmam:write");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
  });
  if (!license) throw new Error("Wafi license not found. Apply for license first.");
  if (license.status !== "APPROVED") {
    throw new Error("Wafi license must be approved before Etmam registration");
  }

  const existing = await db.etmamRegistration.findUnique({
    where: { wafiLicenseId: license.id },
  });
  if (existing) throw new Error("Already registered with Etmam");

  // Calculate next quarterly sync date
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const nextQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 1);

  const registration = await db.etmamRegistration.create({
    data: {
      wafiLicenseId: license.id,
      registrationStatus: "PENDING",
      nextSyncDue: nextQuarter,
    },
  });

  return JSON.parse(JSON.stringify(registration));
}

export async function triggerEtmamSync(
  projectId: string,
  syncType: string
) {
  const session = await requirePermission("etmam:sync");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
    include: { etmamRegistration: true },
  });
  if (!license?.etmamRegistration) {
    throw new Error("Not registered with Etmam");
  }

  const reg = license.etmamRegistration;

  // Create sync log entry
  const syncLog = await db.etmamSyncLog.create({
    data: {
      etmamRegistrationId: reg.id,
      syncType: syncType as any,
      direction: "PUSH",
      status: "IN_PROGRESS",
    },
  });

  // Simulate sync (in production, this would call Etmam API)
  try {
    // Build report payload based on sync type
    const payload = await buildSyncPayload(projectId, syncType);

    await db.etmamSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        requestPayload: payload,
        responsePayload: { status: "received", timestamp: new Date().toISOString() },
        completedAt: new Date(),
      },
    });

    // Update next sync date
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const nextQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 1);

    await db.etmamRegistration.update({
      where: { id: reg.id },
      data: {
        lastSyncAt: new Date(),
        nextSyncDue: nextQuarter,
      },
    });

    return JSON.parse(JSON.stringify({ ...syncLog, status: "SUCCESS" }));
  } catch (error: any) {
    await db.etmamSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });

    throw new Error(`Etmam sync failed: ${error.message}`);
  }
}

async function buildSyncPayload(projectId: string, syncType: string) {
  switch (syncType) {
    case "QUARTERLY_ESCROW_STATEMENT": {
      const escrow = await db.escrowAccount.findUnique({
        where: { projectId },
      });
      return {
        type: syncType,
        projectId,
        escrowBalance: escrow?.currentBalance ?? 0,
        totalDeposited: escrow?.totalDeposited ?? 0,
        totalWithdrawn: escrow?.totalWithdrawn ?? 0,
        retentionAmount: escrow?.retentionAmount ?? 0,
        adminExpenseUsed: escrow?.adminExpenseUsed ?? 0,
        generatedAt: new Date().toISOString(),
      };
    }
    case "CONSTRUCTION_PROGRESS": {
      const milestones = await db.constructionMilestone.findMany({
        where: { projectId },
        orderBy: { milestoneNumber: "asc" },
      });
      return {
        type: syncType,
        projectId,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter((m) => m.status === "CERTIFIED").length,
        overallProgress:
          milestones.length > 0
            ? Math.round(
                milestones.reduce((acc, m) => acc + (m.actualPercentage ?? 0), 0) /
                  milestones.length
              )
            : 0,
        milestones: milestones.map((m) => ({
          number: m.milestoneNumber,
          name: m.name,
          status: m.status,
          targetPercentage: m.targetPercentage,
          actualPercentage: m.actualPercentage,
        })),
        generatedAt: new Date().toISOString(),
      };
    }
    case "UNIT_SALES_UPDATE": {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          buildings: {
            include: {
              units: {
                select: { id: true, status: true, price: true },
              },
            },
          },
        },
      });
      const allUnits = project?.buildings.flatMap((b) => b.units) ?? [];
      return {
        type: syncType,
        projectId,
        totalUnits: allUnits.length,
        soldUnits: allUnits.filter((u) => u.status === "SOLD").length,
        reservedUnits: allUnits.filter((u) => u.status === "RESERVED").length,
        availableUnits: allUnits.filter((u) => u.status === "AVAILABLE").length,
        generatedAt: new Date().toISOString(),
      };
    }
    default:
      return { type: syncType, projectId, generatedAt: new Date().toISOString() };
  }
}

export async function generateQuarterlyReport(projectId: string) {
  const session = await requirePermission("etmam:write");
  await verifyProjectAccess(projectId, session.organizationId);

  // Aggregate all data needed for quarterly report
  const [escrowPayload, progressPayload, salesPayload] = await Promise.all([
    buildSyncPayload(projectId, "QUARTERLY_ESCROW_STATEMENT"),
    buildSyncPayload(projectId, "CONSTRUCTION_PROGRESS"),
    buildSyncPayload(projectId, "UNIT_SALES_UPDATE"),
  ]);

  return {
    projectId,
    quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
    escrow: escrowPayload,
    construction: progressPayload,
    sales: salesPayload,
    generatedAt: new Date().toISOString(),
  };
}
