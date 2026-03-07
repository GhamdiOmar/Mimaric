"use server";

import { db } from "@repo/db";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function getDashboardStats() {
  const session = await getSessionOrThrow();
  const orgId = session.organizationId;

  // Run all queries in parallel
  const [
    totalUnits,
    unitsByStatus,
    activeLeases,
    totalRentCollected,
    pendingRent,
    customerCount,
    newCustomersThisMonth,
    openMaintenanceCount,
  ] = await Promise.all([
    // Total units across org's projects
    db.unit.count({
      where: { building: { project: { organizationId: orgId } } },
    }),

    // Units grouped by status
    db.unit.groupBy({
      by: ["status"],
      where: { building: { project: { organizationId: orgId } } },
      _count: true,
    }),

    // Active leases
    db.lease.count({
      where: {
        status: "ACTIVE",
        customer: { organizationId: orgId },
      },
    }),

    // Total rent collected (paid installments)
    db.rentInstallment.aggregate({
      where: {
        status: "PAID",
        lease: { customer: { organizationId: orgId } },
      },
      _sum: { amount: true },
    }),

    // Pending rent (unpaid + overdue installments)
    db.rentInstallment.aggregate({
      where: {
        status: { in: ["UNPAID", "OVERDUE"] },
        lease: { customer: { organizationId: orgId } },
      },
      _sum: { amount: true },
    }),

    // Total customers
    db.customer.count({ where: { organizationId: orgId } }),

    // New customers this month
    db.customer.count({
      where: {
        organizationId: orgId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // Open maintenance requests
    db.maintenanceRequest.count({
      where: {
        organizationId: orgId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
  ]);

  // Calculate occupancy
  const rentedCount = unitsByStatus.find((u) => u.status === "RENTED")?._count ?? 0;
  const occupancyRate = totalUnits > 0 ? Math.round((rentedCount / totalUnits) * 100) : 0;

  return {
    totalUnits,
    unitsByStatus: Object.fromEntries(
      unitsByStatus.map((u) => [u.status, u._count])
    ),
    occupancyRate,
    activeLeases,
    totalRentCollected: Number(totalRentCollected._sum.amount ?? 0),
    pendingRent: Number(pendingRent._sum.amount ?? 0),
    customerCount,
    newCustomersThisMonth,
    openMaintenanceCount,
  };
}
