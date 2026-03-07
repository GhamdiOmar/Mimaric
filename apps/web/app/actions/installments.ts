"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function getInstallments(filters?: {
  status?: string;
  leaseId?: string;
}) {
  const session = await getSessionOrThrow();

  const where: any = {
    lease: { customer: { organizationId: session.organizationId } },
  };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.leaseId) {
    where.leaseId = filters.leaseId;
  }

  const results = await db.rentInstallment.findMany({
    where,
    include: {
      lease: {
        include: {
          customer: true,
          unit: { include: { building: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Serialize Decimal/Date for client components
  return JSON.parse(JSON.stringify(results));
}

export async function recordPayment(
  installmentId: string,
  data: {
    paymentMethod: string;
    amount?: number; // For partial payments
  }
) {
  const session = await getSessionOrThrow();

  // Verify installment belongs to org
  const installment = await db.rentInstallment.findFirst({
    where: { id: installmentId },
    include: { lease: { include: { customer: true } } },
  });
  if (!installment || installment.lease.customer.organizationId !== session.organizationId) {
    throw new Error("Installment not found");
  }

  const updated = await db.rentInstallment.update({
    where: { id: installmentId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: data.paymentMethod,
    },
  });

  revalidatePath("/dashboard/rentals/payments");
  revalidatePath("/dashboard/finance");
  return JSON.parse(JSON.stringify(updated));
}

export async function markOverdueInstallments() {
  const session = await getSessionOrThrow();

  const result = await db.rentInstallment.updateMany({
    where: {
      status: "UNPAID",
      dueDate: { lt: new Date() },
      lease: { customer: { organizationId: session.organizationId } },
    },
    data: { status: "OVERDUE" },
  });

  revalidatePath("/dashboard/rentals/payments");
  return result.count;
}
