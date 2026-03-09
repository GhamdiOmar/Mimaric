"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

export async function getSalesStats() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const [customerCount, reservationCount, contractCount] = await Promise.all([
    db.customer.count({ where: { organizationId: orgId } }),
    db.reservation.count({
      where: { customer: { organizationId: orgId } },
    }),
    db.contract.count({
      where: { customer: { organizationId: orgId } },
    }),
  ]);

  return { customerCount, reservationCount, contractCount };
}

/**
 * Off-plan sales pipeline stats — inventory reservations + conversion data.
 */
export async function getOffPlanSalesStats() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const items = await db.inventoryItem.findMany({
    where: { organizationId: orgId },
    select: { status: true, finalPriceSar: true, basePriceSar: true },
  });

  const total = items.length;
  const reserved = items.filter((i) => i.status === "RESERVED_INV").length;
  const sold = items.filter((i) => i.status === "SOLD_INV").length;
  const available = items.filter((i) => i.status === "AVAILABLE_INV").length;

  const pipelineValue = items
    .filter((i) => ["AVAILABLE_INV", "RESERVED_INV"].includes(i.status))
    .reduce((sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : i.basePriceSar ? Number(i.basePriceSar) : 0), 0);

  const reservedValue = items
    .filter((i) => i.status === "RESERVED_INV")
    .reduce((sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : i.basePriceSar ? Number(i.basePriceSar) : 0), 0);

  const soldValue = items
    .filter((i) => i.status === "SOLD_INV")
    .reduce((sum, i) => sum + (i.finalPriceSar ? Number(i.finalPriceSar) : i.basePriceSar ? Number(i.basePriceSar) : 0), 0);

  const conversionRate = total > 0 ? Math.round(((reserved + sold) / total) * 100) : 0;

  return { total, available, reserved, sold, pipelineValue, reservedValue, soldValue, conversionRate };
}
