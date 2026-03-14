"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

/**
 * Map InventoryItem productType to UnitType enum value.
 */
function mapInventoryToUnitType(productType: string | null): string {
  switch (productType?.toUpperCase()) {
    case "VILLA_PLOT":
    case "TOWNHOUSE_PLOT":
      return "VILLA";
    case "APARTMENT_PLOT":
      return "APARTMENT";
    case "COMMERCIAL_LOT":
      return "RETAIL";
    case "OFFICE_PLOT":
      return "OFFICE";
    default:
      return "APARTMENT";
  }
}

/**
 * Convert sold off-plan InventoryItems into delivered Unit records.
 * Creates Unit + Contract for each SOLD_INV item that has a customer reservation.
 */
export async function convertInventoryToUnits(projectId: string) {
  const session = await requirePermission("projects:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: { buildings: { select: { id: true, name: true } } },
  });
  if (!project) throw new Error("Project not found");

  // Get all SOLD_INV inventory items for this project
  const soldItems = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId, status: "SOLD_INV" },
    include: {
      reservations: {
        where: { status: { in: ["CONFIRMED", "PENDING"] } },
        include: { customer: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  if (soldItems.length === 0) {
    return { unitsCreated: 0, contractsCreated: 0, message: "No sold inventory items found" };
  }

  // Use first building or create a default one
  let building = project.buildings[0];
  if (!building) {
    building = await db.building.create({
      data: {
        name: `${project.name} - Main Building`,
        projectId,
        buildingType: "residential",
      },
    });
  }

  let unitsCreated = 0;
  let contractsCreated = 0;

  for (const item of soldItems) {
    // Create Unit
    const unit = await db.unit.create({
      data: {
        number: item.itemNumber || `Unit-${unitsCreated + 1}`,
        type: mapInventoryToUnitType(item.productType) as any,
        status: "SOLD",
        buildingId: building.id,
        area: item.areaSqm || undefined,
        price: item.finalPriceSar || undefined,
      },
    });
    unitsCreated++;

    // If there's a customer reservation, create a sale contract
    const reservation = item.reservations[0];
    if (reservation?.customer) {
      await db.contract.create({
        data: {
          customerId: reservation.customer.id,
          unitId: unit.id,
          type: "SALE",
          amount: item.finalPriceSar || 0,
          status: "SIGNED",
          signedAt: new Date(),
        },
      });
      contractsCreated++;
    }

    // Mark inventory item as delivered
    await db.inventoryItem.update({
      where: { id: item.id },
      data: {
        status: "WITHDRAWN",
      },
    });
  }

  return { unitsCreated, contractsCreated };
}
