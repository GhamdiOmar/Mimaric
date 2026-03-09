"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

/**
 * Analytics — Off-Plan Development Pipeline & Performance
 */

// ─── Development Pipeline ───────────────────────────────────────────────────

const OFF_PLAN_STAGES = [
  { status: "LAND_IDENTIFIED", label: "Land Identified", labelAr: "تم التحديد" },
  { status: "LAND_UNDER_REVIEW", label: "Under Review", labelAr: "قيد المراجعة" },
  { status: "LAND_ACQUIRED", label: "Acquired", labelAr: "تم الاستحواذ" },
  { status: "CONCEPT_DESIGN", label: "Concept Design", labelAr: "التصميم المبدئي" },
  { status: "SUBDIVISION_PLANNING", label: "Subdivision", labelAr: "تخطيط التقسيم" },
  { status: "AUTHORITY_SUBMISSION", label: "Authority Submission", labelAr: "تقديم للجهات" },
  { status: "INFRASTRUCTURE_PLANNING", label: "Infrastructure", labelAr: "البنية التحتية" },
  { status: "INVENTORY_STRUCTURING", label: "Inventory", labelAr: "هيكلة المخزون" },
  { status: "PRICING_PACKAGING", label: "Pricing", labelAr: "التسعير" },
  { status: "LAUNCH_READINESS", label: "Launch Ready", labelAr: "جاهزية الإطلاق" },
  { status: "OFF_PLAN_LAUNCHED", label: "Launched", labelAr: "تم الإطلاق" },
];

export async function getDevelopmentPipeline() {
  const session = await requirePermission("dashboard:read");
  const orgId = session.organizationId;

  const projects = await db.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: OFF_PLAN_STAGES.map((s) => s.status) as any },
    },
    select: { id: true, name: true, status: true },
  });

  const stages = OFF_PLAN_STAGES.map((stage) => {
    const stageProjects = projects.filter((p: any) => p.status === stage.status);
    return {
      status: stage.status,
      label: stage.label,
      labelAr: stage.labelAr,
      count: stageProjects.length,
      projects: stageProjects.map((p: any) => ({ id: p.id, name: p.name })),
    };
  });

  return { stages, totalProjects: projects.length };
}

// ─── Approval Analytics ─────────────────────────────────────────────────────

export async function getApprovalAnalytics() {
  const session = await requirePermission("reports:read");
  const orgId = session.organizationId;

  const submissions = await db.approvalSubmission.findMany({
    where: { organizationId: orgId },
  });

  const total = submissions.length;
  const approved = submissions.filter((s: any) => s.status === "APPROVED_FINAL" || s.status === "APPROVED_WITH_CONDITIONS").length;
  const rejected = submissions.filter((s: any) => s.status === "REJECTED_APPROVAL").length;
  const pending = submissions.filter((s: any) => ["DRAFT_APPROVAL", "SUBMITTED", "UNDER_REVIEW_APPROVAL", "RESUBMISSION_REQUIRED"].includes(s.status)).length;

  // Average processing time (submittedAt to responseDate)
  const processed = submissions.filter((s: any) => s.submittedAt && s.responseDate);
  const avgProcessingDays = processed.length > 0
    ? Math.round(
        processed.reduce((sum: number, s: any) => {
          const diff = new Date(s.responseDate).getTime() - new Date(s.submittedAt).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / processed.length
      )
    : 0;

  // By type
  const byType: Record<string, { total: number; approved: number; pending: number }> = {};
  for (const s of submissions) {
    const type = (s as any).type;
    if (!byType[type]) byType[type] = { total: 0, approved: 0, pending: 0 };
    byType[type]!.total++;
    if ((s as any).status === "APPROVED_FINAL" || (s as any).status === "APPROVED_WITH_CONDITIONS") byType[type]!.approved++;
    if (["DRAFT_APPROVAL", "SUBMITTED", "UNDER_REVIEW_APPROVAL"].includes((s as any).status)) byType[type]!.pending++;
  }

  return { total, approved, rejected, pending, avgProcessingDays, byType };
}

// ─── Pricing Analytics ──────────────────────────────────────────────────────

export async function getPricingAnalytics(projectId: string) {
  const session = await requirePermission("pricing:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
  });

  // Group by product type
  const grouped: Record<string, { prices: number[]; areas: number[] }> = {};
  for (const item of items) {
    const type = (item as any).productType;
    if (!grouped[type]) grouped[type] = { prices: [], areas: [] };
    const price = Number((item as any).finalPriceSar ?? (item as any).basePriceSar ?? 0);
    const area = Number((item as any).areaSqm ?? 0);
    if (price > 0 && area > 0) {
      grouped[type]!.prices.push(price);
      grouped[type]!.areas.push(area);
    }
  }

  const byProductType = Object.entries(grouped).map(([type, data]) => {
    const pricesPerSqm = data.prices.map((p, i) => p / data.areas[i]!);
    return {
      type,
      count: data.prices.length,
      avgPricePerSqm: Math.round(pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length),
      minPricePerSqm: Math.round(Math.min(...pricesPerSqm)),
      maxPricePerSqm: Math.round(Math.max(...pricesPerSqm)),
      totalValue: data.prices.reduce((a, b) => a + b, 0),
    };
  });

  const overallPrices = items
    .filter((i: any) => Number(i.finalPriceSar ?? i.basePriceSar ?? 0) > 0 && Number(i.areaSqm ?? 0) > 0)
    .map((i: any) => Number(i.finalPriceSar ?? i.basePriceSar) / Number(i.areaSqm));
  const avgPricePerSqm = overallPrices.length > 0
    ? Math.round(overallPrices.reduce((a: number, b: number) => a + b, 0) / overallPrices.length)
    : 0;
  const totalValue = items.reduce((sum: number, i: any) => sum + Number(i.finalPriceSar ?? i.basePriceSar ?? 0), 0);

  return JSON.parse(JSON.stringify({ byProductType, overall: { avgPricePerSqm, totalValue, itemCount: items.length } }));
}

// ─── Wave Performance ───────────────────────────────────────────────────────

export async function getWavePerformance(projectId: string) {
  const session = await requirePermission("launch:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const waves = await db.launchWave.findMany({
    where: { projectId, organizationId: orgId },
    orderBy: { waveNumber: "asc" },
  });

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
  });

  const performance = waves.map((wave: any) => {
    const waveItems = items.filter((i: any) => i.releasePhase === wave.waveNumber);
    const released = waveItems.filter((i: any) => i.status !== "UNRELEASED").length;
    const reserved = waveItems.filter((i: any) => i.status === "RESERVED_INV").length;
    const sold = waveItems.filter((i: any) => i.status === "SOLD_INV").length;
    const revenue = waveItems
      .filter((i: any) => i.status === "SOLD_INV")
      .reduce((sum: number, i: any) => sum + Number(i.finalPriceSar ?? i.basePriceSar ?? 0), 0);
    const conversionRate = released > 0 ? Math.round(((reserved + sold) / released) * 100) : 0;

    return {
      waveNumber: wave.waveNumber,
      name: wave.name,
      nameArabic: wave.nameArabic,
      status: wave.status,
      total: waveItems.length,
      released,
      reserved,
      sold,
      revenue,
      conversionRate,
    };
  });

  return JSON.parse(JSON.stringify(performance));
}
