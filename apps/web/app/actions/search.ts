"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function globalSearch(query: string) {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  if (!query || query.length < 2) {
    return { customers: [], units: [], contracts: [] };
  }

  const [customers, units, contracts] = await Promise.all([
    db.customer.findMany({
      where: {
        organizationId: orgId,
        name: { contains: query, mode: "insensitive" },
      },
      select: { id: true, name: true },
      take: 5,
    }),
    db.unit.findMany({
      where: {
        organizationId: orgId,
        number: { contains: query, mode: "insensitive" },
      },
      select: { id: true, number: true, buildingName: true },
      take: 5,
    }),
    db.contract.findMany({
      where: {
        customer: { organizationId: orgId },
        id: { contains: query },
      },
      select: { id: true, type: true, customer: { select: { name: true } } },
      take: 5,
    }),
  ]);

  return {
    customers,
    units: units.map((u) => ({
      id: u.id,
      name: [u.buildingName, u.number].filter(Boolean).join(" - "),
    })),
    contracts: contracts.map((c) => ({ id: c.id, name: `${c.type} - ${c.customer.name}` })),
  };
}
