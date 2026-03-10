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

export async function getWafiLicense(projectId: string) {
  const session = await requirePermission("wafi_license:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
    include: { etmamRegistration: true },
  });

  return license ? JSON.parse(JSON.stringify(license)) : null;
}

export async function getDeveloperScoreBreakdown(projectId: string) {
  const session = await requirePermission("wafi_license:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
  });

  if (!license) return null;

  // Score breakdown (REGA criteria — minimum 35 out of 100)
  return {
    score: license.developerScore,
    minimumRequired: 35,
    isQualified: (license.developerScore ?? 0) >= 35,
    breakdown: {
      financialCapacity: null, // To be implemented from financial data
      previousProjects: null,
      teamExperience: null,
      complianceHistory: null,
    },
  };
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createWafiLicense(data: {
  projectId: string;
  licenseNumber?: string;
  regaReference?: string;
  developerScore?: number;
  registrationFee?: number;
}) {
  const session = await requirePermission("wafi_license:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  const existing = await db.wafiLicense.findUnique({
    where: { projectId: data.projectId },
  });
  if (existing) throw new Error("Wafi license already exists for this project");

  const license = await db.wafiLicense.create({
    data: {
      projectId: data.projectId,
      licenseNumber: data.licenseNumber,
      regaReference: data.regaReference,
      developerScore: data.developerScore,
      registrationFee: data.registrationFee,
      status: "NOT_APPLIED",
    },
  });

  return JSON.parse(JSON.stringify(license));
}

export async function updateWafiLicense(
  projectId: string,
  data: {
    licenseNumber?: string;
    regaReference?: string;
    developerScore?: number;
    registrationFee?: number;
    status?: string;
  }
) {
  const session = await requirePermission("wafi_license:write");
  await verifyProjectAccess(projectId, session.organizationId);

  const license = await db.wafiLicense.findUnique({
    where: { projectId },
  });
  if (!license) throw new Error("Wafi license not found");

  const updated = await db.wafiLicense.update({
    where: { projectId },
    data: {
      ...data,
      status: data.status as any,
      ...(data.status === "SUBMITTED" ? { appliedAt: new Date() } : {}),
      ...(data.status === "APPROVED" ? { approvedAt: new Date() } : {}),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}
