"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission } from "../lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "USER";

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    role,
  };
}
