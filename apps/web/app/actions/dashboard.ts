"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getDashboardStats() {
  const session = await requirePermission("dashboard:read");
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

export async function getRevenueTimeline() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const now = new Date();
  const months: { month: string; rent: number; sales: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    const [rentAgg, salesAgg] = await Promise.all([
      db.rentInstallment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: start, lt: end },
          lease: { customer: { organizationId: orgId } },
        },
        _sum: { amount: true },
      }),
      db.contract.aggregate({
        where: {
          status: "SIGNED",
          type: "SALE",
          signedAt: { gte: start, lt: end },
          customer: { organizationId: orgId },
        },
        _sum: { amount: true },
      }),
    ]);

    months.push({
      month: monthKey,
      rent: Number(rentAgg._sum.amount ?? 0),
      sales: Number(salesAgg._sum.amount ?? 0),
    });
  }

  return months;
}

export async function getOccupancyByProject() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      buildings: {
        select: {
          units: {
            select: { status: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const results = projects.map((p) => {
    const allUnits = p.buildings.flatMap((b) => b.units);
    const total = allUnits.length;
    const occupied = allUnits.filter((u) =>
      ["RENTED", "SOLD"].includes(u.status)
    ).length;
    return {
      name: p.name,
      total,
      occupied,
      vacant: total - occupied,
      rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  });

  // Top 6 projects by total units, rest aggregated
  if (results.length > 6) {
    const top = results.slice(0, 6);
    const rest = results.slice(6);
    const other = rest.reduce(
      (acc, r) => ({
        name: "أخرى",
        total: acc.total + r.total,
        occupied: acc.occupied + r.occupied,
        vacant: acc.vacant + r.vacant,
        rate: 0,
      }),
      { name: "أخرى", total: 0, occupied: 0, vacant: 0, rate: 0 }
    );
    other.rate = other.total > 0 ? Math.round((other.occupied / other.total) * 100) : 0;
    return [...top, other];
  }

  return results;
}

export async function getDashboardLandStats() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const LAND_STATUSES = ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"];

  const [totalParcels, parcelsGrouped, valueAgg, activeProjects, maintenanceCostsMonth] = await Promise.all([
    db.project.count({
      where: { organizationId: orgId, status: { in: LAND_STATUSES as any } },
    }),
    db.project.groupBy({
      by: ["status"],
      where: { organizationId: orgId, status: { in: LAND_STATUSES as any } },
      _count: true,
    }),
    db.project.aggregate({
      where: { organizationId: orgId, status: { in: LAND_STATUSES as any } },
      _sum: { estimatedValueSar: true },
    }),
    db.project.count({
      where: {
        organizationId: orgId,
        status: { in: ["PLANNING", "UNDER_CONSTRUCTION", "READY"] as any },
      },
    }),
    db.maintenanceRequest.aggregate({
      where: {
        organizationId: orgId,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { actualCost: true, estimatedCost: true },
    }),
  ]);

  const pipeline = {
    identified: parcelsGrouped.find((p: any) => p.status === "LAND_IDENTIFIED")?._count ?? 0,
    underReview: parcelsGrouped.find((p: any) => p.status === "LAND_UNDER_REVIEW")?._count ?? 0,
    acquired: parcelsGrouped.find((p: any) => p.status === "LAND_ACQUIRED")?._count ?? 0,
  };

  return {
    totalParcels,
    activeProjects,
    portfolioValue: Number(valueAgg._sum.estimatedValueSar ?? 0),
    maintenanceCostsThisMonth: Number(maintenanceCostsMonth._sum.actualCost ?? maintenanceCostsMonth._sum.estimatedCost ?? 0),
    pipeline,
  };
}

export async function getProjectStatusDistribution() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const grouped = await db.project.groupBy({
    by: ["status"],
    where: {
      organizationId: orgId,
      status: { in: ["PLANNING", "UNDER_CONSTRUCTION", "READY", "HANDED_OVER"] as any },
    },
    _count: true,
  });

  return grouped.map((g: any) => ({
    status: g.status as string,
    count: g._count as number,
  }));
}

export async function getDashboardOffPlanStats() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const OFF_PLAN_STATUSES = [
    "CONCEPT_DESIGN", "SUBDIVISION_PLANNING", "AUTHORITY_SUBMISSION",
    "INFRASTRUCTURE_PLANNING", "INVENTORY_STRUCTURING", "PRICING_PACKAGING",
    "LAUNCH_READINESS", "OFF_PLAN_LAUNCHED",
  ];

  const [offPlanProjects, inventoryItems, soldItems, launchedWaves] = await Promise.all([
    db.project.findMany({
      where: { organizationId: orgId, status: { in: OFF_PLAN_STATUSES as any } },
      select: { id: true, status: true },
    }),
    db.inventoryItem.count({
      where: { organizationId: orgId },
    }),
    db.inventoryItem.findMany({
      where: { organizationId: orgId, status: "SOLD_INV" },
      select: { finalPriceSar: true, basePriceSar: true },
    }),
    db.launchWave.count({
      where: { organizationId: orgId, status: "LAUNCHED" },
    }),
  ]);

  const activeLaunches = offPlanProjects.filter(
    (p) => ["OFF_PLAN_LAUNCHED", "LAUNCH_READINESS"].includes(p.status)
  ).length;

  const pipelineValue = soldItems.reduce(
    (sum, i) => sum + Number(i.finalPriceSar ?? i.basePriceSar ?? 0), 0
  );

  const totalSold = soldItems.length;
  const conversionRate = inventoryItems > 0 ? Math.round((totalSold / inventoryItems) * 100) : 0;

  return {
    activeLaunches,
    totalInventory: inventoryItems,
    conversionRate,
    pipelineValue,
    totalOffPlanProjects: offPlanProjects.length,
    launchedWaves,
  };
}

export async function getMaintenanceCostTrend() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;
  const now = new Date();
  const months: { month: string; estimated: number; actual: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    const agg = await db.maintenanceRequest.aggregate({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lt: end },
      },
      _sum: { estimatedCost: true, actualCost: true },
    });

    months.push({
      month: monthKey,
      estimated: Number(agg._sum.estimatedCost ?? 0),
      actual: Number(agg._sum.actualCost ?? 0),
    });
  }

  return months;
}
