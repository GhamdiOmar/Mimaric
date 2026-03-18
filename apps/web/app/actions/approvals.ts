"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";

// ─── Approval Submissions ───────────────────────────────────────────────────

export async function getApprovalSubmissions(projectId: string) {
  const session = await requirePermission("approvals:read");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const submissions = await db.approvalSubmission.findMany({
    where: { projectId },
    include: {
      _count: { select: { comments: true, conditions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(submissions));
}

export async function getApprovalDetail(submissionId: string) {
  const session = await requirePermission("approvals:read");
  const orgId = session.organizationId;

  const submission = await db.approvalSubmission.findFirst({
    where: { id: submissionId, organizationId: orgId },
    include: {
      comments: { orderBy: { createdAt: "desc" } },
      conditions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!submission) throw new Error("Submission not found");

  return JSON.parse(JSON.stringify(submission));
}

export async function createApprovalSubmission(data: {
  projectId: string;
  authority: string;
  authorityArabic?: string;
  type: string;
  referenceNumber?: string;
  documentIds?: string[];
}) {
  const session = await requirePermission("approvals:submit");
  const orgId = session.organizationId;

  const project = await db.project.findFirst({
    where: { id: data.projectId, organizationId: orgId },
  });
  if (!project) throw new Error("Project not found");

  const submission = await db.approvalSubmission.create({
    data: {
      projectId: data.projectId,
      authority: data.authority,
      authorityArabic: data.authorityArabic,
      type: data.type as any,
      referenceNumber: data.referenceNumber,
      documentIds: data.documentIds ?? [],
      status: "DRAFT_APPROVAL" as any,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(submission));
}

export async function updateApprovalSubmission(
  id: string,
  data: {
    authority?: string;
    authorityArabic?: string;
    referenceNumber?: string;
    status?: string;
    responseDate?: string;
    responseNotes?: string;
    documentIds?: string[];
  }
) {
  const session = await requirePermission("approvals:write");
  const orgId = session.organizationId;

  const existing = await db.approvalSubmission.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Submission not found");

  const updated = await db.approvalSubmission.update({
    where: { id },
    data: {
      ...(data.authority !== undefined && { authority: data.authority }),
      ...(data.authorityArabic !== undefined && { authorityArabic: data.authorityArabic }),
      ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.responseDate !== undefined && { responseDate: new Date(data.responseDate) }),
      ...(data.responseNotes !== undefined && { responseNotes: data.responseNotes }),
      ...(data.documentIds !== undefined && { documentIds: data.documentIds }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Submit a draft submission (changes status from DRAFT to SUBMITTED).
 */
export async function submitApproval(id: string) {
  const session = await requirePermission("approvals:submit");
  const orgId = session.organizationId;

  const existing = await db.approvalSubmission.findFirst({
    where: { id, organizationId: orgId, status: "DRAFT_APPROVAL" },
  });
  if (!existing) throw new Error("Submission not found or already submitted");

  const updated = await db.approvalSubmission.update({
    where: { id },
    data: {
      status: "SUBMITTED" as any,
      submittedAt: new Date(),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

/**
 * Create a resubmission based on a rejected/requires-resubmission.
 */
export async function createResubmission(parentSubmissionId: string) {
  const session = await requirePermission("approvals:submit");
  const orgId = session.organizationId;

  const parent = await db.approvalSubmission.findFirst({
    where: { id: parentSubmissionId, organizationId: orgId },
  });
  if (!parent) throw new Error("Parent submission not found");

  const submission = await db.approvalSubmission.create({
    data: {
      projectId: parent.projectId,
      authority: parent.authority,
      authorityArabic: parent.authorityArabic,
      type: parent.type,
      referenceNumber: parent.referenceNumber,
      documentIds: parent.documentIds,
      status: "DRAFT_APPROVAL" as any,
      parentSubmissionId: parent.id,
      revisionNumber: parent.revisionNumber + 1,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(submission));
}

export async function deleteApprovalSubmission(id: string) {
  const session = await requirePermission("approvals:write");
  const orgId = session.organizationId;

  const existing = await db.approvalSubmission.findFirst({
    where: { id, organizationId: orgId, status: "DRAFT_APPROVAL" },
  });
  if (!existing) throw new Error("Can only delete draft submissions");

  // Delete associated comments and conditions first
  await db.approvalComment.deleteMany({ where: { submissionId: id } });
  await db.approvalCondition.deleteMany({ where: { submissionId: id } });
  await db.approvalSubmission.delete({ where: { id } });
}

// ─── Comments ───────────────────────────────────────────────────────────────

export async function addApprovalComment(data: {
  submissionId: string;
  author?: string;
  comment: string;
  type?: string;
}) {
  const session = await requirePermission("approvals:write");

  const comment = await db.approvalComment.create({
    data: {
      submissionId: data.submissionId,
      author: data.author,
      comment: data.comment,
      type: (data.type as any) ?? "COMMENT",
      status: "OPEN" as any,
    },
  });

  return JSON.parse(JSON.stringify(comment));
}

export async function resolveComment(
  commentId: string,
  data: { resolution: string }
) {
  const session = await requirePermission("approvals:write");

  const existing = await db.approvalComment.findFirst({
    where: { id: commentId },
  });
  if (!existing) throw new Error("Comment not found");

  const updated = await db.approvalComment.update({
    where: { id: commentId },
    data: {
      status: "RESOLVED" as any,
      resolvedBy: session.userId,
      resolvedAt: new Date(),
      resolution: data.resolution,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteApprovalComment(commentId: string) {
  const session = await requirePermission("approvals:write");

  const existing = await db.approvalComment.findFirst({ where: { id: commentId } });
  if (!existing) throw new Error("Comment not found");

  await db.approvalComment.delete({ where: { id: commentId } });
}

// ─── Conditions ─────────────────────────────────────────────────────────────

export async function addApprovalCondition(data: {
  submissionId: string;
  condition: string;
  conditionArabic?: string;
}) {
  const session = await requirePermission("approvals:write");

  const cond = await db.approvalCondition.create({
    data: {
      submissionId: data.submissionId,
      condition: data.condition,
      conditionArabic: data.conditionArabic,
    },
  });

  return JSON.parse(JSON.stringify(cond));
}

export async function markConditionMet(
  conditionId: string,
  data: { evidence?: string }
) {
  const session = await requirePermission("approvals:write");

  const existing = await db.approvalCondition.findFirst({
    where: { id: conditionId },
  });
  if (!existing) throw new Error("Condition not found");

  const updated = await db.approvalCondition.update({
    where: { id: conditionId },
    data: {
      isMet: true,
      metAt: new Date(),
      evidence: data.evidence,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function unmarkConditionMet(conditionId: string) {
  const session = await requirePermission("approvals:write");

  const existing = await db.approvalCondition.findFirst({
    where: { id: conditionId },
  });
  if (!existing) throw new Error("Condition not found");

  const updated = await db.approvalCondition.update({
    where: { id: conditionId },
    data: {
      isMet: false,
      metAt: null,
      evidence: null,
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

// ─── Summary ────────────────────────────────────────────────────────────────

export async function getApprovalStats(projectId: string) {
  const session = await requirePermission("approvals:read");
  const orgId = session.organizationId;

  const submissions = await db.approvalSubmission.findMany({
    where: { projectId, organizationId: orgId },
    include: {
      _count: { select: { comments: true, conditions: true } },
      conditions: true,
    },
  });

  const total = submissions.length;
  const approved = submissions.filter(
    (s: any) => s.status === "APPROVED_FINAL" || s.status === "APPROVED_WITH_CONDITIONS"
  ).length;
  const pending = submissions.filter(
    (s: any) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW_APPROVAL"
  ).length;
  const rejected = submissions.filter(
    (s: any) => s.status === "REJECTED_APPROVAL" || s.status === "RESUBMISSION_REQUIRED"
  ).length;

  const totalConditions = submissions.reduce(
    (sum: number, s: any) => sum + s.conditions.length, 0
  );
  const metConditions = submissions.reduce(
    (sum: number, s: any) => sum + s.conditions.filter((c: any) => c.isMet).length, 0
  );

  return { total, approved, pending, rejected, totalConditions, metConditions };
}

// ─── RED: Follow-Up Tasks ───────────────────────────────────────────────────

export async function addFollowUpTask(
  submissionId: string,
  data: { task: string; taskArabic?: string; assignedTo?: string; dueDate?: string }
) {
  const session = await requirePermission("approvals:write");

  const submission = await db.approvalSubmission.findFirst({
    where: { id: submissionId, organizationId: session.organizationId },
  });
  if (!submission) throw new Error("Submission not found");

  const followUp = await db.approvalFollowUp.create({
    data: {
      submissionId,
      task: data.task,
      taskArabic: data.taskArabic,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({
    userId: session.userId, userEmail: session.email, userRole: session.role,
    action: "CREATE", resource: "ApprovalFollowUp", resourceId: followUp.id,
    metadata: { submissionId, task: data.task },
    organizationId: session.organizationId,
  });

  return JSON.parse(JSON.stringify(followUp));
}

export async function updateFollowUpStatus(
  followUpId: string,
  status: string
) {
  const session = await requirePermission("approvals:write");

  const followUp = await db.approvalFollowUp.findFirst({
    where: { id: followUpId, organizationId: session.organizationId },
  });
  if (!followUp) throw new Error("Follow-up task not found");

  const updated = await db.approvalFollowUp.update({
    where: { id: followUpId },
    data: {
      status: status as any,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  logAuditEvent({
    userId: session.userId, userEmail: session.email, userRole: session.role,
    action: "UPDATE", resource: "ApprovalFollowUp", resourceId: followUpId,
    before: { status: followUp.status },
    after: { status },
    organizationId: session.organizationId,
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getBlockingApprovals(module?: string) {
  const session = await requirePermission("approvals:read");

  const where: any = {
    organizationId: session.organizationId,
    isBlocking: true,
    status: { notIn: ["APPROVED_FINAL", "APPROVED_WITH_CONDITIONS"] },
  };
  if (module) where.blockingModule = module;

  const submissions = await db.approvalSubmission.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { followUps: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(submissions));
}

export async function getApprovalFollowUps(submissionId: string) {
  const session = await requirePermission("approvals:read");

  const submission = await db.approvalSubmission.findFirst({
    where: { id: submissionId, organizationId: session.organizationId },
  });
  if (!submission) throw new Error("Submission not found");

  const followUps = await db.approvalFollowUp.findMany({
    where: { submissionId },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(followUps));
}
