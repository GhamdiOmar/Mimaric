"use server";

import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { getSessionOrThrow } from "../../lib/auth-helpers";
import { validatePassword } from "../../lib/password-policy";
import { logAuditEvent } from "../../lib/audit";

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await getSessionOrThrow();

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.password) {
    return { error: "USER_NOT_FOUND" };
  }

  // Verify current password
  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    return { error: "WRONG_PASSWORD" };
  }

  // Check new password is different
  const isSame = await bcrypt.compare(data.newPassword, user.password);
  if (isSame) {
    return { error: "SAME_PASSWORD" };
  }

  // Validate new password
  const validation = validatePassword(data.newPassword, { name: user.name ?? undefined, email: user.email });
  if (!validation.valid) {
    return { error: "WEAK_PASSWORD", details: validation.errors };
  }

  // Hash and save
  const hashed = await bcrypt.hash(data.newPassword, 12);
  await db.user.update({ where: { id: user.id }, data: { password: hashed } });

  logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "PASSWORD_CHANGE",
    resource: "Auth",
    organizationId: user.organizationId,
  });

  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success to avoid email enumeration
  if (!user) {
    return { success: true };
  }

  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Log the reset link (email integration can be added later)
  console.log(`[Password Reset] Token for ${email}: ${token}`);
  console.log(`[Password Reset] Link: /auth/reset-password?token=${token}`);

  logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "PASSWORD_RESET_REQUEST",
    resource: "Auth",
    organizationId: user.organizationId,
  });

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { error: "INVALID_TOKEN" };
  }

  if (resetToken.usedAt) {
    return { error: "TOKEN_USED" };
  }

  if (new Date() > resetToken.expiresAt) {
    return { error: "TOKEN_EXPIRED" };
  }

  // Validate new password
  const validation = validatePassword(newPassword, {
    name: resetToken.user.name ?? undefined,
    email: resetToken.user.email,
  });
  if (!validation.valid) {
    return { error: "WEAK_PASSWORD", details: validation.errors };
  }

  // Hash and save
  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });

  // Mark token as used
  await db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });

  logAuditEvent({
    userId: resetToken.user.id,
    userEmail: resetToken.user.email,
    userRole: resetToken.user.role,
    action: "PASSWORD_RESET",
    resource: "Auth",
    organizationId: resetToken.user.organizationId,
  });

  return { success: true };
}
