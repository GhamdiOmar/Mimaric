"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getRevenueReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Previous period for comparison
  const duration = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - duration);
  const prevEnd = new Date(start);

  const [rentAgg, salesAgg, prevRentAgg, prevSalesAgg] = await Promise.all([
    db.rentInstallment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: start, lte: end },
        lease: { customer: { organizationId: orgId } },
      },
      _sum: { amount: true },
    }),
    db.contract.aggregate({
      where: {
        status: "SIGNED",
        type: "SALE",
        signedAt: { gte: start, lte: end },
        customer: { organizationId: orgId },
      },
      _sum: { amount: true },
    }),
    db.rentInstallment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: prevStart, lt: prevEnd },
        lease: { customer: { organizationId: orgId } },
      },
      _sum: { amount: true },
    }),
    db.contract.aggregate({
      where: {
        status: "SIGNED",
        type: "SALE",
        signedAt: { gte: prevStart, lt: prevEnd },
        customer: { organizationId: orgId },
      },
      _sum: { amount: true },
    }),
  ]);

  const rentTotal = Number(rentAgg._sum.amount ?? 0);
  const salesTotal = Number(salesAgg._sum.amount ?? 0);
  const combined = rentTotal + salesTotal;
  const prevCombined = Number(prevRentAgg._sum.amount ?? 0) + Number(prevSalesAgg._sum.amount ?? 0);
  const changePercent = prevCombined > 0 ? Math.round(((combined - prevCombined) / prevCombined) * 100) : 0;

  // Monthly breakdown
  const months: { month: string; rent: number; sales: number; total: number }[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

    const [mRent, mSales] = await Promise.all([
      db.rentInstallment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: monthStart, lt: monthEnd > end ? end : monthEnd },
          lease: { customer: { organizationId: orgId } },
        },
        _sum: { amount: true },
      }),
      db.contract.aggregate({
        where: {
          status: "SIGNED",
          type: "SALE",
          signedAt: { gte: monthStart, lt: monthEnd > end ? end : monthEnd },
          customer: { organizationId: orgId },
        },
        _sum: { amount: true },
      }),
    ]);

    const r = Number(mRent._sum.amount ?? 0);
    const s = Number(mSales._sum.amount ?? 0);
    months.push({ month: key, rent: r, sales: s, total: r + s });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Top 5 units by revenue (rent collected)
  const topUnits = await db.rentInstallment.groupBy({
    by: ["leaseId"],
    where: {
      status: "PAID",
      paidAt: { gte: start, lte: end },
      lease: { customer: { organizationId: orgId } },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const leaseIds = topUnits.map((t) => t.leaseId);
  const leases = leaseIds.length > 0 ? await db.lease.findMany({
    where: { id: { in: leaseIds } },
    select: { id: true, unit: { select: { number: true, building: { select: { name: true } } } } },
  }) : [];

  const topUnitsData = topUnits.map((t) => {
    const lease = leases.find((l) => l.id === t.leaseId);
    return {
      unit: lease ? `${lease.unit.building.name} - ${lease.unit.number}` : t.leaseId,
      revenue: Number(t._sum.amount ?? 0),
    };
  });

  return {
    rentTotal,
    salesTotal,
    combined,
    changePercent,
    months,
    topUnits: topUnitsData,
  };
}

export async function getOccupancyReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;

  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    select: {
      name: true,
      buildings: {
        select: {
          units: { select: { status: true } },
        },
      },
    },
  });

  const projectData = projects.map((p) => {
    const units = p.buildings.flatMap((b) => b.units);
    const total = units.length;
    const occupied = units.filter((u) => ["RENTED", "SOLD"].includes(u.status)).length;
    const vacant = total - occupied;
    return {
      name: p.name,
      total,
      occupied,
      vacant,
      rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  });

  const totalUnits = projectData.reduce((s, p) => s + p.total, 0);
  const totalOccupied = projectData.reduce((s, p) => s + p.occupied, 0);
  const overallRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return { overallRate, totalUnits, totalOccupied, projects: projectData };
}

