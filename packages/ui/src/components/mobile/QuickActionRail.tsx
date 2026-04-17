"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export type QuickActionTone =
  | "default"
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "destructive";

export interface QuickAction {
  key: string;
  label: string;
  icon: LucideIcon;
  /** If href starts with tel: / mailto: / https: it renders an <a>. */
  href?: string;
  onClick?: () => void;
  tone?: QuickActionTone;
  /** If true, opens in a new tab (external link style). */
  external?: boolean;
}

export interface QuickActionRailProps {
  /** 1–4 actions; typically 3 (call / WhatsApp / email). */
  actions: QuickAction[];
  className?: string;
}

const TONE: Record<QuickActionTone, string> = {
  default: "bg-muted/60 text-foreground hover:bg-muted",
  primary: "bg-primary/10 text-primary hover:bg-primary/15",
  success: "bg-success/10 text-success hover:bg-success/15",
  info: "bg-info/10 text-info hover:bg-info/15",
  warning: "bg-warning/10 text-warning hover:bg-warning/15",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/15",
};

/**
 * QuickActionRail — fixed N-button rail for contact/unit detail screens.
 *
 * Renders a grid of equally-sized rounded buttons, each icon-over-label.
 * Designed to sit above the safe-bottom inset inside a sheet footer.
 */
function QuickActionRail({ actions, className }: QuickActionRailProps) {
  if (!actions.length) return null;
  const count = Math.min(actions.length, 4);
  const colClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : count === 3
          ? "grid-cols-3"
          : "grid-cols-4";

  return (
    <div className={cn("grid gap-3", colClass, className)}>
      {actions.map((a) => {
        const Icon = a.icon;
        const toneCls = TONE[a.tone ?? "default"];
        const innerCls = cn(
          "flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
          "active:scale-[0.97]",
          toneCls,
        );

        const inner = (
          <>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{a.label}</span>
          </>
        );

        if (a.href) {
          return (
            <a
              key={a.key}
              href={a.href}
              target={a.external ? "_blank" : undefined}
              rel={a.external ? "noopener noreferrer" : undefined}
              aria-label={a.label}
              className={innerCls}
            >
              {inner}
            </a>
          );
        }
        return (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            aria-label={a.label}
            className={innerCls}
            style={{ display: "flex" }}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export { QuickActionRail };
