"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getFinanceStats() {
  const session = await requirePermission("finance:read");
  const orgId = session.organizationId;

  // Get all installments for this org
  const installments = await db.rentInstallment.findMany({
    where: {
      lease: { customer: { organizationId: orgId } },
    },
    select: { amount: true, status: true, paidAt: true, dueDate: true },
  });

  // Get contract amounts (sale revenue)
  const contracts = await db.contract.findMany({
    where: {
      customer: { organizationId: orgId },
      status: "SIGNED",
    },
    select: { amount: true, signedAt: true },
  });

  const totalRentRevenue = installments
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalSaleRevenue = contracts.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalRevenue = totalRentRevenue + totalSaleRevenue;

  const pendingInvoices = installments
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const overdueAmount = installments
    .filter((i) => i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const paidCount = installments.filter((i) => i.status === "PAID").length;
  const totalCount = installments.length;
  const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return {
    totalRevenue,
    totalRentRevenue,
    totalSaleRevenue,
    pendingInvoices,
    overdueAmount,
    collectionRate,
    installmentCount: totalCount,
    paidCount,
  };
}
