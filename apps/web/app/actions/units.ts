"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function updateUnit(unitId: string, data: any) {
  const session = await getSessionOrThrow();

  // Verify unit belongs to user's org through building → project
  const unit = await db.unit.findFirst({
    where: { id: unitId },
    include: { building: { include: { project: true } } },
  });
  if (!unit || unit.building.project.organizationId !== session.organizationId) {
    throw new Error("Unit not found");
  }

  const updated = await db.unit.update({
    where: { id: unitId },
    data,
  });

  revalidatePath("/dashboard/units");
  return JSON.parse(JSON.stringify(updated));
}

export async function massUpdateUnits(
  units: { id: string; price?: number; status?: any }[]
) {
  const session = await getSessionOrThrow();

  // Verify all units belong to org
  const unitIds = units.map((u) => u.id);
  const existingUnits = await db.unit.findMany({
    where: { id: { in: unitIds } },
    include: { building: { include: { project: true } } },
  });

  const allBelongToOrg = existingUnits.every(
    (u) => u.building.project.organizationId === session.organizationId
  );
  if (!allBelongToOrg) throw new Error("Unauthorized: units do not belong to your organization");

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
  return JSON.parse(JSON.stringify(results));
}

export async function getUnitsWithBuildings() {
  const session = await getSessionOrThrow();

  const units = await db.unit.findMany({
    where: {
      building: {
        project: { organizationId: session.organizationId },
      },
    },
    include: {
      building: {
        include: {
          project: true,
        },
      },
    },
    orderBy: { number: "asc" },
  });
  return JSON.parse(JSON.stringify(units));
}

export async function createUnit(data: {
  number: string;
  type: any;
  buildingId: string;
  area?: number;
  price?: number;
  status?: any;
}) {
  const session = await getSessionOrThrow();

  // Verify building belongs to org
  const building = await db.building.findFirst({
    where: { id: data.buildingId },
    include: { project: true },
  });
  if (!building || building.project.organizationId !== session.organizationId) {
    throw new Error("Building not found");
  }

  const unit = await db.unit.create({
    data: {
      ...data,
      price: data.price ? Number(data.price) : undefined,
    },
  });

  revalidatePath("/dashboard/units");
  return JSON.parse(JSON.stringify(unit));
}

export async function deleteUnit(unitId: string) {
  const session = await getSessionOrThrow();

  const unit = await db.unit.findFirst({
    where: { id: unitId },
    include: { building: { include: { project: true } } },
  });
  if (!unit || unit.building.project.organizationId !== session.organizationId) {
    throw new Error("Unit not found");
  }

  await db.unit.delete({ where: { id: unitId } });
  revalidatePath("/dashboard/units");
}

export async function getBuildings() {
  const session = await getSessionOrThrow();

  const buildings = await db.building.findMany({
    where: {
      project: { organizationId: session.organizationId },
    },
    include: { project: true },
    orderBy: { name: "asc" },
  });
  return JSON.parse(JSON.stringify(buildings));
}
