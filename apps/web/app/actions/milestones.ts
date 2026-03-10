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

export async function getProjectMilestones(projectId: string) {
  const session = await requirePermission("milestones:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const milestones = await db.constructionMilestone.findMany({
    where: { projectId },
    orderBy: { milestoneNumber: "asc" },
    include: {
      certifiedBy: { select: { id: true, name: true, email: true } },
      billingItems: { select: { id: true, status: true, amountDue: true } },
    },
  });

  return JSON.parse(JSON.stringify(milestones));
}

export async function getMilestoneTimeline(projectId: string) {
  const session = await requirePermission("milestones:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const milestones = await db.constructionMilestone.findMany({
    where: { projectId },
    orderBy: { milestoneNumber: "asc" },
    select: {
      id: true,
      milestoneNumber: true,
      name: true,
      nameArabic: true,
      targetPercentage: true,
      actualPercentage: true,
      targetDate: true,
      actualDate: true,
      status: true,
      certifiedAt: true,
      paymentPercentage: true,
    },
  });

  return JSON.parse(JSON.stringify(milestones));
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createMilestone(data: {
  projectId: string;
  milestoneNumber: number;
  name: string;
  nameArabic?: string;
  description?: string;
  descriptionArabic?: string;
  targetPercentage: number;
  targetDate?: string;
  paymentPercentage?: number;
}) {
  const session = await requirePermission("milestones:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  const milestone = await db.constructionMilestone.create({
    data: {
      projectId: data.projectId,
      milestoneNumber: data.milestoneNumber,
      name: data.name,
      nameArabic: data.nameArabic,
      description: data.description,
      descriptionArabic: data.descriptionArabic,
      targetPercentage: data.targetPercentage,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      paymentPercentage: data.paymentPercentage,
      status: "UPCOMING",
    },
  });

  return JSON.parse(JSON.stringify(milestone));
}

export async function updateMilestone(
  milestoneId: string,
  data: {
    name?: string;
    nameArabic?: string;
    description?: string;
    descriptionArabic?: string;
    targetPercentage?: number;
    targetDate?: string;
    paymentPercentage?: number;
    status?: string;
  }
) {
  const session = await requirePermission("milestones:write");

  const milestone = await db.constructionMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!milestone || milestone.project.organizationId !== session.organizationId) {
    throw new Error("Milestone not found");
  }

  const updated = await db.constructionMilestone.update({
    where: { id: milestoneId },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      status: data.status as any,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

// ─── Certification (Engineering Consultant) ────────────────────────────────

export async function certifyMilestone(
  milestoneId: string,
  data: {
    actualPercentage: number;
    evidenceDocIds?: string[];
  }
) {
  const session = await requirePermission("milestones:certify");

  const milestone = await db.constructionMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!milestone || milestone.project.organizationId !== session.organizationId) {
    throw new Error("Milestone not found");
  }
  if (milestone.status === "CERTIFIED") {
    throw new Error("Milestone already certified");
  }

  const updated = await db.constructionMilestone.update({
    where: { id: milestoneId },
    data: {
      actualPercentage: data.actualPercentage,
      actualDate: new Date(),
      status: "CERTIFIED",
      certifiedById: session.userId,
      certifiedAt: new Date(),
      evidenceDocIds: data.evidenceDocIds ?? [],
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function uploadMilestoneEvidence(
  milestoneId: string,
  docIds: string[]
) {
  const session = await requirePermission("milestones:upload_evidence");

  const milestone = await db.constructionMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!milestone || milestone.project.organizationId !== session.organizationId) {
    throw new Error("Milestone not found");
  }

  const updated = await db.constructionMilestone.update({
    where: { id: milestoneId },
    data: {
      evidenceDocIds: [...milestone.evidenceDocIds, ...docIds],
    },
  });

  return JSON.parse(JSON.stringify(updated));
}
