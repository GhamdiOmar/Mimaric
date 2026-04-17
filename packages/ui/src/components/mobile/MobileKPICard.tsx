"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export type MobileKPITone =
  | "default"
  | "primary"
  | "green"
  | "amber"
  | "red"
  | "blue";

export interface MobileKPIDelta {
  /** Pre-formatted string, e.g. "+12.3%" or "-4". Caller controls units. */
  label: string;
  direction: "up" | "down" | "flat";
}

export interface MobileKPICardProps {
  label: string;
  /** Big number — caller formats. */
  value: React.ReactNode;
  delta?: MobileKPIDelta;
  /** Array of numeric points for the mini sparkline. At least 2 points. */
  sparkline?: number[];
  icon?: LucideIcon;
  tone?: MobileKPITone;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const TONE: Record<
  MobileKPITone,
  { bg: string; iconBg: string; iconFg: string; stroke: string }
> = {
  default: {
    bg: "bg-card",
    iconBg: "bg-muted",
    iconFg: "text-foreground",
    stroke: "hsl(var(--muted-foreground))",
  },
  primary: {
    bg: "bg-card",
    iconBg: "bg-primary/10",
    iconFg: "text-primary",
    stroke: "hsl(var(--primary))",
  },
  green: {
    bg: "bg-card",
    iconBg: "bg-success/10",
    iconFg: "text-success",
    stroke: "hsl(var(--success))",
  },
  amber: {
    bg: "bg-card",
    iconBg: "bg-warning/10",
    iconFg: "text-warning",
    stroke: "hsl(var(--warning))",
  },
  red: {
    bg: "bg-card",
    iconBg: "bg-destructive/10",
    iconFg: "text-destructive",
    stroke: "hsl(var(--destructive))",
  },
  blue: {
    bg: "bg-card",
    iconBg: "bg-info/10",
    iconFg: "text-info",
    stroke: "hsl(var(--info))",
  },
};

function buildSparklinePath(points: number[], w: number, h: number): string {
  if (points.length < 2) return "";
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const stepX = w / (points.length - 1);
  return points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/**
 * MobileKPICard — hero metric card for the mobile Home grid.
 *
 * Composition: label row (icon tile + label + delta pill), large value,
 * 32px sparkline. When `href` / `onClick` is set the whole card is
 * interactive with a subtle lift on press.
 */
function MobileKPICard({
  label,
  value,
  delta,
  sparkline,
  icon: Icon,
  tone = "primary",
  href,
  onClick,
  className,
}: MobileKPICardProps) {
  const t = TONE[tone];
  const interactive = Boolean(href || onClick);

  const deltaIcon =
    delta?.direction === "up" ? (
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    ) : delta?.direction === "down" ? (
      <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
    ) : (
      <Minus className="h-3 w-3" aria-hidden="true" />
    );

  const deltaClasses =
    delta?.direction === "up"
      ? "bg-success/10 text-success"
      : delta?.direction === "down"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                t.iconBg,
                t.iconFg,
              )}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <span className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
              deltaClasses,
            )}
          >
            {deltaIcon}
            {delta.label}
          </span>
        ) : null}
      </div>

      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground number-ltr">
        {value}
      </div>

      {sparkline && sparkline.length >= 2 ? (
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="mt-2 h-8 w-full"
          aria-hidden="true"
        >
          <path
            d={buildSparklinePath(sparkline, 100, 32)}
            fill="none"
            stroke={t.stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="mt-2 h-8" aria-hidden="true" />
      )}
    </>
  );

  const baseClasses = cn(
    "flex flex-col rounded-2xl border border-border p-4",
    t.bg,
    interactive
      ? "transition-all active:scale-[0.98] hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
      : undefined,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClasses, "text-start")}
        style={{ display: "flex" }}
      >
        {body}
      </button>
    );
  }
  return <div className={baseClasses}>{body}</div>;
}

export { MobileKPICard };
