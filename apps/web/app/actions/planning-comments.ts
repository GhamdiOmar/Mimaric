"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { createNotification } from "../../lib/create-notification";

export async function getPlanningComments(workspaceId: string, scenarioId?: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const where: any = { workspaceId, organizationId: orgId };
  if (scenarioId) where.scenarioId = scenarioId;

  const comments = await db.planningComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return JSON.parse(JSON.stringify(comments));
}

export async function createPlanningComment(data: {
  workspaceId: string;
  content: string;
  scenarioId?: string;
  featureId?: string;
  parentId?: string;
  mentions?: string[];
}) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const workspace = await db.planningWorkspace.findFirst({
    where: { id: data.workspaceId, organizationId: orgId },
  });
  if (!workspace) throw new Error("Planning workspace not found or you don't have access.");

  const comment = await db.planningComment.create({
    data: {
      content: data.content,
      authorId: session.userId,
      authorName: session.name,
      authorRole: session.role,
      workspaceId: data.workspaceId,
      scenarioId: data.scenarioId,
      featureId: data.featureId,
      parentId: data.parentId,
      mentions: data.mentions ?? [],
      organizationId: orgId,
    },
  });

  // Notify mentioned users
  if (data.mentions && data.mentions.length > 0) {
    for (const userId of data.mentions) {
      await createNotification({
        userId,
        type: "PLANNING_COMMENT_MENTION",
        title: `تم ذكرك في تعليق بمساحة التخطيط: ${workspace.name}`,
        titleEn: `You were mentioned in planning workspace: ${workspace.name}`,
        message: data.content.substring(0, 100),
        messageEn: data.content.substring(0, 100),
        link: `/dashboard/planning/${data.workspaceId}`,
        organizationId: orgId,
      });
    }
  }

  return JSON.parse(JSON.stringify(comment));
}

export async function deletePlanningComment(commentId: string) {
  const session = await requirePermission("planning:write");
  const orgId = session.organizationId;

  const comment = await db.planningComment.findFirst({
    where: { id: commentId, organizationId: orgId },
  });
  if (!comment) throw new Error("Comment not found. It may have already been deleted.");

  // Only author or admin can delete
  if (comment.authorId !== session.userId && session.role !== "COMPANY_ADMIN" && session.role !== "SYSTEM_ADMIN") {
    throw new Error("You can only delete your own comments. Please contact an administrator to remove other comments.");
  }

  await db.planningComment.delete({ where: { id: commentId } });
}
