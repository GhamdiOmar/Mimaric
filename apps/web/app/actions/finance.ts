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

export async function getMaintenanceCostSummary() {
  const session = await requirePermission("finance:read");
  const orgId = session.organizationId;

  const requests = await db.maintenanceRequest.findMany({
    where: { organizationId: orgId },
    select: { estimatedCost: true, actualCost: true, category: true },
  });

  const totalEstimated = requests.reduce((s, r) => s + Number(r.estimatedCost ?? 0), 0);
  const totalActual = requests.reduce((s, r) => s + Number(r.actualCost ?? 0), 0);

  const byCategory: Record<string, number> = {};
  requests.forEach(r => {
    const cat = r.category;
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(r.actualCost ?? r.estimatedCost ?? 0);
  });

  return { totalEstimated, totalActual, byCategory };
}

export async function getUnitRevenueBreakdown() {
  const session = await requirePermission("finance:read");
  const orgId = session.organizationId;

  const units = await db.unit.findMany({
    where: { building: { project: { organizationId: orgId } } },
    include: {
      building: { select: { name: true } },
      leases: {
        where: { status: "ACTIVE" },
        include: { installments: { where: { status: "PAID" }, select: { amount: true } } },
      },
      maintenanceRequests: {
        select: { actualCost: true, estimatedCost: true },
      },
    },
  });

  return JSON.parse(JSON.stringify(
    units.map(u => {
      const rentIncome = u.leases.reduce((s, l) =>
        s + l.installments.reduce((is, i) => is + Number(i.amount), 0), 0);
      const maintenanceCost = u.maintenanceRequests.reduce((s, m) =>
        s + Number(m.actualCost ?? m.estimatedCost ?? 0), 0);
      return {
        id: u.id,
        number: u.number,
        building: u.building.name,
        rentIncome,
        maintenanceCost,
        netIncome: rentIncome - maintenanceCost,
      };
    }).filter(u => u.rentIncome > 0 || u.maintenanceCost > 0)
  ));
}

export async function getLandInvestmentSummary() {
  const session = await requirePermission("finance:read");
  const orgId = session.organizationId;

  const lands = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"] as any },
    },
    select: { acquisitionPrice: true, estimatedValueSar: true },
  });

  const totalAcquisitionCost = lands.reduce((s, l) => s + Number(l.acquisitionPrice ?? 0), 0);
  const totalEstimatedValue = lands.reduce((s, l) => s + Number(l.estimatedValueSar ?? 0), 0);
  const unrealizedGainLoss = totalEstimatedValue - totalAcquisitionCost;

  return { totalAcquisitionCost, totalEstimatedValue, unrealizedGainLoss };
}
