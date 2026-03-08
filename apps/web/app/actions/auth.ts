"use server";

import { signIn } from "../../auth";
import { AuthError } from "next-auth";
import { db } from "@repo/db";
import bcrypt from "bcryptjs";
import { validatePassword } from "../../lib/password-policy";
import { logAuditEvent } from "../../lib/audit";

const ALLOWED_LANDING_PAGES = [
  "/dashboard", "/dashboard/projects", "/dashboard/units",
  "/dashboard/sales/customers", "/dashboard/sales/contracts",
  "/dashboard/leases", "/dashboard/finance", "/dashboard/maintenance",
  "/dashboard/reports", "/dashboard/settings",
];

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Look up user's preferred landing page
  let redirectTo = "/dashboard";
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { preferences: true },
    });
    const prefs = user?.preferences as any;
    if (prefs?.landingPage && ALLOWED_LANDING_PAGES.includes(prefs.landingPage)) {
      redirectTo = prefs.landingPage;
    }
  } catch {}

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      // The error message might be wrapped by NextAuth
      const message = error.cause?.err?.message || error.message;

      if (message === "USER_NOT_FOUND") {
        return { error: "USER_NOT_FOUND" };
      }
      if (message === "INVALID_PASSWORD") {
        return { error: "INVALID_PASSWORD" };
      }
      if (message === "DATABASE_ERROR") {
        return { error: "DATABASE_ERROR" };
      }
      if (message?.startsWith("RATE_LIMITED")) {
        return { error: message };
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "INVALID_CREDENTIALS" };
        default:
          return { error: "AUTH_ERROR" };
      }
    }

    // For non-AuthErrors that might bubble up (like redirects in Next.js which are actually errors)
    if (error.message?.includes("NEXT_REDIRECT")) {
        throw error;
    }

    console.error("Login action error:", error);
    return { error: "UNKNOWN_ERROR" };
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  accountType?: "individual" | "company";
}) {
  const accountType = data.accountType ?? "individual";

  // Validate password
  const validation = validatePassword(data.password, { name: data.name, email: data.email });
  if (!validation.valid) {
    return { error: "WEAK_PASSWORD", details: validation.errors };
  }

  // Check if email is already taken
  const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) {
    return { error: "EMAIL_EXISTS" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create organization — name based on account type
  const orgName = accountType === "company" ? data.name : `${data.name}'s Workspace`;
  const org = await db.organization.create({
    data: {
      name: orgName,
      entityType: accountType === "company" ? "COMPANY" : "ESTABLISHMENT",
    },
  });

  // Create user as SUPER_ADMIN (org creator = admin)
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: "SUPER_ADMIN",
      organizationId: org.id,
      accountType,
      onboardingCompleted: false,
      invitedVia: "registration",
    },
  });

  logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "REGISTER",
    resource: "Auth",
    organizationId: org.id,
  });

  // Auto-sign-in the newly created user
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  } catch (error: any) {
    // signIn may throw a redirect error in Next.js — that's fine
    if (!error.message?.includes("NEXT_REDIRECT")) {
      console.error("Auto-sign-in after registration failed:", error);
    }
  }

  return { success: true, redirect: "/dashboard/onboarding" };
}
