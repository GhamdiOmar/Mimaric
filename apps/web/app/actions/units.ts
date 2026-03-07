"use server";

import { db } from "@repo/db";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function updateUnit(unitId: string, data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const unit = await db.unit.update({
    where: { id: unitId },
    data,
  });

  revalidatePath("/dashboard/units");
  return unit;
}

export async function massUpdateUnits(units: { id: string; price?: number; status?: any }[]) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Prisma doesn't support mass update with different values in a single call easily
  // We'll use a transaction for safety
  const results = await db.$transaction(
    units.map((u) =>
      db.unit.update({
        where: { id: u.id },
        data: {
          price: u.price,
          status: u.status,
        },
      })
    )
  );

  revalidatePath("/dashboard/units");
  return results;
}

export async function getUnitsWithBuildings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return await db.unit.findMany({
    include: {
      building: {
        include: {
          project: true,
        },
      },
    },
    orderBy: {
      number: 'asc'
    }
  });
}

export async function createUnit(data: {
  number: string;
  type: any;
  buildingId: string;
  area?: number;
  price?: number;
  status?: any;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const unit = await db.unit.create({
    data: {
      ...data,
      price: data.price ? Number(data.price) : undefined,
    },
  });

  revalidatePath("/dashboard/units");
  return unit;
}

export async function getBuildings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return await db.building.findMany({
    include: {
      project: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}
