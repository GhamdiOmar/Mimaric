"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { notifyAdmins } from "../../lib/create-notification";

// ─── Launch Waves ────────────────────────────────────────────────────────────

export async function getLaunchWaves(projectId: string) {
  const session = await requirePermission("launch:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const waves = await db.launchWave.findMany({
    where: { projectId },
    orderBy: { waveNumber: "asc" },
  });

  return JSON.parse(JSON.stringify(waves));
}

export async function createLaunchWave(data: {
  projectId: string;
  name?: string;
  nameArabic?: string;
  plannedDate?: string;
  inventoryCount?: number;
  channelConfig?: any;
  notes?: string;
}) {
  const session = await requirePermission("launch:write");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  // Get next wave number
  const existing = await db.launchWave.count({
    where: { projectId: data.projectId },
  });

  const wave = await db.launchWave.create({
    data: {
      projectId: data.projectId,
      waveNumber: existing + 1,
      name: data.name,
      nameArabic: data.nameArabic,
      status: "PLANNED" as any,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
      inventoryCount: data.inventoryCount,
      channelConfig: data.channelConfig,
      notes: data.notes,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(wave));
}

export async function updateLaunchWave(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    status?: string;
    plannedDate?: string;
    inventoryCount?: number;
    totalValueSar?: number;
    channelConfig?: any;
    notes?: string;
  }
) {
  const session = await requirePermission("launch:write");
  const orgId = session.organizationId;

  const existing = await db.launchWave.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Launch wave not found");

  const updated = await db.launchWave.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.plannedDate !== undefined && { plannedDate: new Date(data.plannedDate) }),
      ...(data.inventoryCount !== undefined && { inventoryCount: data.inventoryCount }),
      ...(data.totalValueSar !== undefined && { totalValueSar: data.totalValueSar }),
      ...(data.channelConfig !== undefined && { channelConfig: data.channelConfig }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteLaunchWave(id: string) {
  const session = await requirePermission("launch:write");
  const orgId = session.organizationId;

  const existing = await db.launchWave.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Launch wave not found");

  if (existing.status === "LAUNCHED") {
    throw new Error("Cannot delete a launched wave");
  }

  await db.launchWave.delete({ where: { id } });
}

/**
 * Launch a wave — changes status to LAUNCHED and records timestamp.
 */
export async function launchWave(id: string) {
  const session = await requirePermission("launch:write");
  const orgId = session.organizationId;

  const existing = await db.launchWave.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Launch wave not found");

  if (existing.status === "LAUNCHED" || existing.status === "CLOSED_WAVE") {
    throw new Error("Wave is already launched or closed");
  }

  const updated = await db.launchWave.update({
    where: { id },
    data: {
      status: "LAUNCHED" as any,
      launchedAt: new Date(),
    },
  });

  // Notify admins about wave launch
  try {
    const project = await db.project.findFirst({ where: { id: existing.projectId }, select: { name: true } });
    const pName = project?.name ?? existing.projectId;
    const wName = existing.nameArabic || existing.name || `الموجة ${existing.waveNumber}`;
    await notifyAdmins({
      type: "WAVE_LAUNCHED",
      title: `تم إطلاق ${wName} — ${pName}`,
      titleEn: `Wave Launched — ${pName}`,
      message: `تم إطلاق "${wName}" لمشروع "${pName}" بنجاح. يمكن الآن بدء عمليات البيع.`,
      messageEn: `"${existing.name || `Wave ${existing.waveNumber}`}" for "${pName}" has been launched. Sales can now begin.`,
      link: `/dashboard/projects/${existing.projectId}`,
      organizationId: orgId,
    });
  } catch (_) {
    // Best-effort notification
  }

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Close a launched wave.
 */
export async function closeWave(id: string) {
  const session = await requirePermission("launch:write");
  const orgId = session.organizationId;

  const existing = await db.launchWave.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Launch wave not found");

  if (existing.status !== "LAUNCHED") {
    throw new Error("Can only close a launched wave");
  }

  const updated = await db.launchWave.update({
    where: { id },
    data: { status: "CLOSED_WAVE" as any },
  });

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Get wave analytics for a project.
 */
export async function getWaveAnalytics(projectId: string) {
  const session = await requirePermission("launch:read");
  const orgId = session.organizationId;

  const waves = await db.launchWave.findMany({
    where: { projectId, organizationId: orgId },
  });

  const totalWaves = waves.length;
  const planned = waves.filter((w) => w.status === "PLANNED").length;
  const ready = waves.filter((w) => w.status === "READY_WAVE").length;
  const launched = waves.filter((w) => w.status === "LAUNCHED").length;
  const closed = waves.filter((w) => w.status === "CLOSED_WAVE").length;

  const totalInventory = waves.reduce((sum, w) => sum + (w.inventoryCount ?? 0), 0);
  const totalValue = waves.reduce(
    (sum, w) => sum + (w.totalValueSar ? Number(w.totalValueSar) : 0), 0
  );

  return { totalWaves, planned, ready, launched, closed, totalInventory, totalValue };
}
