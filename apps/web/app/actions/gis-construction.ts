"use server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";

/** Get construction packages for a project */
export async function getConstructionPackages(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found or you don't have access.");

  const packages = await db.constructionPackage.findMany({
    where: { projectId, organizationId: orgId },
    orderBy: { createdAt: "asc" },
  });

  return JSON.parse(JSON.stringify(packages));
}

/** Create a construction package */
export async function createConstructionPackage(data: {
  projectId: string;
  name: string;
  nameArabic?: string;
  packageType: string;
  contractorName?: string;
  plannedStart?: string;
  plannedFinish?: string;
  boundaryGeoJson?: any;
  phaseId?: string;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found or you don't have access.");

  const pkg = await db.constructionPackage.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      nameArabic: data.nameArabic,
      packageType: data.packageType,
      contractorName: data.contractorName,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      plannedFinish: data.plannedFinish ? new Date(data.plannedFinish) : undefined,
      boundaryGeoJson: data.boundaryGeoJson,
      phaseId: data.phaseId,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard/gis/construction");
  return JSON.parse(JSON.stringify(pkg));
}

/** Update construction package progress */
export async function updatePackageProgress(packageId: string, progressPercent: number, status?: string) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const existing = await db.constructionPackage.findFirst({
    where: { id: packageId, organizationId: orgId },
  });
  if (!existing) throw new Error("Construction package not found.");

  const updateData: any = { progressPercent };
  if (status) updateData.status = status;
  if (progressPercent >= 100 && !existing.actualFinish) {
    updateData.actualFinish = new Date();
    updateData.status = "COMPLETED";
  }
  if (progressPercent > 0 && !existing.actualStart) {
    updateData.actualStart = new Date();
  }

  const updated = await db.constructionPackage.update({
    where: { id: packageId },
    data: updateData,
  });

  revalidatePath("/dashboard/gis/construction");
  return JSON.parse(JSON.stringify(updated));
}

/** Get construction summary stats for a project */
export async function getConstructionStats(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const packages = await db.constructionPackage.findMany({
    where: { projectId, organizationId: orgId },
  });

  const total = packages.length;
  const completed = packages.filter(p => p.status === "COMPLETED").length;
  const inProgress = packages.filter(p => p.status === "IN_PROGRESS").length;
  const notStarted = packages.filter(p => p.status === "NOT_STARTED").length;
  const avgProgress = total > 0
    ? Math.round(packages.reduce((sum, p) => sum + Number(p.progressPercent), 0) / total)
    : 0;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    avgProgress,
    byType: Object.entries(
      packages.reduce((acc, p) => {
        acc[p.packageType] = (acc[p.packageType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({ type, count })),
  };
}
