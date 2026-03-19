"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { notifyAdmins } from "../../lib/create-notification";

/**
 * Convert an approved baseline scenario into structured project data.
 * Links the workspace to an existing project or creates the linkage.
 */
export async function convertBaselineToProject(workspaceId: string) {
  const session = await requirePermission("planning:approve");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id: workspaceId, organizationId: orgId },
    include: {
      scenarios: {
        where: { isBaseline: true },
        include: {
          subdivisionPlan: {
            include: {
              plots: true,
              blocks: true,
              roads: true,
            },
          },
          feasibilitySet: true,
        },
      },
    },
  });

  if (!workspace) throw new Error("Planning workspace not found or you don't have access.");

  const baseline = workspace.scenarios[0];
  if (!baseline) throw new Error("No approved baseline scenario found. Please approve a scenario before converting.");

  const meta = workspace.siteMetadata as any || {};
  const sp = baseline.subdivisionPlan;
  const feas = baseline.feasibilitySet;
  const metrics = baseline.metrics as any || {};

  // If workspace is linked to a project, update it
  let projectId = workspace.projectId;

  if (projectId) {
    // Update existing project with planning metrics
    await db.project.update({
      where: { id: projectId },
      data: {
        // Store planning outputs as project metadata
        totalAreaSqm: sp?.totalAreaSqm || meta.totalAreaSqm,
        ...(sp?.developableAreaSqm && { developableAreaSqm: sp.developableAreaSqm } as any),
        status: "PLANNING" as any,
      },
    });
  } else if (workspace.landRecordId) {
    // Link the land record as the project and advance it
    projectId = workspace.landRecordId;
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "PLANNING" as any,
        totalAreaSqm: sp?.totalAreaSqm || meta.totalAreaSqm,
      },
    });

    // Link workspace to this project
    await db.planningWorkspace.update({
      where: { id: workspaceId },
      data: { projectId },
    });
  }

  // Update workspace status
  await db.planningWorkspace.update({
    where: { id: workspaceId },
    data: { status: "APPROVED" },
  });

  // Notify admins
  await notifyAdmins({
    type: "PLANNING_WORKSPACE_CONVERTED",
    title: `تم تحويل مساحة التخطيط إلى مشروع: ${workspace.name}`,
    titleEn: `Planning workspace converted to project: ${workspace.name}`,
    message: `السيناريو المعتمد: ${baseline.name}، عدد القطع: ${metrics.plotCount || sp?.plots?.length || 0}`,
    messageEn: `Approved scenario: ${baseline.name}, Plots: ${metrics.plotCount || sp?.plots?.length || 0}`,
    link: projectId ? `/dashboard/projects/${projectId}` : `/dashboard/planning/${workspaceId}`,
    organizationId: orgId,
  });

  return {
    projectId,
    scenarioName: baseline.name,
    plotCount: sp?.plots?.length || 0,
    totalArea: sp?.totalAreaSqm || 0,
  };
}
