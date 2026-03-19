"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

/**
 * Map plot productType to UnitType enum.
 */
function mapProductTypeToUnitType(productType: string | null): string {
  switch (productType?.toUpperCase()) {
    case "VILLA":
    case "VILLA_PLOT":
    case "TOWNHOUSE":
    case "TOWNHOUSE_PLOT":
      return "VILLA";
    case "APARTMENT":
    case "APARTMENT_BLOCK":
    case "APARTMENT_PLOT":
      return "APARTMENT";
    case "COMMERCIAL_LOT":
    case "COMMERCIAL":
      return "RETAIL";
    case "OFFICE":
    case "OFFICE_PLOT":
      return "OFFICE";
    case "WAREHOUSE":
    case "WAREHOUSE_PLOT":
      return "WAREHOUSE";
    default:
      return "APARTMENT";
  }
}

/**
 * Map plot productType to building type string.
 */
function mapProductTypeToBuildingType(productType: string | null): string {
  switch (productType?.toUpperCase()) {
    case "VILLA":
    case "VILLA_PLOT":
    case "TOWNHOUSE":
    case "TOWNHOUSE_PLOT":
      return "villa";
    case "COMMERCIAL_LOT":
    case "COMMERCIAL":
    case "OFFICE":
    case "OFFICE_PLOT":
      return "commercial";
    case "APARTMENT":
    case "APARTMENT_BLOCK":
    case "APARTMENT_PLOT":
      return "residential";
    default:
      return "residential";
  }
}

/**
 * Generate Building and Unit records from an approved SubdivisionPlan's plots.
 * Groups plots by block → creates one Building per block.
 * Creates one Unit per plot inside its corresponding Building.
 */
export async function generateBuildingsFromPlots(
  projectId: string,
  subdivisionPlanId: string
) {
  const session = await requirePermission("projects:write");
  const orgId = session.organizationId;

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  // Load subdivision plan with plots and blocks
  const plan = await db.subdivisionPlan.findFirst({
    where: { id: subdivisionPlanId, projectId, organizationId: orgId },
    include: {
      plots: { orderBy: { plotNumber: "asc" } },
      blocks: { orderBy: { blockNumber: "asc" } },
    },
  });
  if (!plan) throw new Error("Subdivision plan not found or you don't have access. Please refresh and try again.");
  if (plan.plots.length === 0) throw new Error("No plots were found in the selected subdivision plan. Please add plots first.");

  // Group plots by blockId (null blockId = ungrouped)
  const plotsByBlock = new Map<string, typeof plan.plots>();
  for (const plot of plan.plots) {
    const key = plot.blockId || "__ungrouped__";
    if (!plotsByBlock.has(key)) plotsByBlock.set(key, []);
    plotsByBlock.get(key)!.push(plot);
  }

  // Block name lookup
  const blockNameMap = new Map<string, string>();
  for (const block of plan.blocks) {
    blockNameMap.set(block.id, block.blockNumber || block.id);
  }

  let buildingsCreated = 0;
  let unitsCreated = 0;

  for (const [blockKey, plots] of plotsByBlock) {
    const blockName = blockKey === "__ungrouped__"
      ? `${project.name} - Building`
      : `Block ${blockNameMap.get(blockKey) || blockKey}`;

    // Determine dominant building type from plots
    const dominantType = plots[0]?.productType || null;
    const totalArea = plots.reduce((sum, p) => sum + (p.areaSqm || 0), 0);

    // Create Building
    const building = await db.building.create({
      data: {
        name: blockName,
        projectId,
        buildingType: mapProductTypeToBuildingType(dominantType),
        buildingAreaSqm: totalArea || undefined,
        numberOfFloors: dominantType?.toUpperCase()?.includes("VILLA") ? 2 : undefined,
      },
    });
    buildingsCreated++;

    // Create Units from plots
    for (const plot of plots) {
      await db.unit.create({
        data: {
          number: plot.plotNumber,
          type: mapProductTypeToUnitType(plot.productType) as any,
          status: "AVAILABLE",
          buildingId: building.id,
          area: plot.areaSqm || undefined,
        },
      });
      unitsCreated++;
    }
  }

  return { buildingsCreated, unitsCreated };
}
