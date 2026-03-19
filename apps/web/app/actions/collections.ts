"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { revalidatePath } from "next/cache";

// ─── RED: Collection State Machine ──────────────────────────────────────────

const COLLECTION_TRANSITIONS: Record<string, string[]> = {
  CURRENT: ["FOLLOW_UP"],
  FOLLOW_UP: ["PROMISE_TO_PAY", "ESCALATED", "SETTLED"],
  PROMISE_TO_PAY: ["FOLLOW_UP", "ESCALATED", "SETTLED"],
  ESCALATED: ["LEGAL", "SETTLED"],
  LEGAL: ["SETTLED"],
  SETTLED: [],
};

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function getCollectionCases(params?: {
  status?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await requirePermission("collections:read");

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId: session.organizationId };
  if (params?.status) where.status = params.status;
  if (params?.assignedTo) where.assignedTo = params.assignedTo;

  const [data, total] = await Promise.all([
    db.collectionCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.collectionCase.count({ where }),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createCollectionCase(contractId: string) {
  const session = await requirePermission("collections:write");

  const contract = await db.contract.findFirst({
    where: { id: contractId, unit: { building: { project: { organizationId: session.organizationId } } } },
    include: { paymentPlan: { include: { installments: true } } },
  });
  if (!contract) throw new Error("Contract not found or you don't have access. Please verify the contract exists.");

  // Calculate outstanding from overdue installments
  const now = new Date();
  const overdue = contract.paymentPlan?.installments.filter(
    (i) => i.status !== "PAID" && new Date(i.dueDate) < now
  ) ?? [];

  const totalOutstanding = overdue.reduce(
    (sum, i) => sum + (Number(i.amount) - Number(i.paidAmount ?? 0)), 0
  );

  const oldestDueDate = overdue.length > 0
    ? overdue.reduce((oldest, i) => new Date(i.dueDate) < oldest ? new Date(i.dueDate) : oldest, new Date(overdue[0]!.dueDate))
    : undefined;

  const collectionCase = await db.collectionCase.create({
    data: {
      contractId,
      customerId: contract.customerId,
      totalOutstanding,
      oldestDueDate,
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "CREATE",
    resource: "CollectionCase",
    resourceId: collectionCase.id,
    metadata: { contractId, totalOutstanding },
    organizationId: session.organizationId,
  });

  revalidatePath("/dashboard/finance/collections");
  return JSON.parse(JSON.stringify(collectionCase));
}

export async function getCollectionCaseDetail(caseId: string) {
  const session = await requirePermission("collections:read");

  const collectionCase = await db.collectionCase.findFirst({
    where: { id: caseId, organizationId: session.organizationId },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!collectionCase) throw new Error("Collection case not found or you don't have access. Please refresh and try again.");

  return JSON.parse(JSON.stringify(collectionCase));
}

export async function assignCollectionOfficer(caseId: string, userId: string) {
  const session = await requirePermission("collections:assign");

  const existing = await db.collectionCase.findFirst({
    where: { id: caseId, organizationId: session.organizationId },
  });
  if (!existing) throw new Error("Collection case not found or you don't have access. Please refresh and try again.");

  const updated = await db.collectionCase.update({
    where: { id: caseId },
    data: { assignedTo: userId },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "CollectionCase",
    resourceId: caseId,
    before: { assignedTo: existing.assignedTo },
    after: { assignedTo: userId },
    organizationId: session.organizationId,
  });

  revalidatePath("/dashboard/finance/collections");
  return JSON.parse(JSON.stringify(updated));
}

export async function logCollectionActivity(
  caseId: string,
  data: { type: string; notes?: string; nextAction?: string; nextActionDate?: string }
) {
  const session = await requirePermission("collections:write");

  const collectionCase = await db.collectionCase.findFirst({
    where: { id: caseId, organizationId: session.organizationId },
  });
  if (!collectionCase) throw new Error("Collection case not found or you don't have access. Please refresh and try again.");

  const activity = await db.collectionActivity.create({
    data: {
      collectionCaseId: caseId,
      type: data.type as any,
      notes: data.notes,
      nextAction: data.nextAction,
      nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : undefined,
      userId: session.userId,
    },
  });

  // Update case last contact
  await db.collectionCase.update({
    where: { id: caseId },
    data: {
      lastContactDate: new Date(),
      lastContactNote: data.notes,
      ...(data.type === "PROMISE" && data.nextActionDate
        ? { promiseToPayDate: new Date(data.nextActionDate) }
        : {}),
    },
  });

  return JSON.parse(JSON.stringify(activity));
}

export async function updateCollectionStatus(caseId: string, status: string) {
  const session = await requirePermission("collections:write");

  const collectionCase = await db.collectionCase.findFirst({
    where: { id: caseId, organizationId: session.organizationId },
  });
  if (!collectionCase) throw new Error("Collection case not found or you don't have access. Please refresh and try again.");

  const allowed = COLLECTION_TRANSITIONS[collectionCase.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error("This status change is not allowed from the current collection case status. Please check the allowed workflow transitions.");
  }

  const escalationLevel = status === "ESCALATED"
    ? collectionCase.escalationLevel + 1
    : status === "LEGAL" ? 3 : collectionCase.escalationLevel;

  const updated = await db.collectionCase.update({
    where: { id: caseId },
    data: { status: status as any, escalationLevel },
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "CollectionCase",
    resourceId: caseId,
    before: { status: collectionCase.status },
    after: { status },
    organizationId: session.organizationId,
  });

  revalidatePath("/dashboard/finance/collections");
  return JSON.parse(JSON.stringify(updated));
}

export async function getAgingReport() {
  const session = await requirePermission("collections:read");

  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Get all overdue installments
  const installments = await db.paymentPlanInstallment.findMany({
    where: {
      status: { not: "PAID" },
      dueDate: { lt: now },
      paymentPlan: { organizationId: session.organizationId },
    },
    include: { paymentPlan: true },
  });

  let current = 0, bucket30 = 0, bucket60 = 0, bucket90Plus = 0;

  for (const inst of installments) {
    const outstanding = Number(inst.amount) - Number(inst.paidAmount ?? 0);
    const dueDate = new Date(inst.dueDate);

    if (dueDate > day30) current += outstanding;
    else if (dueDate > day60) bucket30 += outstanding;
    else if (dueDate > day90) bucket60 += outstanding;
    else bucket90Plus += outstanding;
  }

  return {
    current,
    bucket30,
    bucket60,
    bucket90Plus,
    totalOverdue: current + bucket30 + bucket60 + bucket90Plus,
    overdueCount: installments.length,
  };
}

export async function getContractFinancialStatement(contractId: string) {
  const session = await requirePermission("finance:read");

  const contract = await db.contract.findFirst({
    where: { id: contractId, unit: { building: { project: { organizationId: session.organizationId } } } },
    include: {
      paymentPlan: { include: { installments: { orderBy: { dueDate: "asc" } } } },
    },
  });
  if (!contract) throw new Error("Contract not found or you don't have access. Please verify the contract exists.");

  const ledger: Array<{
    date: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }> = [];

  let balance = Number(contract.netAmount ?? contract.amount);

  // Initial contract entry
  ledger.push({
    date: new Date(contract.createdAt).toISOString(),
    type: "CONTRACT",
    description: `Contract ${contract.contractNumber ?? contract.id.slice(-6)} created`,
    debit: balance,
    credit: 0,
    balance,
  });

  // Payment entries
  if (contract.paymentPlan?.installments) {
    for (const inst of contract.paymentPlan.installments) {
      if (Number(inst.paidAmount ?? 0) > 0) {
        const paid = Number(inst.paidAmount);
        balance -= paid;
        ledger.push({
          date: (inst.paidAt ?? inst.updatedAt).toISOString(),
          type: "PAYMENT",
          description: `Installment #${inst.installmentNumber} payment`,
          debit: 0,
          credit: paid,
          balance,
        });
      }
    }
  }

  return JSON.parse(JSON.stringify(ledger));
}
