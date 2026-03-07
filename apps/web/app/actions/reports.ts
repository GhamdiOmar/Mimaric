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