export async function getRentCollectionReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const installments = await db.rentInstallment.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      lease: { customer: { organizationId: orgId } },
    },
    include: {
      lease: {
        include: {
          customer: { select: { name: true } },
          unit: { select: { number: true, building: { select: { name: true } } } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalDue = installments.reduce((s, i) => s + Number(i.amount), 0);
  const paid = installments.filter((i) => i.status === "PAID");
  const totalCollected = paid.reduce((s, i) => s + Number(i.amount), 0);
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  const overdue = installments.filter((i) => i.status === "OVERDUE" || (i.status === "UNPAID" && i.dueDate < now));
  const overdueAmount = overdue.reduce((s, i) => s + Number(i.amount), 0);

  // Aging buckets
  const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  overdue.forEach((i) => {
    const days = Math.floor((now.getTime() - i.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 30) aging["0-30"] += Number(i.amount);
    else if (days <= 60) aging["31-60"] += Number(i.amount);
    else if (days <= 90) aging["61-90"] += Number(i.amount);
    else aging["90+"] += Number(i.amount);
  });

  // Per-customer summary
  const customerMap = new Map<string, { name: string; unit: string; due: number; paid: number; status: string }>();
  installments.forEach((i) => {
    const key = i.lease.customer.name;
    const existing = customerMap.get(key) ?? {
      name: key,
      unit: `${i.lease.unit.building.name} - ${i.lease.unit.number}`,
      due: 0,
      paid: 0,
      status: "متأخر",
    };
    existing.due += Number(i.amount);
    if (i.status === "PAID") existing.paid += Number(i.amount);
    customerMap.set(key, existing);
  });
  const customers = Array.from(customerMap.values()).map((c) => ({
    ...c,
    status: c.paid >= c.due ? "مسدد" : c.paid > 0 ? "جزئي" : "متأخر",
  }));

  return {
    totalDue,
    totalCollected,
    collectionRate,
    overdueCount: overdue.length,
    overdueAmount,
    aging,
    customers,
  };
}

export async function getMaintenanceReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const requests = await db.maintenanceRequest.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: start, lte: end },
    },
    select: {
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const total = requests.length;
  const resolved = requests.filter((r) => r.status === "RESOLVED").length;
  const inProgress = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const open = requests.filter((r) => r.status === "OPEN").length;

  // Avg resolution time
  const resolvedWithTime = requests.filter((r) => r.resolvedAt);
  const avgResolutionDays = resolvedWithTime.length > 0
    ? Math.round(
        resolvedWithTime.reduce((s, r) => s + (r.resolvedAt!.getTime() - r.createdAt.getTime()), 0) /
        resolvedWithTime.length / (1000 * 60 * 60 * 24)
      )
    : 0;

  // Per-priority breakdown
  const priorities: Record<string, { total: number; resolved: number; open: number }> = {};
  requests.forEach((r) => {
    const p = r.priority ?? "MEDIUM";
    if (!priorities[p]) priorities[p] = { total: 0, resolved: 0, open: 0 };
    priorities[p].total++;
    if (r.status === "RESOLVED") priorities[p].resolved++;
    else priorities[p].open++;
  });

  return {
    total,
    resolved,
    inProgress,
    open,
    avgResolutionDays,
    priorities,
  };
}

export async function getLandPortfolioReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;

  const LAND_STATUSES = ["LAND_IDENTIFIED", "LAND_UNDER_REVIEW", "LAND_ACQUIRED"];

  const parcels = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: LAND_STATUSES as any },
    },
    select: {
      id: true, name: true, status: true,
      totalAreaSqm: true, estimatedValueSar: true,
      acquisitionPrice: true, city: true, district: true,
      landUse: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalParcels = parcels.length;
  const totalArea = parcels.reduce((s, p) => s + (p.totalAreaSqm ?? 0), 0);
  const totalEstimatedValue = parcels.reduce((s, p) => s + Number(p.estimatedValueSar ?? 0), 0);
  const totalAcquisitionCost = parcels.reduce((s, p) => s + Number(p.acquisitionPrice ?? 0), 0);

  return {
    totalParcels,
    totalArea,
    totalEstimatedValue,
    totalAcquisitionCost,
    unrealizedGainLoss: totalEstimatedValue - totalAcquisitionCost,
    parcels: parcels.map(p => ({
      name: p.name,
      area: p.totalAreaSqm,
      estimatedValue: Number(p.estimatedValueSar ?? 0),
      acquisitionCost: Number(p.acquisitionPrice ?? 0),
      status: p.status,
      location: [p.city, p.district].filter(Boolean).join(", "),
      landUse: p.landUse,
    })),
  };
}

