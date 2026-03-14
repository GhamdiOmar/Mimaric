"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["SIGNED", "CANCELLED"],
  SIGNED: ["VOID"],
  CANCELLED: [],
  VOID: [],
};

const FREQUENCY_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_ANNUAL: 6,
  ANNUAL: 12,
};

async function generateContractNumber(
  organizationId: string,
  type: "SALE" | "LEASE"
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.contract.count({
    where: {
      type,
      customer: { organizationId },
      createdAt: { gte: new Date(`${year}-01-01`) },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${type}-${year}-${seq}`;
}

export async function createContract(data: {
  customerId: string;
  unitId: string;
  type: "SALE" | "LEASE";
  amount: number;
  fileUrl?: string;
  // Ejar fields (LEASE)
  startDate?: string;
  endDate?: string;
  paymentFrequency?: string;
  securityDeposit?: number;
  autoRenewal?: boolean;
  maintenanceResponsibility?: string;
  noticePeriodDays?: number;
  // Wafi/Sale fields (SALE)
  deliveryDate?: string;
  wafiLicenseRef?: string;
  escrowAccountRef?: string;
  // Shared
  notes?: string;
}) {
  const session = await requirePermission("contracts:write");

  // Validate amount
  if (!data.amount || data.amount <= 0 || !Number.isFinite(data.amount)) {
    throw new Error("Amount must be a positive number");
  }

  // Verify customer belongs to org
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found");

  // Verify unit belongs to org
  const unit = await db.unit.findFirst({
    where: { id: data.unitId },
    include: { building: { include: { project: true } } },
  });
  if (!unit || unit.building.project.organizationId !== session.organizationId) {
    throw new Error("Unit not found");
  }

  // Generate contract number
  const contractNumber = await generateContractNumber(session.organizationId, data.type);

  // Ejar validation for LEASE contracts
  if (data.type === "LEASE") {
    if (!data.startDate || !data.endDate) {
      throw new Error("Start date and end date are required for lease contracts");
    }
    if (!data.paymentFrequency) {
      throw new Error("Payment frequency is required for lease contracts");
    }
    // Security deposit max 5% per Ejar
    if (data.securityDeposit && data.securityDeposit > data.amount * 0.05) {
      throw new Error("Security deposit cannot exceed 5% of the total lease amount (Ejar regulation)");
    }
    // Default auto-renewal for leases > 3 months
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (monthsDiff > 3 && data.autoRenewal === undefined) {
      data.autoRenewal = true;
    }
    if (data.noticePeriodDays === undefined) {
      data.noticePeriodDays = 60;
    }
  }

  let contract;

  if (data.type === "LEASE" && data.startDate && data.endDate && data.paymentFrequency) {
    // Create Lease + Installments + Contract in transaction
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const freqMonths = FREQUENCY_MONTHS[data.paymentFrequency] || 1;
    const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    const installmentCount = Math.max(1, Math.ceil(totalMonths / freqMonths));
    const installmentAmount = data.amount / installmentCount;

    contract = await db.$transaction(async (tx) => {
      // Create Lease
      const lease = await tx.lease.create({
        data: {
          unitId: data.unitId,
          customerId: data.customerId,
          startDate: start,
          endDate: end,
          totalAmount: data.amount,
          status: "DRAFT",
        },
      });

      // Generate rent installments
      const installments = [];
      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(dueDate.getMonth() + i * freqMonths);
        installments.push({
          leaseId: lease.id,
          dueDate,
          amount: installmentAmount,
          status: "UNPAID" as const,
        });
      }
      await tx.rentInstallment.createMany({ data: installments });

      // Create Contract linked to Lease
      const c = await tx.contract.create({
        data: {
          customerId: data.customerId,
          unitId: data.unitId,
          type: "LEASE",
          amount: data.amount,
          fileUrl: data.fileUrl,
          userId: session.userId,
          status: "DRAFT",
          contractNumber,
          leaseId: lease.id,
          paymentFrequency: data.paymentFrequency as any,
          securityDeposit: data.securityDeposit,
          autoRenewal: data.autoRenewal,
          maintenanceResponsibility: data.maintenanceResponsibility,
          noticePeriodDays: data.noticePeriodDays,
          notes: data.notes,
        },
      });

      return c;
    });
  } else {
    // SALE contract (or LEASE without dates as fallback)
    contract = await db.contract.create({
      data: {
        customerId: data.customerId,
        unitId: data.unitId,
        type: data.type,
        amount: data.amount,
        fileUrl: data.fileUrl,
        userId: session.userId,
        status: "DRAFT",
        contractNumber,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        wafiLicenseRef: data.wafiLicenseRef,
        escrowAccountRef: data.escrowAccountRef,
        notes: data.notes,
      },
    });
  }

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "CREATE", resource: "Contract", resourceId: contract.id, organizationId: session.organizationId });

  revalidatePath("/dashboard/sales/contracts");
  return JSON.parse(JSON.stringify(contract));
}

export async function getContract(contractId: string) {
  const session = await requirePermission("contracts:read");

  const contract = await db.contract.findFirst({
    where: { id: contractId },
    include: {
      customer: true,
      unit: { include: { building: { include: { project: true } } } },
      lease: { include: { installments: { orderBy: { dueDate: "asc" } } } },
    },
  });

  if (!contract || contract.customer.organizationId !== session.organizationId) {
    throw new Error("Contract not found");
  }

  return JSON.parse(JSON.stringify(contract));
}

export async function getContracts(filters?: { status?: string; type?: string }) {
  const session = await requirePermission("contracts:read");

  const where: any = {
    customer: { organizationId: session.organizationId },
  };

  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;

  const contracts = await db.contract.findMany({
    where,
    include: {
      customer: true,
      unit: { include: { building: true } },
      lease: { select: { id: true, startDate: true, endDate: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return JSON.parse(JSON.stringify(contracts));
}

export async function updateContractStatus(
  contractId: string,
  status: "SENT" | "SIGNED" | "CANCELLED" | "VOID"
) {
  // Destructive transitions require contracts:delete permission
  const permission = (status === "CANCELLED" || status === "VOID") ? "contracts:delete" : "contracts:write";
  const session = await requirePermission(permission);

  const contract = await db.contract.findFirst({
    where: { id: contractId },
    include: { customer: true },
  });
  if (!contract || contract.customer.organizationId !== session.organizationId) {
    throw new Error("Contract not found");
  }

  // Enforce state machine
  const allowed = VALID_TRANSITIONS[contract.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Cannot transition contract from ${contract.status} to ${status}`);
  }

  const data: any = { status };
  if (status === "SIGNED") {
    data.signedAt = new Date();
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data,
  });

  // SALE contract signed → unit SOLD
  if (status === "SIGNED" && contract.type === "SALE") {
    await db.unit.update({
      where: { id: contract.unitId },
      data: { status: "SOLD" },
    });
    await db.customer.update({
      where: { id: contract.customerId },
      data: { status: "CONVERTED" },
    });

    // Auto-post to escrow
    try {
      const unit = await db.unit.findUnique({
        where: { id: contract.unitId },
        include: { building: { select: { projectId: true } } },
      });
      if (unit?.building?.projectId) {
        const escrow = await db.escrowAccount.findFirst({
          where: { projectId: unit.building.projectId },
        });
        if (escrow) {
          await db.escrowTransaction.create({
            data: {
              escrowAccountId: escrow.id,
              type: "BUYER_DEPOSIT",
              amount: contract.amount,
              description: `Sale contract signed — Unit ${unit.number}`,
              status: "PROCESSED",
            },
          });
        }
      }
    } catch {
      // Best-effort
    }
  }

  // LEASE contract signed → unit RENTED, lease ACTIVE
  if (status === "SIGNED" && contract.type === "LEASE") {
    await db.unit.update({
      where: { id: contract.unitId },
      data: { status: "RENTED" },
    });
    await db.customer.update({
      where: { id: contract.customerId },
      data: { status: "ACTIVE_TENANT" },
    });
    // Activate linked lease
    if (contract.leaseId) {
      await db.lease.update({
        where: { id: contract.leaseId },
        data: { status: "ACTIVE" },
      });
    }
  }

  // CANCELLED or VOID → free unit, revert customer
  if (status === "CANCELLED" || status === "VOID") {
    const currentUnit = await db.unit.findUnique({ where: { id: contract.unitId } });
    if (currentUnit && (currentUnit.status === "SOLD" || currentUnit.status === "RENTED")) {
      await db.unit.update({
        where: { id: contract.unitId },
        data: { status: "AVAILABLE" },
      });
    }

    // Terminate linked lease
    if (contract.leaseId) {
      await db.lease.update({
        where: { id: contract.leaseId },
        data: { status: "TERMINATED" },
      });
    }

    const otherActive = await db.contract.count({
      where: {
        customerId: contract.customerId,
        id: { not: contractId },
        status: { in: ["DRAFT", "SENT", "SIGNED"] },
      },
    });
    if (otherActive === 0) {
      await db.customer.update({
        where: { id: contract.customerId },
        data: { status: "QUALIFIED" },
      });
    }

    // Reverse escrow on VOID of signed contract
    if (status === "VOID" && contract.status === "SIGNED") {
      try {
        const unit = await db.unit.findUnique({
          where: { id: contract.unitId },
          include: { building: { select: { projectId: true } } },
        });
        if (unit?.building?.projectId) {
          const escrow = await db.escrowAccount.findFirst({
            where: { projectId: unit.building.projectId },
          });
          if (escrow) {
            await db.escrowTransaction.create({
              data: {
                escrowAccountId: escrow.id,
                type: "REFUND",
                amount: contract.amount,
                description: `Contract voided — Unit ${unit.number}`,
                status: "PROCESSED",
              },
            });
          }
        }
      } catch {
        // Best-effort
      }
    }
  }

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "Contract", resourceId: contractId, metadata: { previousStatus: contract.status, newStatus: status }, organizationId: session.organizationId });

  revalidatePath("/dashboard/sales/contracts");
  revalidatePath("/dashboard/units");
  revalidatePath("/dashboard/rentals");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteContract(contractId: string) {
  const session = await requirePermission("contracts:delete");

  const contract = await db.contract.findFirst({
    where: { id: contractId },
    include: { customer: true },
  });
  if (!contract || contract.customer.organizationId !== session.organizationId) {
    throw new Error("Contract not found");
  }

  // Only DRAFT contracts can be deleted
  if (contract.status !== "DRAFT") {
    throw new Error("Only draft contracts can be deleted. Use Cancel or Void for active contracts.");
  }

  await db.$transaction(async (tx) => {
    // Delete linked lease + installments if exists
    if (contract.leaseId) {
      await tx.rentInstallment.deleteMany({ where: { leaseId: contract.leaseId } });
      // Unlink before deleting lease
      await tx.contract.update({ where: { id: contractId }, data: { leaseId: null } });
      await tx.lease.delete({ where: { id: contract.leaseId } });
    }

    await tx.contract.delete({ where: { id: contractId } });
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "DELETE", resource: "Contract", resourceId: contractId, organizationId: session.organizationId });

  revalidatePath("/dashboard/sales/contracts");
  revalidatePath("/dashboard/units");
}
