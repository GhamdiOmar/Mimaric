import * as React from "react";
import { Badge } from "./Badge";
import type { BadgeProps } from "./Badge";

type EntityType = "project" | "contract" | "unit" | "lease" | "maintenance" | "customer" | "invoice" | "reservation";

const statusColorMap: Record<EntityType, Record<string, NonNullable<BadgeProps["variant"]>>> = {
  project: {
    LAND_IDENTIFIED: "info",
    FEASIBILITY_IN_PROGRESS: "pending",
    FEASIBILITY_APPROVED: "success",
    PLANNING_IN_PROGRESS: "info",
    DESIGN_APPROVED: "success",
    PERMITS_OBTAINED: "success",
    OFF_PLAN_LAUNCHED: "info",
    UNDER_CONSTRUCTION: "warning",
    CONSTRUCTION_COMPLETE: "success",
    READY_FOR_HANDOVER: "info",
    HANDED_OVER: "success",
    OPERATIONAL: "available",
    ON_HOLD: "draft",
    CANCELLED: "error",
  },
  contract: {
    DRAFT: "draft",
    SENT: "info",
    SIGNED: "success",
    EXECUTED: "available",
    HANDED_OVER: "success",
    VOIDED: "error",
    CANCELLED: "error",
    EXPIRED: "overdue",
  },
  unit: {
    AVAILABLE: "available",
    RESERVED: "reserved",
    LEASED: "rented",
    SOLD: "sold",
    UNDER_MAINTENANCE: "maintenance",
  },
  lease: {
    ACTIVE: "available",
    PENDING: "pending",
    EXPIRED: "overdue",
    TERMINATED: "error",
    RENEWED: "success",
  },
  maintenance: {
    OPEN: "info",
    ASSIGNED: "pending",
    IN_PROGRESS: "warning",
    ON_HOLD: "draft",
    RESOLVED: "success",
    CLOSED: "available",
  },
  customer: {
    NEW: "info",
    INTERESTED: "pending",
    QUALIFIED: "success",
    VIEWING: "info",
    RESERVED: "reserved",
    CONVERTED: "available",
    LOST: "error",
    ACTIVE_TENANT: "rented",
    PAST_TENANT: "draft",
  },
  invoice: {
    DRAFT: "draft",
    SENT: "info",
    PAID: "success",
    PARTIALLY_PAID: "pending",
    OVERDUE: "overdue",
    CANCELLED: "error",
  },
  reservation: {
    ACTIVE: "available",
    EXPIRED: "overdue",
    CONVERTED: "success",
    CANCELLED: "error",
  },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  entityType: EntityType;
  status: string;
  label?: string;
}

function StatusBadge({ entityType, status, label, ...props }: StatusBadgeProps) {
  const colorMap = statusColorMap[entityType] || {};
  const variant = colorMap[status] || "default";
  const displayLabel = label || status.replace(/_/g, " ");

  return (
    <Badge variant={variant} {...props}>
      {displayLabel}
    </Badge>
  );
}

export { StatusBadge, statusColorMap };