export async function getProjectProgressReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;

  const projects = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["PLANNING", "UNDER_CONSTRUCTION", "READY", "HANDED_OVER"] as any },
    },
    include: {
      buildings: {
        include: {
          units: {
            include: {
              contracts: { where: { status: "SIGNED" }, select: { amount: true, type: true } },
              leases: { where: { status: "ACTIVE" }, select: { totalAmount: true } },
            },
          },
        },
      },
    },
  });

  return JSON.parse(JSON.stringify({
    projects: projects.map(p => {
      const units = p.buildings.flatMap(b => b.units);
      const totalUnits = units.length;
      const soldUnits = units.filter(u => u.status === "SOLD").length;
      const rentedUnits = units.filter(u => u.status === "RENTED").length;
      const saleRevenue = units.reduce((s, u) =>
        s + u.contracts.filter(c => c.type === "SALE").reduce((cs, c) => cs + Number(c.amount), 0), 0);
      const rentRevenue = units.reduce((s, u) =>
        s + u.leases.reduce((ls, l) => ls + Number(l.totalAmount), 0), 0);
      const remainingUnits = units.filter(u => u.status === "AVAILABLE");
      const remainingValue = remainingUnits.reduce((s, u) => s + Number(u.price ?? 0), 0);

      return {
        name: p.name,
        status: p.status,
        totalUnits,
        soldPercent: totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0,
        rentedPercent: totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0,
        totalRevenue: saleRevenue + rentRevenue,
        remainingValue,
      };
    }),
  }));
}

export async function getMaintenanceCostReport(startDate: string, endDate: string) {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const requests = await db.maintenanceRequest.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      unit: {
        include: { building: { select: { id: true, name: true, buildingAreaSqm: true } } },
      },
    },
  });

  const totalEstimated = requests.reduce((s, r) => s + Number(r.estimatedCost ?? 0), 0);
  const totalActual = requests.reduce((s, r) => s + Number(r.actualCost ?? 0), 0);
  const totalLaborHours = requests.reduce((s, r) => s + (r.laborHours ?? 0), 0);

  const byCategory: Record<string, { estimated: number; actual: number; count: number }> = {};
  requests.forEach(r => {
    const cat = r.category;
    if (!byCategory[cat]) byCategory[cat] = { estimated: 0, actual: 0, count: 0 };
    byCategory[cat].estimated += Number(r.estimatedCost ?? 0);
    byCategory[cat].actual += Number(r.actualCost ?? 0);
    byCategory[cat].count++;
  });

  const byBuilding: Record<string, { name: string; estimated: number; actual: number; count: number; areaSqm: number }> = {};
  requests.forEach(r => {
    if (!r.unit?.building) return;
    const bId = r.unit.building.id;
    if (!byBuilding[bId]) byBuilding[bId] = { name: r.unit.building.name, estimated: 0, actual: 0, count: 0, areaSqm: r.unit.building.buildingAreaSqm ?? 0 };
    byBuilding[bId].estimated += Number(r.estimatedCost ?? 0);
    byBuilding[bId].actual += Number(r.actualCost ?? 0);
    byBuilding[bId].count++;
  });

  const buildingData = Object.values(byBuilding).map(b => ({
    ...b,
    costPerSqm: b.areaSqm > 0 ? Math.round(b.actual / b.areaSqm) : 0,
  }));

  return JSON.parse(JSON.stringify({
    totalEstimated,
    totalActual,
    variance: totalActual - totalEstimated,
    totalLaborHours,
    totalRequests: requests.length,
    byCategory: Object.entries(byCategory).map(([cat, data]) => ({ category: cat, ...data })),
    byBuilding: buildingData,
  }));
}
