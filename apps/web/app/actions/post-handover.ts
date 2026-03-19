"use server";

import { db } from "@repo/db";
import { MaintenanceCategory, RecurrenceType } from "@prisma/client";
import { requirePermission } from "../../lib/auth-helpers";

const DEFAULT_PLANS: {
  title: string;
  titleAr: string;
  category: MaintenanceCategory;
  recurrenceType: RecurrenceType;
  estimatedCostSar: number;
}[] = [
  { title: "HVAC Inspection", titleAr: "فحص التكييف", category: MaintenanceCategory.HVAC, recurrenceType: RecurrenceType.QUARTERLY, estimatedCostSar: 500 },
  { title: "Plumbing Check", titleAr: "فحص السباكة", category: MaintenanceCategory.PLUMBING, recurrenceType: RecurrenceType.SEMI_ANNUAL, estimatedCostSar: 300 },
  { title: "Electrical Inspection", titleAr: "فحص الكهرباء", category: MaintenanceCategory.ELECTRICAL, recurrenceType: RecurrenceType.ANNUAL, estimatedCostSar: 400 },
  { title: "Fire Safety Check", titleAr: "فحص السلامة من الحريق", category: MaintenanceCategory.FIRE_SAFETY, recurrenceType: RecurrenceType.ANNUAL, estimatedCostSar: 350 },
  { title: "General Maintenance", titleAr: "صيانة عامة", category: MaintenanceCategory.GENERAL, recurrenceType: RecurrenceType.MONTHLY, estimatedCostSar: 200 },
];

/**
 * Auto-create preventive maintenance plans for all units in a handed-over project.
 */
export async function setupPostHandoverMaintenance(projectId: string) {
  const session = await requirePermission("maintenance:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      buildings: {
        include: { units: { select: { id: true, number: true } } },
      },
    },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const allUnits = project.buildings.flatMap((b) => b.units);
  if (allUnits.length === 0) {
    return { plansCreated: 0, unitsProcessed: 0, message: "No units found" };
  }

  let plansCreated = 0;
  const now = new Date();

  for (const unit of allUnits) {
    for (const template of DEFAULT_PLANS) {
      // Check if plan already exists for this unit + category + recurrence type
      const existing = await db.preventiveMaintenancePlan.findFirst({
        where: {
          unitId: unit.id,
          organizationId: orgId,
          category: template.category,
          recurrenceType: template.recurrenceType,
        },
      });
      if (existing) continue;

      let nextDue: Date;
      switch (template.recurrenceType) {
        case RecurrenceType.MONTHLY:
          nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case RecurrenceType.QUARTERLY:
          nextDue = new Date(now.getFullYear(), now.getMonth() + 3, 1);
          break;
        case RecurrenceType.SEMI_ANNUAL:
          nextDue = new Date(now.getFullYear(), now.getMonth() + 6, 1);
          break;
        case RecurrenceType.ANNUAL:
          nextDue = new Date(now.getFullYear() + 1, now.getMonth(), 1);
          break;
        default:
          nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      await db.preventiveMaintenancePlan.create({
        data: {
          title: template.title,
          description: template.titleAr,
          unitId: unit.id,
          category: template.category,
          recurrenceType: template.recurrenceType,
          startDate: now,
          nextRunDate: nextDue,
          estimatedCost: template.estimatedCostSar,
          organizationId: orgId,
        },
      });
      plansCreated++;
    }
  }

  return { plansCreated, unitsProcessed: allUnits.length };
}
