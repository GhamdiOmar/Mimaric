import { db } from "@repo/db";
import { headers } from "next/headers";

export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "READ_PII"
  | "EXPORT"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET"
  | "REGISTER";

export interface AuditEventParams {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
}

/**
 * Log an audit event (fire-and-forget).
 * Never throws — catches errors internally so it never blocks the main request.
 */
export function logAuditEvent(params: AuditEventParams): void {
  // Fire-and-forget: run async but don't await
  void (async () => {
    try {
      let ipAddress: string | null = null;
      try {
        const h = await headers();
        ipAddress =
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          null;
      } catch {
        // Headers may not be available in some contexts
      }

      await db.auditLog.create({
        data: {
          userId: params.userId,
          userEmail: params.userEmail,
          userRole: params.userRole,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          metadata: params.metadata as any,
          ipAddress,
          organizationId: params.organizationId,
        },
      });
    } catch (error) {
      console.error("[Audit] Failed to log event:", error);
    }
  })();
}
