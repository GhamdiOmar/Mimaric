"use server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../../lib/auth-helpers";

/** Get all phases for a project with readiness rules */
export async function getProjectPhases(projectId: string) {
  const session = await requirePermission("gis:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found or you don't have access.");

  const phases = await db.phase.findMany({
    where: { projectId },
    include: {
      readinessRules: {
        where: { organizationId: orgId },
        orderBy: { ruleType: "asc" },
      },
      _count: { select: { buildings: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return JSON.parse(JSON.stringify(phases));
}

/** Create or update a readiness rule for a phase */
export async function upsertPhaseReadinessRule(data: {
  id?: string;
  phaseId: string;
  ruleType: string;
  ruleLabel: string;
  ruleLabelAr: string;
  isMet: boolean;
  evidence?: string;
  notes?: string;
}) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  if (data.id) {
    const existing = await db.phaseReadinessRule.findFirst({
      where: { id: data.id, organizationId: orgId },
    });
    if (!existing) throw new Error("Readiness rule not found.");

    const updated = await db.phaseReadinessRule.update({
      where: { id: data.id },
      data: {
        isMet: data.isMet,
        evidence: data.evidence,
        notes: data.notes,
        checkedBy: session.userId,
        checkedAt: data.isMet ? new Date() : null,
      },
    });
    revalidatePath("/dashboard/gis/phases");
    return JSON.parse(JSON.stringify(updated));
  }

  const created = await db.phaseReadinessRule.create({
    data: {
      phaseId: data.phaseId,
      ruleType: data.ruleType,
      ruleLabel: data.ruleLabel,
      ruleLabelAr: data.ruleLabelAr,
      isMet: data.isMet,
      evidence: data.evidence,
      notes: data.notes,
      checkedBy: data.isMet ? session.userId : undefined,
      checkedAt: data.isMet ? new Date() : undefined,
      organizationId: orgId,
    },
  });
  revalidatePath("/dashboard/gis/phases");
  return JSON.parse(JSON.stringify(created));
}

/** Initialize default readiness rules for a phase */
export async function initializePhaseReadinessRules(phaseId: string) {
  const session = await requirePermission("gis:write");
  const orgId = session.organizationId;

  const existing = await db.phaseReadinessRule.count({
    where: { phaseId, organizationId: orgId },
  });
  if (existing > 0) return; // Already initialized

  const defaultRules = [
    { ruleType: "ACCESS_ROAD", ruleLabel: "Access road exists and is approved", ruleLabelAr: "طريق الوصول موجود ومعتمد" },
    { ruleType: "WATER", ruleLabel: "Water connection available", ruleLabelAr: "توصيل المياه متاح" },
    { ruleType: "SEWER", ruleLabel: "Sewer connection available", ruleLabelAr: "توصيل الصرف الصحي متاح" },
    { ruleType: "POWER", ruleLabel: "Power supply connected", ruleLabelAr: "توصيل الكهرباء متاح" },
    { ruleType: "TELECOM", ruleLabel: "Telecom infrastructure ready", ruleLabelAr: "البنية التحتية للاتصالات جاهزة" },
    { ruleType: "PERMITS", ruleLabel: "Planning approvals complete", ruleLabelAr: "الموافقات التخطيطية مكتملة" },
    { ruleType: "SERVICES", ruleLabel: "Community services addressed", ruleLabelAr: "الخدمات المجتمعية متوفرة" },
  ];

  await db.phaseReadinessRule.createMany({
    data: defaultRules.map(r => ({
      phaseId,
      ...r,
      organizationId: orgId,
    })),
  });

  revalidatePath("/dashboard/gis/phases");
}
