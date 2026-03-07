"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

export async function createReservation(data: {
  customerId: string;
  unitId: string;
  amount: number;
  expiresAt: Date;
}) {
  const session = await requirePermission("reservations:write");

  // Verify customer belongs to org
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found");

  const reservation = await db.reservation.create({
    data: {
      ...data,
      userId: session.userId,
      status: "PENDING",
    },
  });

  // Automatically update unit status to RESERVED
  await db.unit.update({
    where: { id: data.unitId },
    data: { status: "RESERVED" },
  });

  // Update customer status
  await db.customer.update({
    where: { id: data.customerId },
    data: { status: "RESERVED" },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "CREATE", resource: "Reservation", resourceId: reservation.id, organizationId: session.organizationId });

  revalidatePath("/dashboard/units");
  revalidatePath("/dashboard/sales/reservations");
  return JSON.parse(JSON.stringify(reservation));
}

export async function getReservations() {
  const session = await requirePermission("reservations:read");

  const reservations = await db.reservation.findMany({
    where: {
      customer: { organizationId: session.organizationId },
    },
    include: {
      unit: { include: { building: { include: { project: true } } } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return JSON.parse(JSON.stringify(reservations));
}

export async function updateReservationStatus(
  reservationId: string,
  status: "CONFIRMED" | "CANCELLED" | "EXPIRED"
) {
  const session = await requirePermission("reservations:write");

  const reservation = await db.reservation.findFirst({
    where: { id: reservationId },
    include: { customer: true },
  });
  if (!reservation || reservation.customer.organizationId !== session.organizationId) {
    throw new Error("Reservation not found");
  }

  const updated = await db.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  // If cancelled/expired, free the unit
  if (status === "CANCELLED" || status === "EXPIRED") {
    await db.unit.update({
      where: { id: reservation.unitId },
      data: { status: "AVAILABLE" },
    });
  }

  // If confirmed, mark unit as SOLD
  if (status === "CONFIRMED") {
    await db.unit.update({
      where: { id: reservation.unitId },
      data: { status: "SOLD" },
    });
    await db.customer.update({
      where: { id: reservation.customerId },
      data: { status: "CONVERTED" },
    });
  }

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "Reservation", resourceId: reservationId, metadata: { newStatus: status }, organizationId: session.organizationId });

  revalidatePath("/dashboard/units");
  revalidatePath("/dashboard/sales/reservations");
  return JSON.parse(JSON.stringify(updated));
}
