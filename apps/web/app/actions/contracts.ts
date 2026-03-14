"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

export async function createContract(data: {
  customerId: string;
  unitId: string;
  type: "SALE" | "LEASE";
  amount: number;
  fileUrl?: string;
}) {
  const session = await requirePermission("contracts:write");

  // Verify customer belongs to org
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found");

  const contract = await db.contract.create({
    data: {
      customerId: data.customerId,
      unitId: data.unitId,
      type: data.type,
      amount: data.amount,
      fileUrl: data.fileUrl,
      userId: session.userId,
      status: "DRAFT",
    },
  });

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
    },
    orderBy: { createdAt: "desc" },
  });
  return JSON.parse(JSON.stringify(contracts));
}

export async function updateContractStatus(
  contractId: string,
  status: "SENT" | "SIGNED" | "CANCELLED" | "VOID"
) {
  const session = await requirePermission("contracts:write");

  const contract = await db.contract.findFirst({
    where: { id: contractId },
    include: { customer: true },
  });
  if (!contract || contract.customer.organizationId !== session.organizationId) {
    throw new Error("Contract not found");
  }

  const data: any = { status };
  if (status === "SIGNED") {
    data.signedAt = new Date();
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data,
  });

  // If sale contract is signed, mark unit as SOLD
  if (status === "SIGNED" && contract.type === "SALE") {
    await db.unit.update({
      where: { id: contract.unitId },
      data: { status: "SOLD" },
    });
    await db.customer.update({
      where: { id: contract.customerId },
      data: { status: "CONVERTED" },
    });

    // G11: Auto-post to escrow if project has an escrow account
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
      // Escrow posting is best-effort — don't block contract signing
    }
  }

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "Contract", resourceId: contractId, metadata: { newStatus: status }, organizationId: session.organizationId });

  revalidatePath("/dashboard/sales/contracts");
  revalidatePath("/dashboard/units");
  return JSON.parse(JSON.stringify(updated));
}
