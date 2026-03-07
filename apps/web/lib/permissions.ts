/**
 * PDPL & NCA Compliance — Role-Based Permission System
 *
 * Static permission matrix mapping UserRole → Permission[].
 * Checked on every server action via requirePermission().
 *
 * Key distinction: `customers:read` shows masked PII,
 * `customers:read_pii` unlocks full national ID, phone, email.
 */

export type Permission =
  // Customers
  | "customers:read"
  | "customers:read_pii"
  | "customers:write"
  | "customers:delete"
  | "customers:export"
  // Projects
  | "projects:read"
  | "projects:write"
  | "projects:delete"
  // Units
  | "units:read"
  | "units:write"
  | "units:delete"
  // Contracts
  | "contracts:read"
  | "contracts:write"
  | "contracts:delete"
  // Leases
  | "leases:read"
  | "leases:write"
  | "leases:delete"
  // Reservations
  | "reservations:read"
  | "reservations:write"
  | "reservations:delete"
  // Maintenance
  | "maintenance:read"
  | "maintenance:write"
  | "maintenance:delete"
  // Finance
  | "finance:read"
  | "finance:write"
  // Organization
  | "organization:read"
  | "organization:write"
  // Team
  | "team:read"
  | "team:write"
  | "team:delete"
  // Documents
  | "documents:read"
  | "documents:write"
  | "documents:delete"
  // Reports
  | "reports:read"
  | "reports:export"
  // Audit
  | "audit:read"
  // Dashboard
  | "dashboard:read";

const ALL_PERMISSIONS: Permission[] = [
  "customers:read", "customers:read_pii", "customers:write", "customers:delete", "customers:export",
  "projects:read", "projects:write", "projects:delete",
  "units:read", "units:write", "units:delete",
  "contracts:read", "contracts:write", "contracts:delete",
  "leases:read", "leases:write", "leases:delete",
  "reservations:read", "reservations:write", "reservations:delete",
  "maintenance:read", "maintenance:write", "maintenance:delete",
  "finance:read", "finance:write",
  "organization:read", "organization:write",
  "team:read", "team:write", "team:delete",
  "documents:read", "documents:write", "documents:delete",
  "reports:read", "reports:export",
  "audit:read",
  "dashboard:read",
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  DEV_ADMIN: ALL_PERMISSIONS,

  PROJECT_MANAGER: [
    "dashboard:read",
    "customers:read",
    "projects:read", "projects:write",
    "units:read", "units:write",
    "contracts:read",
    "leases:read",
    "reservations:read",
    "maintenance:read", "maintenance:write",
    "documents:read", "documents:write",
    "reports:read",
  ],

  SALES_MANAGER: [
    "dashboard:read",
    "customers:read", "customers:read_pii", "customers:write", "customers:export",
    "projects:read",
    "units:read",
    "contracts:read", "contracts:write",
    "reservations:read", "reservations:write",
    "documents:read",
    "reports:read", "reports:export",
  ],

  SALES_AGENT: [
    "dashboard:read",
    "customers:read", "customers:write",
    "projects:read",
    "units:read",
    "contracts:read",
    "reservations:read", "reservations:write",
    "documents:read",
  ],

  PROPERTY_MANAGER: [
    "dashboard:read",
    "customers:read",
    "projects:read",
    "units:read", "units:write",
    "leases:read", "leases:write",
    "maintenance:read", "maintenance:write",
    "documents:read", "documents:write",
  ],

  FINANCE_OFFICER: [
    "dashboard:read",
    "customers:read",
    "contracts:read",
    "leases:read",
    "finance:read", "finance:write",
    "reports:read", "reports:export",
  ],

  TECHNICIAN: [
    "dashboard:read",
    "maintenance:read", "maintenance:write",
    "units:read",
  ],

  BUYER: [
    "dashboard:read",
    "units:read",
    "contracts:read",
    "reservations:read",
  ],

  TENANT: [
    "dashboard:read",
    "units:read",
    "leases:read",
    "maintenance:read", "maintenance:write",
  ],

  USER: [
    "dashboard:read",
    "units:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
