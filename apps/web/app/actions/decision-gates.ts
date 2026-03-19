"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

/**
 * Valid stage transitions for the off-plan lifecycle.
 * Each entry defines: fromStage → toStage
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  // Standard project lifecycle
  PLANNING: ["UNDER_CONSTRUCTION"],
  UNDER_CONSTRUCTION: ["READY"],
  READY: ["HANDED_OVER"],
  // Land acquisition lifecycle
  LAND_IDENTIFIED: ["LAND_UNDER_REVIEW"],
  LAND_UNDER_REVIEW: ["LAND_ACQUIRED"],
  LAND_ACQUIRED: ["CONCEPT_DESIGN", "PLANNING"],
  // Off-plan lifecycle
  CONCEPT_DESIGN: ["SUBDIVISION_PLANNING"],
  SUBDIVISION_PLANNING: ["AUTHORITY_SUBMISSION"],
  AUTHORITY_SUBMISSION: ["INFRASTRUCTURE_PLANNING"],
  INFRASTRUCTURE_PLANNING: ["INVENTORY_STRUCTURING"],
  INVENTORY_STRUCTURING: ["PRICING_PACKAGING"],
  PRICING_PACKAGING: ["LAUNCH_READINESS"],
  LAUNCH_READINESS: ["OFF_PLAN_LAUNCHED"],
};

export async function getDecisionGates(projectId: string) {
  const session = await requirePermission("decision_gates:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const gates = await db.decisionGate.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(gates));
}

/**
 * Request a stage transition — creates a pending DecisionGate.
 * Only COMPANY_ADMIN or SYSTEM_ADMIN can approve gates.
 */
export async function requestStageTransition(data: {
  projectId: string;
  toStage: string;
  notes?: string;
}) {
  const session = await requirePermission("decision_gates:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found or you don't have access to it. Please check the project ID and try again.");

  const fromStage = project.status;

  // Validate the transition is allowed
  const allowedNext = VALID_TRANSITIONS[fromStage] ?? [];

  if (!allowedNext.includes(data.toStage)) {
    throw new Error(
      `Cannot transition the project from its current stage to the requested stage. The allowed next stages are: ${allowedNext.join(", ") || "none"}. Please review the project lifecycle requirements.`
    );
  }

  // Check if there's already a pending gate for this transition
  const existingPending = await db.decisionGate.findFirst({
    where: {
      projectId: data.projectId,
      fromStage,
      toStage: data.toStage,
      decision: "PENDING",
    },
  });
  if (existingPending) {
    throw new Error("A pending transition request already exists for this stage. Please wait for the existing request to be reviewed.");
  }

  const gate = await db.decisionGate.create({
    data: {
      projectId: data.projectId,
      fromStage,
      toStage: data.toStage,
      decision: "PENDING",
      notes: data.notes,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(gate));
}

/**
 * Approve/reject/defer a stage gate decision.
 * Requires decision_gates:write permission (COMPANY_ADMIN only).
 * On approval, automatically transitions the project status.
 */
export async function resolveDecisionGate(
  gateId: string,
  data: {
    decision: "APPROVED" | "REJECTED" | "DEFERRED";
    notes?: string;
    conditions?: any[];
  }
) {
  const session = await requirePermission("decision_gates:write");
  const orgId = session.organizationId;

  const gate = await db.decisionGate.findFirst({
    where: { id: gateId, organizationId: orgId, decision: "PENDING" },
  });
  if (!gate) throw new Error("This decision gate was not found or has already been resolved. Please refresh the page.");

  // Update the gate
  const updated = await db.decisionGate.update({
    where: { id: gateId },
    data: {
      decision: data.decision as any,
      decidedBy: session.userId,
      decidedAt: new Date(),
      notes: data.notes,
      conditions: data.conditions,
    },
  });

  // If approved, transition the project status
  if (data.decision === "APPROVED") {
    const updateData: any = {
      status: gate.toStage as any,
    };
    // Set acquisition date when transitioning to LAND_ACQUIRED
    if (gate.toStage === "LAND_ACQUIRED") {
      updateData.acquisitionDate = new Date();
    }
    await db.project.update({
      where: { id: gate.projectId },
      data: updateData,
    });
  }

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Get the latest gate status for a project's current stage.
 * Returns the most recent decision gate for the project.
 */
export async function getLatestGateStatus(projectId: string) {
  const session = await requirePermission("decision_gates:read");
  const orgId = session.organizationId;

  const gate = await db.decisionGate.findFirst({
    where: { projectId, organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return gate ? JSON.parse(JSON.stringify(gate)) : null;
}

/**
 * Get the full stage history — all decision gates in chronological order.
 */
export async function getStageHistory(projectId: string) {
  const session = await requirePermission("decision_gates:read");
  const orgId = session.organizationId;

  const gates = await db.decisionGate.findMany({
    where: { projectId, organizationId: orgId },
    orderBy: { createdAt: "asc" },
  });

  return JSON.parse(JSON.stringify(gates));
}
