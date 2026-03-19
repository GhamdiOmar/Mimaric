"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { encrypt, decrypt } from "../../lib/encryption";

// ─── Helpers ───────────────────────────────────────────────────────────────

async function verifyProjectAccess(projectId: string, orgId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");
  return project;
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getEscrowAccount(projectId: string) {
  const session = await requirePermission("escrow:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const escrow = await db.escrowAccount.findUnique({
    where: { projectId },
    include: { transactions: { take: 20, orderBy: { createdAt: "desc" } } },
  });

  if (escrow) {
    (escrow as any).accountNumber = decrypt(escrow.accountNumber);
    (escrow as any).ibanNumber = decrypt(escrow.ibanNumber);
  }

  return escrow ? JSON.parse(JSON.stringify(escrow)) : null;
}

export async function getEscrowTransactions(
  escrowAccountId: string,
  filters?: { type?: string; status?: string; limit?: number; offset?: number }
) {
  const session = await requirePermission("escrow:read");

  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowAccountId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!escrow || escrow.project.organizationId !== session.organizationId) {
    throw new Error("Escrow account not found or you don't have access. Please verify the escrow account exists for this project.");
  }

  const transactions = await db.escrowTransaction.findMany({
    where: {
      escrowAccountId,
      ...(filters?.type ? { type: filters.type as any } : {}),
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
    skip: filters?.offset ?? 0,
  });

  return JSON.parse(JSON.stringify(transactions));
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createEscrowAccount(data: {
  projectId: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  ibanNumber: string;
  adminExpenseCap?: number;
}) {
  const session = await requirePermission("escrow:write");
  await verifyProjectAccess(data.projectId, session.organizationId);

  // Check if escrow already exists
  const existing = await db.escrowAccount.findUnique({
    where: { projectId: data.projectId },
  });
  if (existing) throw new Error("An escrow account already exists for this project. Each project can only have one escrow account.");

  const escrow = await db.escrowAccount.create({
    data: {
      projectId: data.projectId,
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountNumber: encrypt(data.accountNumber),
      ibanNumber: encrypt(data.ibanNumber),
      adminExpenseCap: data.adminExpenseCap,
      status: "PENDING_SETUP",
    },
  });

  return JSON.parse(JSON.stringify(escrow));
}

export async function recordEscrowDeposit(data: {
  escrowAccountId: string;
  amount: number;
  description?: string;
  descriptionAr?: string;
  referenceNumber?: string;
  milestoneId?: string;
}) {
  const session = await requirePermission("escrow:write");

  const escrow = await db.escrowAccount.findUnique({
    where: { id: data.escrowAccountId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!escrow || escrow.project.organizationId !== session.organizationId) {
    throw new Error("Escrow account not found or you don't have access. Please verify the escrow account exists for this project.");
  }

  const [transaction] = await db.$transaction([
    db.escrowTransaction.create({
      data: {
        escrowAccountId: data.escrowAccountId,
        type: "BUYER_DEPOSIT",
        amount: data.amount,
        description: data.description,
        descriptionAr: data.descriptionAr,
        referenceNumber: data.referenceNumber,
        milestoneId: data.milestoneId,
        status: "PROCESSED",
        processedAt: new Date(),
      },
    }),
    db.escrowAccount.update({
      where: { id: data.escrowAccountId },
      data: {
        totalDeposited: { increment: data.amount },
        currentBalance: { increment: data.amount },
        status: "ACTIVE",
      },
    }),
  ]);

  return JSON.parse(JSON.stringify(transaction));
}

export async function requestEscrowWithdrawal(data: {
  escrowAccountId: string;
  amount: number;
  type: "CONTRACTOR_PAYMENT" | "ADMIN_EXPENSE" | "RETENTION_RELEASE" | "REFUND";
  description?: string;
  descriptionAr?: string;
  milestoneId?: string;
  engineerCertId?: string;
}) {
  const session = await requirePermission("escrow:write");

  const escrow = await db.escrowAccount.findUnique({
    where: { id: data.escrowAccountId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!escrow || escrow.project.organizationId !== session.organizationId) {
    throw new Error("Escrow account not found or you don't have access. Please verify the escrow account exists for this project.");
  }

  // Validate admin expense cap (20% rule)
  if (data.type === "ADMIN_EXPENSE" && escrow.adminExpenseCap) {
    const newTotal = Number(escrow.adminExpenseUsed) + data.amount;
    if (newTotal > Number(escrow.adminExpenseCap)) {
      throw new Error("This withdrawal would exceed the 20% administrative expense cap. Please reduce the amount or request a cap increase.");
    }
  }

  // Validate sufficient balance
  if (data.amount > Number(escrow.currentBalance)) {
    throw new Error("Insufficient escrow balance to process this withdrawal. Please verify the available balance.");
  }

  const transaction = await db.escrowTransaction.create({
    data: {
      escrowAccountId: data.escrowAccountId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      descriptionAr: data.descriptionAr,
      milestoneId: data.milestoneId,
      engineerCertId: data.engineerCertId,
      status: "AWAITING_APPROVAL",
    },
  });

  return JSON.parse(JSON.stringify(transaction));
}

export async function approveEscrowWithdrawal(txnId: string) {
  const session = await requirePermission("escrow:approve");

  const txn = await db.escrowTransaction.findUnique({
    where: { id: txnId },
    include: {
      escrowAccount: {
        include: { project: { select: { organizationId: true } } },
      },
    },
  });
  if (!txn || txn.escrowAccount.project.organizationId !== session.organizationId) {
    throw new Error("Transaction not found or you don't have access. Please refresh and try again.");
  }
  if (txn.status !== "AWAITING_APPROVAL") {
    throw new Error("This transaction has already been processed and is no longer awaiting approval.");
  }

  const escrow = txn.escrowAccount;
  const updateData: any = {
    totalWithdrawn: { increment: Number(txn.amount) },
    currentBalance: { decrement: Number(txn.amount) },
  };

  // Track admin expenses
  if (txn.type === "ADMIN_EXPENSE") {
    updateData.adminExpenseUsed = { increment: Number(txn.amount) };
  }

  // Track retention
  if (txn.type === "RETENTION_HOLD") {
    updateData.retentionAmount = { increment: Number(txn.amount) };
  }

  await db.$transaction([
    db.escrowTransaction.update({
      where: { id: txnId },
      data: { status: "APPROVED", processedAt: new Date() },
    }),
    db.escrowAccount.update({
      where: { id: escrow.id },
      data: updateData,
    }),
  ]);

  return { success: true };
}

export async function validateAdminExpenseCap(escrowId: string, amount: number) {
  const session = await requirePermission("escrow:read");

  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowId },
    include: { project: { select: { organizationId: true } } },
  });
  if (!escrow || escrow.project.organizationId !== session.organizationId) {
    throw new Error("Escrow account not found or you don't have access. Please verify the escrow account exists for this project.");
  }

  const cap = Number(escrow.adminExpenseCap ?? 0);
  const used = Number(escrow.adminExpenseUsed);
  const remaining = cap - used;

  return {
    cap,
    used,
    remaining,
    wouldExceed: amount > remaining,
    percentageUsed: cap > 0 ? Math.round((used / cap) * 100) : 0,
  };
}

export async function getRetentionStatus(projectId: string) {
  const session = await requirePermission("escrow:read");
  await verifyProjectAccess(projectId, session.organizationId);

  const escrow = await db.escrowAccount.findUnique({
    where: { projectId },
  });
  if (!escrow) return null;

  return JSON.parse(JSON.stringify({
    retentionAmount: escrow.retentionAmount,
    retentionReleaseDate: escrow.retentionReleaseDate,
    isReleasable: escrow.retentionReleaseDate
      ? new Date() >= new Date(escrow.retentionReleaseDate)
      : false,
  }));
}
