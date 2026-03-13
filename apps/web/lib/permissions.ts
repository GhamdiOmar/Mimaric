/**
 * PDPL & NCA Compliance — Role-Based Permission System
 *
 * Two-tier SaaS architecture:
 *   System tier  — SYSTEM_ADMIN, SYSTEM_SUPPORT (Mimaric platform team)
 *   Customer tier — COMPANY_ADMIN + operational roles (tenant organizations)
 *
 * Static permission matrix mapping UserRole → Permission[].
 * Checked on every server action via requirePermission().
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
  // Preventive Maintenance
  | "preventive_maintenance:read"
  | "preventive_maintenance:write"
  | "preventive_maintenance:delete"
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
  | "dashboard:read"
  // Notifications
  | "notifications:read"
  // Land
  | "land:read"
  | "land:write"
  | "land:delete"
  | "land:export"
  // Off-Plan Development Lifecycle
  | "constraints:read"
  | "constraints:write"
  | "feasibility:read"
  | "feasibility:write"
  | "decision_gates:read"
  | "decision_gates:write"
  | "concept_plans:read"
  | "concept_plans:write"
  | "subdivision:read"
  | "subdivision:write"
  | "approvals:read"
  | "approvals:write"
  | "approvals:submit"
  | "infrastructure:read"
  | "infrastructure:write"
  | "inventory:read"
  | "inventory:write"
  | "pricing:read"
  | "pricing:write"
  | "launch:read"
  | "launch:write"
  // Help
  | "help:read"
  | "help:create_ticket"
  | "help:manage_tickets"      // System-level: respond as staff, manage ticket status
  | "help:manage_permissions"  // Org-level: manage join requests + permission requests
  // Invitations
  | "invitations:read"
  | "invitations:write"
  // Billing & Subscriptions
  | "billing:read"             // View own org subscription/invoices
  | "billing:write"            // Manage subscription (upgrade/downgrade/cancel)
  | "billing:admin"            // System-level: manage all plans, view all subscriptions
  // Wafi Compliance
  | "escrow:read"
  | "escrow:write"
  | "escrow:approve"
  | "consultant:read"
  | "consultant:write"
  | "milestones:read"
  | "milestones:write"
  | "milestones:certify"
  | "milestones:upload_evidence"
  | "wafi_contracts:read"
  | "wafi_contracts:write"
  | "delay_penalties:read"
  | "delay_penalties:write"
  | "wafi_license:read"
  | "wafi_license:write"
  | "etmam:read"
  | "etmam:write"
  | "etmam:sync"
  // Planning OS
  | "planning:read"
  | "planning:write"
  | "planning:delete"
  | "planning:import"
  | "planning:geometry"
  | "planning:scenarios"
  | "planning:compliance"
  | "planning:feasibility"
  | "planning:approve"
  | "planning:export"
  // System (platform-level)
  | "system:admin"
  | "system:support";

// ─── Company Admin Permissions (full org control, NO system access) ──────────

const COMPANY_ADMIN_PERMISSIONS: Permission[] = [
  "customers:read", "customers:read_pii", "customers:write", "customers:delete", "customers:export",
  "projects:read", "projects:write", "projects:delete",
  "units:read", "units:write", "units:delete",
  "contracts:read", "contracts:write", "contracts:delete",
  "leases:read", "leases:write", "leases:delete",
  "reservations:read", "reservations:write", "reservations:delete",
  "maintenance:read", "maintenance:write", "maintenance:delete",
  "preventive_maintenance:read", "preventive_maintenance:write", "preventive_maintenance:delete",
  "finance:read", "finance:write",
  "organization:read", "organization:write",
  "team:read", "team:write", "team:delete",
  "documents:read", "documents:write", "documents:delete",
  "reports:read", "reports:export",
  "audit:read",
  "dashboard:read",
  "notifications:read",
  "land:read", "land:write", "land:delete", "land:export",
  // Off-Plan Development Lifecycle
  "constraints:read", "constraints:write",
  "feasibility:read", "feasibility:write",
  "decision_gates:read", "decision_gates:write",
  "concept_plans:read", "concept_plans:write",
  "subdivision:read", "subdivision:write",
  "approvals:read", "approvals:write", "approvals:submit",
  "infrastructure:read", "infrastructure:write",
  "inventory:read", "inventory:write",
  "pricing:read", "pricing:write",
  "launch:read", "launch:write",
  "help:read", "help:create_ticket", "help:manage_permissions",
  "invitations:read", "invitations:write",
  // Planning OS (full access for company admin)
  "planning:read", "planning:write", "planning:delete",
  "planning:import", "planning:geometry", "planning:scenarios",
  "planning:compliance", "planning:feasibility", "planning:approve", "planning:export",
  // Billing
  "billing:read", "billing:write",
  // Wafi Compliance
  "escrow:read", "escrow:write", "escrow:approve",
  "consultant:read", "consultant:write",
  "milestones:read", "milestones:write",
  "wafi_contracts:read", "wafi_contracts:write",
  "delay_penalties:read", "delay_penalties:write",
  "wafi_license:read", "wafi_license:write",
  "etmam:read", "etmam:write", "etmam:sync",
];

// ─── System Permissions (Mimaric platform staff only) ────────────────────────

const SYSTEM_ONLY_PERMISSIONS: Permission[] = [
  "system:admin", "system:support", "help:manage_tickets", "billing:admin",
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ── System tier (Mimaric platform team) ──────────────────────────────────
  SYSTEM_ADMIN: [...COMPANY_ADMIN_PERMISSIONS, ...SYSTEM_ONLY_PERMISSIONS],
  SYSTEM_SUPPORT: [...COMPANY_ADMIN_PERMISSIONS, "system:support", "help:manage_tickets", "billing:admin"],

  // ── Customer tier ────────────────────────────────────────────────────────
  COMPANY_ADMIN: COMPANY_ADMIN_PERMISSIONS,

  // ── Backward compatibility (deprecated — mapped via JWT) ─────────────────
  SUPER_ADMIN: COMPANY_ADMIN_PERMISSIONS,
  DEV_ADMIN: COMPANY_ADMIN_PERMISSIONS,

  // ── Operational roles ────────────────────────────────────────────────────
  PROJECT_MANAGER: [
    "dashboard:read",
    "customers:read",
    "projects:read", "projects:write",
    "units:read", "units:write",
    "contracts:read",
    "leases:read",
    "reservations:read",
    "maintenance:read", "maintenance:write",
    "preventive_maintenance:read", "preventive_maintenance:write",
    "documents:read", "documents:write",
    "reports:read",
    "notifications:read",
    "land:read", "land:write", "land:export",
    // Off-Plan (read/write, no decision gate approval)
    "constraints:read", "constraints:write",
    "feasibility:read", "feasibility:write",
    "decision_gates:read",
    "concept_plans:read", "concept_plans:write",
    "subdivision:read", "subdivision:write",
    "approvals:read", "approvals:write", "approvals:submit",
    "infrastructure:read", "infrastructure:write",
    "inventory:read", "inventory:write",
    "pricing:read",
    "launch:read",
    // Planning OS (planner/PM — edit everything, no approve/delete)
    "planning:read", "planning:write",
    "planning:import", "planning:geometry", "planning:scenarios",
    "planning:compliance", "planning:feasibility", "planning:export",
    // Wafi (read + write milestones, read escrow/contracts)
    "escrow:read",
    "consultant:read",
    "milestones:read", "milestones:write",
    "wafi_contracts:read",
    "delay_penalties:read",
    "wafi_license:read",
    "etmam:read",
    "help:read", "help:create_ticket",
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
    "notifications:read",
    "land:read",
    // Off-Plan (read + inventory/pricing/launch write for sales)
    "inventory:read", "inventory:write",
    "pricing:read", "pricing:write",
    "launch:read", "launch:write",
    // Planning OS (read-only for sales visibility)
    "planning:read", "planning:export",
    "help:read", "help:create_ticket",
  ],

  SALES_AGENT: [
    "dashboard:read",
    "customers:read", "customers:write",
    "projects:read",
    "units:read",
    "contracts:read",
    "leases:read",
    "reservations:read", "reservations:write",
    "documents:read",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  PROPERTY_MANAGER: [
    "dashboard:read",
    "customers:read",
    "projects:read",
    "units:read", "units:write",
    "leases:read", "leases:write",
    "maintenance:read", "maintenance:write",
    "preventive_maintenance:read", "preventive_maintenance:write",
    "documents:read", "documents:write",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  FINANCE_OFFICER: [
    "dashboard:read",
    "customers:read",
    "contracts:read",
    "leases:read",
    "finance:read", "finance:write",
    "reports:read", "reports:export",
    "notifications:read",
    "land:read",
    "maintenance:read",
    // Off-Plan (read + pricing for financial review)
    "feasibility:read",
    "inventory:read",
    "pricing:read", "pricing:write",
    "launch:read",
    // Planning OS (read + feasibility for financial review)
    "planning:read", "planning:feasibility", "planning:export",
    // Wafi (escrow read/write, milestones read, contracts read/write)
    "escrow:read", "escrow:write",
    "milestones:read",
    "wafi_contracts:read", "wafi_contracts:write",
    "delay_penalties:read", "delay_penalties:write",
    "wafi_license:read", "wafi_license:write",
    "etmam:read", "etmam:write",
    "help:read", "help:create_ticket",
    "billing:read",
  ],

  TECHNICIAN: [
    "dashboard:read",
    "maintenance:read", "maintenance:write",
    "preventive_maintenance:read",
    "units:read",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  // ── Wafi: Independent engineering consultant (project-scoped) ──────────
  ENGINEERING_CONSULTANT: [
    "dashboard:read",
    "projects:read",           // Assigned projects only (scoped via ConsultantAssignment)
    "milestones:read",
    "milestones:certify",
    "milestones:upload_evidence",
    "consultant:read",
    "escrow:read",
    "documents:read", "documents:write",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  BUYER: [
    "dashboard:read",
    "units:read",
    "contracts:read",
    "reservations:read",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  TENANT: [
    "dashboard:read",
    "units:read",
    "leases:read",
    "maintenance:read", "maintenance:write",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],

  USER: [
    "dashboard:read",
    "units:read",
    "notifications:read",
    "help:read", "help:create_ticket",
  ],
};

// ─── Role classification helpers ───────────────────────────────────────────

/** Roles that belong to the Mimaric platform team — never assignable by customers */
export const SYSTEM_ROLES: string[] = ["SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

/** Roles that customers can assign to their team members */
export const CUSTOMER_ASSIGNABLE_ROLES: string[] = [
  "COMPANY_ADMIN", "PROJECT_MANAGER", "SALES_MANAGER", "SALES_AGENT",
  "PROPERTY_MANAGER", "FINANCE_OFFICER", "TECHNICIAN", "ENGINEERING_CONSULTANT",
  "BUYER", "TENANT", "USER",
];

/** Check if a role is a system (Mimaric platform) role */
export function isSystemRole(role: string): boolean {
  return SYSTEM_ROLES.includes(role);
}

// ─── Permission check functions ────────────────────────────────────────────

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
