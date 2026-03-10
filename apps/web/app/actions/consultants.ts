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

export async function getProjectConsultants(projectId: string) {
  const session = await requirePermission("consultant:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const assignments = await db.consultantAssignment.findMany({
    where: { projectId },
    include: {
      consultant: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return JSON.parse(JSON.stringify(assignments));
}

export async function getConsultantDetails(consultantId: string) {
  const session = await requirePermission("consultant:read");

  const consultant = await db.engineeringConsultant.findUnique({
    where: { id: consultantId },
    include: {
      user: { select: { id: true, name: true, email: true, organizationId: true } },
      assignments: {
        include: {
          project: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!consultant) throw new Error("Consultant not found");
  return JSON.parse(JSON.stringify(consultant));
}

/** For ENGINEERING_CONSULTANT role — get their own assigned projects */
export async function getAssignedProjects() {
  const session = await requirePermission("milestones:certify");

  const assignments = await db.consultantAssignment.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          city: true,
          district: true,
          totalAreaSqm: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return JSON.parse(JSON.stringify(assignments));
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createConsultantProfile(data: {
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  firmName?: string;
  firmNameArabic?: string;
  firmCrNumber?: string;
  specialization?: string;
}) {
  const session = await requirePermission("consultant:write");

  // Verify user belongs to same org
  const user = await db.user.findFirst({
    where: { id: data.userId, organizationId: session.organizationId },
  });
  if (!user) throw new Error("User not found in organization");

  const consultant = await db.engineeringConsultant.create({
    data: {
      userId: data.userId,
      licenseNumber: data.licenseNumber,
      licenseExpiry: new Date(data.licenseExpiry),
      firmName: data.firmName,
      firmNameArabic: data.firmNameArabic,
      firmCrNumber: data.firmCrNumber,
      specialization: data.specialization,
    },
  });

  return JSON.parse(JSON.stringify(consultant));
}

export async function assignConsultant(data: {
  consultantId: string;
  projectId: string;
}) {
  const session = await requirePermission("consultant:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  const consultant = await db.engineeringConsultant.findUnique({
    where: { id: data.consultantId },
    include: { user: { select: { id: true, organizationId: true } } },
  });
  if (!consultant) throw new Error("Consultant not found");

  const assignment = await db.consultantAssignment.create({
    data: {
      consultantId: data.consultantId,
      userId: consultant.user.id,
      projectId: data.projectId,
      status: "ACTIVE",
    },
  });

  return JSON.parse(JSON.stringify(assignment));
}

export async function revokeConsultant(assignmentId: string, reason?: string) {
  const session = await requirePermission("consultant:write");

  const assignment = await db.consultantAssignment.findUnique({
    where: { id: assignmentId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!assignment || assignment.project.organizationId !== session.organizationId) {
    throw new Error("Assignment not found");
  }

  const updated = await db.consultantAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

/** Helper: verify the current user has consultant access to a project */
export async function requireConsultantAccess(projectId: string) {
  const session = await requirePermission("milestones:certify");

  const assignment = await db.consultantAssignment.findFirst({
    where: {
      userId: session.userId,
      projectId,
      status: "ACTIVE",
    },
  });

  if (!assignment) {
    throw new Error("You are not assigned to this project as an engineering consultant");
  }

  return assignment;
}
