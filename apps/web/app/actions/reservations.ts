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
  inventoryItemId?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  salesChannel?: string;
  expiryPolicy?: string;
}) {
  const session = await requirePermission("reservations:write");

  // Verify customer belongs to org
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found");

  // RED: Duplicate check — prevent same customer + unit reservation
  const existingReservation = await db.reservation.findFirst({
    where: {
      customerId: data.customerId,
      unitId: data.unitId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (existingReservation) {
    throw new Error("An active reservation already exists for this customer and unit");
  }

  // RED: Race condition guard — use transaction with unit status check
  const reservation = await db.$transaction(async (tx) => {
    // Check unit availability inside transaction
    const unit = await tx.unit.findFirst({
      where: { id: data.unitId },
      include: { building: { include: { project: true } } },
    });
    if (!unit || unit.building.project.organizationId !== session.organizationId) {
      throw new Error("Unit not found");
    }
    if (unit.status !== "AVAILABLE") {
      throw new Error("Unit is no longer available for reservation");
    }

    // RED: Release check for inventory items
    if (data.inventoryItemId) {
      const invItem = await tx.inventoryItem.findFirst({
        where: { id: data.inventoryItemId },
      });
      if (invItem && invItem.releaseStatus !== "RELEASED") {
        throw new Error("Inventory item has not been released for sale");
      }
    }

    // Create reservation
    const res = await tx.reservation.create({
      data: {
        customerId: data.customerId,
        unitId: data.unitId,
        amount: data.amount,
        expiresAt: data.expiresAt,
        userId: session.userId,
        status: "PENDING",
        inventoryItemId: data.inventoryItemId,
        depositRequired: data.depositRequired ?? false,
        depositAmount: data.depositAmount,
        salesChannel: data.salesChannel as any,
        expiryPolicy: data.expiryPolicy,
      },
    });

    // Update unit status atomically
    await tx.unit.update({
      where: { id: data.unitId },
      data: { status: "RESERVED" },
    });

    // Update customer status
    await tx.customer.update({
      where: { id: data.customerId },
      data: { status: "RESERVED" },
    });

    return res;
  });

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "CREATE",
    resource: "Reservation",
    resourceId: reservation.id,
    metadata: { depositRequired: data.depositRequired, salesChannel: data.salesChannel },
    organizationId: session.organizationId,
  });

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

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "Reservation",
    resourceId: reservationId,
    before: { status: reservation.status },
    after: { status },
    organizationId: session.organizationId,
  });

  revalidatePath("/dashboard/units");
  revalidatePath("/dashboard/sales/reservations");
  return JSON.parse(JSON.stringify(updated));
}

// ─── RED: Reservation Extensions ────────────────────────────────────────────

export async function requestReservationExtension(
  reservationId: string,
  newExpiresAt: string,
  reason?: string
) {
  const session = await requirePermission("reservations:write");

  const reservation = await db.reservation.findFirst({
    where: { id: reservationId },
    include: { customer: true },
  });
  if (!reservation || reservation.customer.organizationId !== session.organizationId) {
    throw new Error("Reservation not found");
  }

  if (reservation.extensionCount >= reservation.maxExtensions) {
    throw new Error("Maximum number of extensions reached");
  }

  const extension = await db.reservationExtension.create({
    data: {
      reservationId,
      requestedBy: session.userId,
      newExpiresAt: new Date(newExpiresAt),
      reason,
    },
  });

  return JSON.parse(JSON.stringify(extension));
}

export async function approveReservationExtension(extensionId: string) {
  const session = await requirePermission("reservations:write");

  const extension = await db.reservationExtension.findFirst({
    where: { id: extensionId },
    include: { reservation: { include: { customer: true } } },
  });
  if (!extension || extension.reservation.customer.organizationId !== session.organizationId) {
    throw new Error("Extension not found");
  }

  if (extension.status !== "PENDING_EXTENSION") {
    throw new Error("Extension is not pending");
  }

  await db.$transaction([
    db.reservationExtension.update({
      where: { id: extensionId },
      data: { status: "APPROVED_EXTENSION", approvedBy: session.userId },
    }),
    db.reservation.update({
      where: { id: extension.reservationId },
      data: {
        expiresAt: extension.newExpiresAt,
        extensionCount: { increment: 1 },
      },
    }),
  ]);

  logAuditEvent({
    userId: session.userId,
    userEmail: session.email,
    userRole: session.role,
    action: "UPDATE",
    resource: "ReservationExtension",
    resourceId: extensionId,
    metadata: { reservationId: extension.reservationId, newExpiresAt: extension.newExpiresAt },
    organizationId: session.organizationId,
  });

  revalidatePath("/dashboard/sales/reservations");
  return { success: true };
}

// ─── RED: Auto-Expire Batch (for cron job) ──────────────────────────────────

export async function autoExpireReservations() {
  const now = new Date();

  const expired = await db.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true, unitId: true },
  });

  for (const res of expired) {
    await db.$transaction([
      db.reservation.update({
        where: { id: res.id },
        data: { status: "EXPIRED" },
      }),
      db.unit.update({
        where: { id: res.unitId },
        data: { status: "AVAILABLE" },
      }),
    ]);
  }

  return { expired: expired.length };
}
