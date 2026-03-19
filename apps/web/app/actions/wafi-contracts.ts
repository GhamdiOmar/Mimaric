"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

async function verifyProjectAccess(projectId: string, orgId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");
  return project;
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getProjectWafiContracts(projectId: string) {
  const session = await requirePermission("wafi_contracts:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const contracts = await db.wafiContract.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(contracts));
}

export async function getWafiContractByContract(contractId: string) {
  const session = await requirePermission("wafi_contracts:read");

  const wafiContract = await db.wafiContract.findUnique({
    where: { contractId },
    include: { project: { select: { organizationId: true } } },
  });

  if (!wafiContract || wafiContract.project.organizationId !== session.organizationId) {
    return null;
  }

  return JSON.parse(JSON.stringify(wafiContract));
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createWafiContract(data: {
  contractId: string;
  projectId: string;
  escrowAccountRef?: string;
  handoverDate: string;
  delayCompensationType?: string;
  delayCompensationRate?: number;
  paymentSchedule?: any;
  alternativeDeveloperClause?: boolean;
}) {
  const session = await requirePermission("wafi_contracts:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  const contract = await db.wafiContract.create({
    data: {
      contractId: data.contractId,
      projectId: data.projectId,
      escrowAccountRef: data.escrowAccountRef,
      handoverDate: new Date(data.handoverDate),
      delayCompensationType: data.delayCompensationType ?? "PERCENTAGE",
      delayCompensationRate: data.delayCompensationRate ?? 2.0,
      paymentSchedule: data.paymentSchedule,
      alternativeDeveloperClause: data.alternativeDeveloperClause ?? true,
    },
  });

  return JSON.parse(JSON.stringify(contract));
}

export async function updateWafiContract(
  wafiContractId: string,
  data: {
    handoverDate?: string;
    delayCompensationType?: string;
    delayCompensationRate?: number;
    paymentSchedule?: any;
    alternativeDeveloperClause?: boolean;
  }
) {
  const session = await requirePermission("wafi_contracts:write");

  const existing = await db.wafiContract.findUnique({
    where: { id: wafiContractId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!existing || existing.project.organizationId !== session.organizationId) {
    throw new Error("Wafi contract not found or you don't have access. Please refresh and try again.");
  }

  const updated = await db.wafiContract.update({
    where: { id: wafiContractId },
    data: {
      ...(data.handoverDate ? { handoverDate: new Date(data.handoverDate) } : {}),
      ...(data.delayCompensationType ? { delayCompensationType: data.delayCompensationType } : {}),
      ...(data.delayCompensationRate !== undefined ? { delayCompensationRate: data.delayCompensationRate } : {}),
      ...(data.paymentSchedule ? { paymentSchedule: data.paymentSchedule } : {}),
      ...(data.alternativeDeveloperClause !== undefined ? { alternativeDeveloperClause: data.alternativeDeveloperClause } : {}),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

// ─── Delay Penalties ──────────────────────────────────────────────────────

export async function calculateDelayPenalty(
  projectId: string,
  contractId?: string
) {
  const session = await requirePermission("delay_penalties:read");
  await verifyProjectAccess(projectId, session.organizationId);

  // Get Wafi contract(s) for the project
  const wafiContracts = await db.wafiContract.findMany({
    where: {
      projectId,
      ...(contractId ? { contractId } : {}),
    },
  });

  const now = new Date();
  const penalties = wafiContracts
    .filter((wc) => new Date(wc.handoverDate) < now)
    .map((wc) => {
      const delayDays = Math.floor(
        (now.getTime() - new Date(wc.handoverDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        contractId: wc.contractId,
        handoverDate: wc.handoverDate,
        delayDays,
        compensationType: wc.delayCompensationType,
        rate: wc.delayCompensationRate,
      };
    });

  return JSON.parse(JSON.stringify(penalties));
}

export async function recordDelayPenalty(data: {
  projectId: string;
  contractId?: string;
  penaltyType: string;
  rate: number;
  calculatedAmount?: number;
  periodStart: string;
  periodEnd?: string;
  notes?: string;
  notesArabic?: string;
}) {
  const session = await requirePermission("delay_penalties:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  const penalty = await db.delayPenalty.create({
    data: {
      projectId: data.projectId,
      contractId: data.contractId,
      penaltyType: data.penaltyType,
      rate: data.rate,
      calculatedAmount: data.calculatedAmount,
      periodStart: new Date(data.periodStart),
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
      notes: data.notes,
      notesArabic: data.notesArabic,
      status: "ACTIVE",
    },
  });

  return JSON.parse(JSON.stringify(penalty));
}

export async function getProjectDelayPenalties(projectId: string) {
  const session = await requirePermission("delay_penalties:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const penalties = await db.delayPenalty.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(penalties));
}

// ─── Milestone Billing ────────────────────────────────────────────────────

export async function generateMilestoneBilling(milestoneId: string) {
  const session = await requirePermission("milestones:write");

  const milestone = await db.constructionMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: { select: { id: true, organizationId: true } } },
  });
  if (!milestone || milestone.project.organizationId !== session.organizationId) {
    throw new Error("Milestone not found. Please refresh and try again.");
  }
  if (milestone.status !== "CERTIFIED") {
    throw new Error("This milestone must be certified by an engineer before billing can be generated.");
  }

  // Get all Wafi contracts for this project
  const wafiContracts = await db.wafiContract.findMany({
    where: { projectId: milestone.project.id },
  });

  const billingItems = [];
  for (const wc of wafiContracts) {
    const schedule = (wc.paymentSchedule as any[]) ?? [];
    const milestoneEntry = schedule.find(
      (s: any) => s.milestoneNumber === milestone.milestoneNumber
    );
    if (!milestoneEntry) continue;

    const item = await db.milestoneBillingItem.create({
      data: {
        milestoneId,
        contractId: wc.contractId,
        customerId: "", // Will be populated from contract
        amountDue: milestoneEntry.amount ?? 0,
        dueDate: new Date(),
        status: "DUE",
      },
    });
    billingItems.push(item);
  }

  return JSON.parse(JSON.stringify(billingItems));
}

export async function getMilestonePaymentSchedule(projectId: string) {
  const session = await requirePermission("milestones:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const milestones = await db.constructionMilestone.findMany({
    where: { projectId },
    orderBy: { milestoneNumber: "asc" },
    include: {
      billingItems: {
        select: {
          id: true,
          contractId: true,
          amountDue: true,
          status: true,
          dueDate: true,
          paidAt: true,
        },
      },
    },
  });

  return JSON.parse(JSON.stringify(milestones));
}
