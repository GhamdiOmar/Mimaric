"use server";

import { db } from "@repo/db";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function createReservation(data: {
  customerId: string;
  unitId: string;
  amount: number;
  expiresAt: Date;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const reservation = await db.reservation.create({
    data: {
      ...data,
      userId: session.user.id,
      status: "PENDING",
    },
  });

  // Automatically update unit status to RESERVED
  await db.unit.update({
    where: { id: data.unitId },
    data: { status: "RESERVED" },
  });

  revalidatePath("/dashboard/units");
  revalidatePath("/dashboard/sales/reservations");
  
  return reservation;
}

export async function getReservations() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.reservation.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      unit: true,
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
