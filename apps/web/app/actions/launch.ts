"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { notifyAdmins } from "../../lib/create-notification";

/**
 * Launch Readiness — Stage 11 & 12
 * Checklist validation, map inventory, reserve from inventory, sales tracking.
 */

// ─── Launch Readiness Checklist ─────────────────────────────────────────────

export async function getLaunchReadinessChecklist(projectId: string) {
  const session = await requirePermission("launch:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  // 1. Approved subdivision plan
  const approvedSubPlans = await db.subdivisionPlan.count({
    where: { projectId, status: "APPROVED", organizationId: orgId },
  });

  // 2. At least one approved approval submission
  const approvedApprovals = await db.approvalSubmission.count({
    where: { projectId, status: "APPROVED_FINAL", organizationId: orgId },
  });

  // 3. Infrastructure score >= 70%
  const infraItems = await db.infrastructureReadiness.findMany({
    where: { projectId, organizationId: orgId },
  });
  const infraScore = infraItems.length > 0
    ? Math.round(infraItems.reduce((sum: number, i: any) => sum + (i.readinessScore ?? 0), 0) / infraItems.length)
    : 0;

  // 4. Inventory exists
  const inventoryCount = await db.inventoryItem.count({
    where: { projectId, organizationId: orgId },
  });

  // 5. Pricing rules applied (at least 1 active rule)
  const activeRules = await db.pricingRule.count({
    where: { projectId, isActive: true, organizationId: orgId },
  });

  // 6. At least one wave planned
  const wavesCount = await db.launchWave.count({
    where: { projectId, organizationId: orgId },
  });

  const checklist = [
    {
      id: "subdivision",
      label: "Approved Subdivision Plan",
      labelAr: "مخطط تقسيم معتمد",
      passed: approvedSubPlans > 0,
      detail: `${approvedSubPlans} approved plan(s)`,
      detailAr: `${approvedSubPlans} مخطط معتمد`,
      fixTab: "subdivision",
    },
    {
      id: "approvals",
      label: "Authority Approval",
      labelAr: "موافقة الجهات",
      passed: approvedApprovals > 0,
      detail: `${approvedApprovals} approved submission(s)`,
      detailAr: `${approvedApprovals} موافقة نهائية`,
      fixTab: "approvals",
    },
    {
      id: "infrastructure",
      label: "Infrastructure Readiness ≥ 70%",
      labelAr: "جاهزية البنية التحتية ≥ 70%",
      passed: infraScore >= 70,
      detail: `${infraScore}% average readiness (${infraItems.length} categories)`,
      detailAr: `${infraScore}% متوسط الجاهزية (${infraItems.length} فئة)`,
      fixTab: "infrastructure",
    },
    {
      id: "inventory",
      label: "Inventory Created",
      labelAr: "إنشاء المخزون",
      passed: inventoryCount > 0,
      detail: `${inventoryCount} item(s)`,
      detailAr: `${inventoryCount} عنصر`,
      fixTab: "inventory",
    },
    {
      id: "pricing",
      label: "Pricing Rules Applied",
      labelAr: "تطبيق قواعد التسعير",
      passed: activeRules > 0,
      detail: `${activeRules} active rule(s)`,
      detailAr: `${activeRules} قاعدة نشطة`,
      fixTab: "pricing",
    },
    {
      id: "waves",
      label: "Launch Wave Planned",
      labelAr: "تخطيط موجة الإطلاق",
      passed: wavesCount > 0,
      detail: `${wavesCount} wave(s)`,
      detailAr: `${wavesCount} موجة`,
      fixTab: "launch",
    },
  ];

  return checklist;
}

// ─── Validate Launch Readiness ──────────────────────────────────────────────

export async function validateLaunchReadiness(projectId: string) {
  const session = await requirePermission("launch:read");
  const orgId = session.organizationId;
  const checklist = await getLaunchReadinessChecklist(projectId);
  const blockers = checklist.filter((item) => !item.passed);
  const ready = blockers.length === 0;

  // Notify admins when all checklist items pass
  if (ready) {
    const project = await db.project.findFirst({ where: { id: projectId }, select: { name: true } });
    const pName = project?.name ?? projectId;
    // Deduplicate: check if we already sent this notification in the last 30 days
    const recent = await db.notification.findFirst({
      where: {
        organizationId: orgId,
        type: "LAUNCH_READINESS_COMPLETE",
        link: `/dashboard/projects/${projectId}`,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (!recent) {
      await notifyAdmins({
        type: "LAUNCH_READINESS_COMPLETE",
        title: `جاهزية الإطلاق مكتملة — ${pName}`,
        titleEn: `Launch Readiness Complete — ${pName}`,
        message: `اجتاز مشروع "${pName}" جميع فحوصات جاهزية الإطلاق الستة. يمكنك الآن إطلاق الموجة الأولى.`,
        messageEn: `Project "${pName}" has passed all 6 launch readiness checks. You can now launch the first wave.`,
        link: `/dashboard/projects/${projectId}`,
        organizationId: orgId,
      });
    }
  }

  return {
    ready,
    items: checklist,
    blockers: blockers.map((b) => b.label),
    blockersAr: blockers.map((b) => b.labelAr),
  };
}

// ─── Map Inventory ──────────────────────────────────────────────────────────

export async function getMapInventory(projectId: string) {
  const session = await requirePermission("inventory:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const items = await db.inventoryItem.findMany({
    where: { projectId, organizationId: orgId },
    orderBy: { itemNumber: "asc" },
  });

  return JSON.parse(JSON.stringify(items));
}

// ─── Reserve Inventory Item ─────────────────────────────────────────────────

export async function reserveInventoryItem(data: {
  projectId: string;
  inventoryItemId: string;
  customerId: string;
  unitId: string;
  expiresAt?: string;
  amount?: number;
}) {
  const session = await requirePermission("reservations:write");
  const orgId = session.organizationId;

  // Validate inventory item belongs to org and is available
  const item = await db.inventoryItem.findFirst({
    where: { id: data.inventoryItemId, projectId: data.projectId, organizationId: orgId, status: "AVAILABLE_INV" },
  });
  if (!item) throw new Error("Inventory item not found or not available");

  // Validate customer
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId: orgId },
  });
  if (!customer) throw new Error("Customer not found");

  // Create reservation (unitId required by schema)
  const reservation = await db.reservation.create({
    data: {
      customerId: data.customerId,
      unitId: data.unitId,
      inventoryItemId: data.inventoryItemId,
      userId: session.userId,
      status: "PENDING",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      amount: data.amount ?? Number(item.basePriceSar ?? 0),
    },
  });

  // Update inventory item status
  await db.inventoryItem.update({
    where: { id: data.inventoryItemId },
    data: { status: "RESERVED_INV" },
  });

  // ─── Off-Plan Notification Triggers ───────────────────────────────────────
  try {
    const project = await db.project.findFirst({ where: { id: data.projectId }, select: { name: true } });
    const pName = project?.name ?? data.projectId;

    // Check conversion milestones (25/50/75/100%)
    const allItems = await db.inventoryItem.findMany({
      where: { projectId: data.projectId, organizationId: orgId },
      select: { status: true },
    });
    const total = allItems.length;
    const converted = allItems.filter((i) => ["RESERVED_INV", "SOLD_INV"].includes(i.status)).length;
    const pct = total > 0 ? Math.round((converted / total) * 100) : 0;

    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone) {
        const recent = await db.notification.findFirst({
          where: {
            organizationId: orgId,
            type: `INVENTORY_MILESTONE_${milestone}`,
            link: `/dashboard/projects/${data.projectId}`,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });
        if (!recent) {
          await notifyAdmins({
            type: `INVENTORY_MILESTONE_${milestone}`,
            title: `إنجاز ${milestone}% — ${pName}`,
            titleEn: `${milestone}% Milestone — ${pName}`,
            message: `تم تحويل ${milestone}% من مخزون "${pName}" (${converted} من ${total} عنصر).`,
            messageEn: `${milestone}% of "${pName}" inventory converted (${converted} of ${total} items).`,
            link: `/dashboard/projects/${data.projectId}`,
            organizationId: orgId,
          });
          break; // Only send highest milestone
        }
      }
    }

    // Low inventory alert (<10% available in project)
    const availableCount = allItems.filter((i) => i.status === "AVAILABLE_INV").length;
    if (total > 0 && availableCount > 0 && (availableCount / total) < 0.1) {
      const recentLow = await db.notification.findFirst({
        where: {
          organizationId: orgId,
          type: "INVENTORY_LOW",
          link: `/dashboard/projects/${data.projectId}`,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });
      if (!recentLow) {
        await notifyAdmins({
          type: "INVENTORY_LOW",
          title: `مخزون منخفض — ${pName}`,
          titleEn: `Low Inventory — ${pName}`,
          message: `بقي ${availableCount} عنصر متاح فقط من أصل ${total} في "${pName}". يُرجى مراجعة المخزون.`,
          messageEn: `Only ${availableCount} of ${total} items remain available in "${pName}". Please review inventory.`,
          link: `/dashboard/projects/${data.projectId}`,
          organizationId: orgId,
        });
      }
    }
  } catch (_) {
    // Notifications are best-effort — don't fail the reservation
  }

  return JSON.parse(JSON.stringify(reservation));
}

// ─── Sales Tracking ─────────────────────────────────────────────────────────

export async function getSalesTracking(projectId: string) {
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

  const tracking = waves.map((wave: any) => {
    const waveItems = items.filter((i: any) => i.releasePhase === wave.waveNumber);
    const available = waveItems.filter((i: any) => i.status === "AVAILABLE_INV").length;
    const reserved = waveItems.filter((i: any) => i.status === "RESERVED_INV").length;
    const sold = waveItems.filter((i: any) => i.status === "SOLD_INV").length;
    const revenue = waveItems
      .filter((i: any) => i.status === "SOLD_INV")
      .reduce((sum: number, i: any) => sum + Number(i.finalPriceSar ?? i.basePriceSar ?? 0), 0);

    return {
      waveNumber: wave.waveNumber,
      name: wave.name,
      nameArabic: wave.nameArabic,
      status: wave.status,
      total: waveItems.length,
      available,
      reserved,
      sold,
      revenue,
    };
  });

  return JSON.parse(JSON.stringify(tracking));
}
