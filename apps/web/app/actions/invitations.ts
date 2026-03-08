"use server";

import { db } from "@repo/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requirePermission, getSessionOrThrow } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { createNotification } from "../../lib/create-notification";
import { validatePassword } from "../../lib/password-policy";
import { signIn } from "../../auth";

// ─── Create Invitation ────────────────────────────────────────────────────────

export async function createInvitation(data: { email: string; role?: string }) {
  try {
    const session = await requirePermission("team:write");

    const email = data.email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email address" };
    }

    // Check if email already belongs to an existing user
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    // Check if already invited to this org with a pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email,
        organizationId: session.organizationId,
        status: "PENDING_INVITE",
      },
    });
    if (existingInvitation) {
      return { success: false, error: "An invitation has already been sent to this email" };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.invitation.create({
      data: {
        email,
        token,
        role: (data.role || "USER") as any,
        organizationId: session.organizationId,
        invitedById: session.userId,
        status: "PENDING_INVITE",
        expiresAt,
      },
    });

    logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: "CREATE",
      resource: "Invitation",
      resourceId: invitation.id,
      metadata: { invitedEmail: email, role: data.role || "USER" },
      organizationId: session.organizationId,
    });

    revalidatePath("/dashboard/settings/team");

    return {
      success: true,
      token,
      inviteUrl: `/auth/invite/${token}`,
    };
  } catch (error: any) {
    console.error("[Invitations] createInvitation error:", error);
    return { success: false, error: error.message || "Failed to create invitation" };
  }
}

// ─── Accept Invitation ────────────────────────────────────────────────────────

export async function acceptInvitation(data: {
  token: string;
  name: string;
  password: string;
}) {
  try {
    // Find invitation by token
    const invitation = await db.invitation.findFirst({
      where: { token: data.token, status: "PENDING_INVITE" },
      include: {
        organization: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found or has already been used" };
    }

    // Check expiry
    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED_INVITE" },
      });
      return { success: false, error: "This invitation has expired" };
    }

    // Check email not already taken
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    // Validate password strength
    const validation = validatePassword(data.password, {
      name: data.name,
      email: invitation.email,
    });
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.map((e) => e.en).join(" "),
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: data.name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        organizationId: invitation.organizationId,
        onboardingCompleted: true,
        invitedVia: "invitation",
        invitedBy: invitation.invitedById,
      },
    });

    // Update invitation status
    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED_INVITE",
        acceptedById: user.id,
        acceptedAt: new Date(),
      },
    });

    // Notify the inviter
    await createNotification({
      userId: invitation.invitedById,
      type: "INVITATION_ACCEPTED",
      title: `${data.name} قبل الدعوة`,
      titleEn: `${data.name} accepted the invitation`,
      message: `${data.name} (${invitation.email}) انضم للمنظمة بنجاح`,
      messageEn: `${data.name} (${invitation.email}) has joined the organization`,
      link: "/dashboard/settings/team",
      organizationId: invitation.organizationId,
    });

    logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "CREATE",
      resource: "User",
      resourceId: user.id,
      metadata: { invitationId: invitation.id, invitedVia: "invitation" },
      organizationId: invitation.organizationId,
    });

    // Auto-sign in
    await signIn("credentials", {
      email: invitation.email,
      password: data.password,
      redirect: false,
    });

    return { success: true, redirect: "/dashboard" };
  } catch (error: any) {
    console.error("[Invitations] acceptInvitation error:", error);
    return { success: false, error: error.message || "Failed to accept invitation" };
  }
}

// ─── Get Invitation By Token ──────────────────────────────────────────────────

export async function getInvitationByToken(token: string) {
  try {
    const invitation = await db.invitation.findFirst({
      where: { token },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } },
      },
    });

    if (!invitation) {
      return { valid: false, error: "Invitation not found" };
    }

    if (invitation.status !== "PENDING_INVITE") {
      return { valid: false, error: "This invitation has already been used or revoked" };
    }

    if (invitation.expiresAt < new Date()) {
      return { valid: false, error: "This invitation has expired" };
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      orgName: invitation.organization.name,
      inviterName: invitation.invitedBy.name,
    };
  } catch (error: any) {
    console.error("[Invitations] getInvitationByToken error:", error);
    return { valid: false, error: "Failed to validate invitation" };
  }
}

// ─── Get Org Invitations ──────────────────────────────────────────────────────

export async function getOrgInvitations() {
  try {
    const session = await requirePermission("team:read");

    return db.invitation.findMany({
      where: { organizationId: session.organizationId },
      include: {
        invitedBy: { select: { name: true } },
        acceptedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    console.error("[Invitations] getOrgInvitations error:", error);
    throw new Error("Failed to fetch invitations");
  }
}

// ─── Revoke Invitation ────────────────────────────────────────────────────────

export async function revokeInvitation(invitationId: string) {
  try {
    const session = await requirePermission("team:write");

    const invitation = await db.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: session.organizationId,
        status: "PENDING_INVITE",
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found or already processed" };
    }

    await db.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED_INVITE" },
    });

    logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: "UPDATE",
      resource: "Invitation",
      resourceId: invitationId,
      metadata: { action: "revoked", email: invitation.email },
      organizationId: session.organizationId,
    });

    revalidatePath("/dashboard/settings/team");

    return { success: true };
  } catch (error: any) {
    console.error("[Invitations] revokeInvitation error:", error);
    return { success: false, error: error.message || "Failed to revoke invitation" };
  }
}

// ─── Resend Invitation ────────────────────────────────────────────────────────

export async function resendInvitation(invitationId: string) {
  try {
    const session = await requirePermission("team:write");

    const invitation = await db.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: session.organizationId,
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    const newToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt,
        status: invitation.status === "EXPIRED_INVITE" ? "PENDING_INVITE" : invitation.status,
      },
    });

    logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: "UPDATE",
      resource: "Invitation",
      resourceId: invitationId,
      metadata: { action: "resent", email: invitation.email },
      organizationId: session.organizationId,
    });

    revalidatePath("/dashboard/settings/team");

    return {
      success: true,
      token: newToken,
      inviteUrl: `/auth/invite/${newToken}`,
    };
  } catch (error: any) {
    console.error("[Invitations] resendInvitation error:", error);
    return { success: false, error: error.message || "Failed to resend invitation" };
  }
}
