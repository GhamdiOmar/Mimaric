"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function createLease(data: {
  unitId: string;
  customerId: string;
  startDate: string; // ISO date string
  endDate: string;
  totalAmount: number;
  installmentCount: number; // e.g., 12 for monthly, 4 for quarterly
}) {
  const session = await getSessionOrThrow();

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

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const installmentAmount = Math.round((data.totalAmount / data.installmentCount) * 100) / 100;

  // Create lease + installments in transaction
  const lease = await db.$transaction(async (tx: any) => {
    const newLease = await tx.lease.create({
      data: {
        unitId: data.unitId,
        customerId: data.customerId,
        startDate,
        endDate,
        totalAmount: data.totalAmount,
        status: "ACTIVE",
      },
    });

    // Generate installments
    const installments = [];
    for (let i = 0; i < data.installmentCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        leaseId: newLease.id,
        dueDate,
        amount: installmentAmount,
        status: "UNPAID" as const,
      });
    }

    await tx.rentInstallment.createMany({ data: installments });

    // Update unit status to RENTED
    await tx.unit.update({
      where: { id: data.unitId },
      data: { status: "RENTED" },
    });

    // Update customer status to ACTIVE_TENANT
    await tx.customer.update({
      where: { id: data.customerId },
      data: { status: "ACTIVE_TENANT" },
    });

    return newLease;
  });

  revalidatePath("/dashboard/rentals");
  revalidatePath("/dashboard/units");
  return lease;
}

export async function getLeases(filters?: { status?: string }) {
  const session = await getSessionOrThrow();

  const where: any = {
    customer: { organizationId: session.organizationId },
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  const results = await db.lease.findMany({
    where,
    include: {
      unit: { include: { building: { include: { project: true } } } },
      customer: true,
      installments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal/Date for client components
  return JSON.parse(JSON.stringify(results));
}

export async function terminateLease(leaseId: string) {
  const session = await getSessionOrThrow();

  const lease = await db.lease.findFirst({
    where: { id: leaseId },
    include: { customer: true },
  });
  if (!lease || lease.customer.organizationId !== session.organizationId) {
    throw new Error("Lease not found");
  }

  await db.$transaction(async (tx: any) => {
    await tx.lease.update({
      where: { id: leaseId },
      data: { status: "TERMINATED" },
    });

    // Free the unit
    await tx.unit.update({
      where: { id: lease.unitId },
      data: { status: "AVAILABLE" },
    });

    // Update customer status
    await tx.customer.update({
      where: { id: lease.customerId },
      data: { status: "PAST_TENANT" },
    });
  });

  revalidatePath("/dashboard/rentals");
  revalidatePath("/dashboard/units");
}
