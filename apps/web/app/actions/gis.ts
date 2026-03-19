"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

/**
 * Get all spatial data for a project as GeoJSON FeatureCollections.
 * Returns plots, blocks, roads, utilities, and project boundary.
 */
export async function getProjectGeoData(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  // Verify project belongs to org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: {
      id: true, name: true, description: true,
      latitude: true, longitude: true, boundaries: true,
      totalAreaSqm: true, region: true, city: true, district: true,
    },
  });
  if (!project) throw new Error("Project not found or you don't have access.");

  // Get all subdivision plans for this project
  const subdivisionPlans = await db.subdivisionPlan.findMany({
    where: { projectId, organizationId: orgId },
    select: { id: true },
  });
  const planIds = subdivisionPlans.map(p => p.id);

  // Fetch all spatial entities in parallel
  const [plots, blocks, roads, utilities, buildings] = await Promise.all([
    db.plot.findMany({
      where: { subdivisionPlanId: { in: planIds }, organizationId: orgId },
      select: {
        id: true, plotNumber: true, areaSqm: true, landUse: true,
        phase: true, status: true, productType: true, boundaryGeoJson: true,
        dimensions: true,
      },
    }),
    db.block.findMany({
      where: { subdivisionPlanId: { in: planIds } },
      select: {
        id: true, blockNumber: true, areaSqm: true, landUse: true,
        numberOfPlots: true, boundaryGeoJson: true,
      },
    }),
    db.road.findMany({
      where: { subdivisionPlanId: { in: planIds } },
      select: {
        id: true, name: true, type: true, widthMeters: true,
        lengthMeters: true, areaSqm: true, lineGeoJson: true,
      },
    }),
    db.utilityCorridor.findMany({
      where: { subdivisionPlanId: { in: planIds } },
      select: {
        id: true, name: true, utilityType: true, widthMeters: true,
        lengthMeters: true, lineGeoJson: true,
      },
    }),
    db.building.findMany({
      where: { projectId, project: { organizationId: orgId } },
      select: {
        id: true, name: true, buildingType: true, numberOfFloors: true,
        buildingAreaSqm: true, occupancyStatus: true, towerName: true,
        blockCode: true,
      },
    }),
  ]);

  return JSON.parse(JSON.stringify({
    project,
    plots,
    blocks,
    roads,
    utilities,
    buildings,
  }));
}

/**
 * Get plots with optional status filter for sales map.
 */
export async function getPlotsByStatus(projectId: string, status?: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const subdivisionPlans = await db.subdivisionPlan.findMany({
    where: { projectId, organizationId: orgId },
    select: { id: true },
  });
  const planIds = subdivisionPlans.map(p => p.id);

  const where: any = { subdivisionPlanId: { in: planIds }, organizationId: orgId };
  if (status) where.status = status;

  const plots = await db.plot.findMany({
    where,
    include: {
      inventoryItem: {
        select: {
          id: true, finalPriceSar: true, basePriceSar: true,
          status: true, productLabel: true, productLabelArabic: true,
        },
      },
    },
  });

  return JSON.parse(JSON.stringify(plots));
}

/**
 * Get GIS dashboard statistics for a project.
 */
export async function getGisDashboardStats(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, totalAreaSqm: true },
  });
  if (!project) throw new Error("Project not found or you don't have access.");

  const subdivisionPlans = await db.subdivisionPlan.findMany({
    where: { projectId, organizationId: orgId },
    select: { id: true },
  });
  const planIds = subdivisionPlans.map(p => p.id);

  const [plotStats, roadStats, buildingCount] = await Promise.all([
    db.plot.groupBy({
      by: ["status"],
      where: { subdivisionPlanId: { in: planIds }, organizationId: orgId },
      _count: { id: true },
      _sum: { areaSqm: true },
    }),
    db.road.aggregate({
      where: { subdivisionPlanId: { in: planIds } },
      _sum: { lengthMeters: true, areaSqm: true },
      _count: { id: true },
    }),
    db.building.count({
      where: { projectId, project: { organizationId: orgId } },
    }),
  ]);

  const totalPlots = plotStats.reduce((sum, s) => sum + s._count.id, 0);
  const totalPlotArea = plotStats.reduce((sum, s) => sum + Number(s._sum.areaSqm || 0), 0);
  const soldPlots = plotStats.find(s => s.status === "SOLD")?._count.id ?? 0;
  const availablePlots = plotStats.find(s => s.status === "AVAILABLE_FOR_SALE")?._count.id ?? 0;
  const reservedPlots = plotStats.find(s => s.status === "RESERVED")?._count.id ?? 0;

  return JSON.parse(JSON.stringify({
    totalAreaSqm: project.totalAreaSqm,
    totalPlots,
    totalPlotArea,
    soldPlots,
    availablePlots,
    reservedPlots,
    soldPercentage: totalPlots > 0 ? Math.round((soldPlots / totalPlots) * 100) : 0,
    totalRoads: roadStats._count.id,
    totalRoadLength: roadStats._sum.lengthMeters,
    totalRoadArea: roadStats._sum.areaSqm,
    totalBuildings: buildingCount,
    plotsByStatus: plotStats.map(s => ({
      status: s.status,
      count: s._count.id,
      area: s._sum.areaSqm,
    })),
  }));
}

/**
 * Get all projects with boundaries for the main GIS hub map.
 */
export async function getProjectsForGisMap() {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    select: {
      id: true, name: true, description: true, status: true, type: true,
      latitude: true, longitude: true, boundaries: true,
      totalAreaSqm: true, region: true, city: true, district: true,
      landUse: true, estimatedValueSar: true,
      _count: { select: { buildings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(projects));
}

/**
 * Get road network for a project.
 */
export async function getRoadNetwork(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const subdivisionPlans = await db.subdivisionPlan.findMany({
    where: { projectId, organizationId: orgId },
    select: { id: true },
  });
  const planIds = subdivisionPlans.map(p => p.id);

  const roads = await db.road.findMany({
    where: { subdivisionPlanId: { in: planIds } },
  });

  return JSON.parse(JSON.stringify(roads));
}

/**
 * Get utility network for a project.
 */
export async function getUtilityNetwork(projectId: string, utilityType?: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const subdivisionPlans = await db.subdivisionPlan.findMany({
    where: { projectId, organizationId: orgId },
    select: { id: true },
  });
  const planIds = subdivisionPlans.map(p => p.id);

  const where: any = { subdivisionPlanId: { in: planIds } };
  if (utilityType) where.utilityType = utilityType;

  const utilities = await db.utilityCorridor.findMany({ where });

  return JSON.parse(JSON.stringify(utilities));
}
