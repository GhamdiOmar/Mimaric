"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export type KPIAccent =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "accent";

export interface KPIDelta {
  /** Signed percentage (-100..+∞) or absolute number. Caller decides. */
  value: number;
  direction?: "up" | "down" | "flat";
  /** True when "up" is good (revenue). False when "down" is good (churn). Default true. */
  isGoodIfUp?: boolean;
  /** Suffix for the delta pill. Defaults to "%". */
  unit?: "%" | "";
}

export interface KPICardProps {
  /** Noun-phrase label, e.g. "Monthly Revenue". */
  label: string;
  /** Big number — formatted string or React node. */
  value: React.ReactNode;
  /** Trailing unit, e.g. "SAR", "%", "days". */
  unit?: string;
  /** Optional single-line caption under the delta. */
  subtitle?: string;
  /** Short icon for category cue. Accepts Lucide icon or a rendered node. */
  icon?: LucideIcon | React.ReactNode;
  /** Colored left accent bar + icon tint. */
  accent?: KPIAccent;
  /** @deprecated use `accent`. Retained for legacy callers. */
  accentColor?: KPIAccent;
  /** Delta vs comparison period. Accepts the new object shape or the legacy {value,label,direction}. */
  delta?: KPIDelta;
  /** Legacy alias — `trend={{value, label, direction}}`. Mapped to `delta` + `subtitle`. */
  trend?:
    | number[]
    | { value: number; label?: string; direction?: "up" | "down" | "flat" };
  /** Human-readable period, e.g. "vs. last month". */
  comparisonPeriod?: string;
  /** Click target — renders the whole card as a link. */
  href?: string;
  /** Controls click handler when href is not used. */
  onClick?: () => void;
  /** Last-refresh timestamp — renders "X ago". */
  lastUpdated?: Date | string | number;
  /** Locale for the "ago" phrase and delta tooltip. */
  locale?: "ar" | "en";
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const BORDER: Record<KPIAccent, string> = {
  primary: "border-s-primary",
  secondary: "border-s-secondary",
  success: "border-s-success",
  warning: "border-s-warning",
  destructive: "border-s-destructive",
  info: "border-s-info",
  accent: "border-s-accent",
};

const ICON_BG: Record<KPIAccent, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
};

const STROKE: Record<KPIAccent, string> = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--info))",
  accent: "hsl(var(--accent))",
};

function sparkPath(points: number[], w: number, h: number): string {
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

function resolveDirection(d?: KPIDelta): "up" | "down" | "flat" {
  if (!d) return "flat";
  if (d.direction) return d.direction;
  if (d.value > 0) return "up";
  if (d.value < 0) return "down";
  return "flat";
}

function deltaTone(direction: "up" | "down" | "flat", isGoodIfUp: boolean) {
  if (direction === "flat") return "bg-muted text-muted-foreground";
  const good =
    (direction === "up" && isGoodIfUp) ||
    (direction === "down" && !isGoodIfUp);
  return good
    ? "bg-success/10 text-success"
    : "bg-destructive/10 text-destructive";
}

export function KPICard({
  label,
  value,
  unit,
  subtitle,
  icon,
  accent,
  accentColor,
  delta,
  trend,
  comparisonPeriod,
  href,
  onClick,
  lastUpdated,
  locale,
  loading = false,
  compact = false,
  className,
}: KPICardProps) {
  const resolvedAccent: KPIAccent = accent ?? accentColor ?? "primary";

  // Normalise legacy trend shape.
  let sparkline: number[] | undefined;
  let legacyDelta: KPIDelta | undefined;
  let legacyLabel: string | undefined;
  if (Array.isArray(trend)) {
    sparkline = trend;
  } else if (trend && typeof trend === "object") {
    legacyDelta = {
      value: trend.value,
      direction: trend.direction,
    };
    legacyLabel = trend.label;
  }
  const finalDelta = delta ?? legacyDelta;
  const finalSubtitle = subtitle ?? legacyLabel;
  const isLucide = typeof icon === "function";
  const IconNode = isLucide ? (icon as LucideIcon) : null;
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card shadow-card border-s-4",
          compact ? "p-4" : "p-6",
          className,
        )}
      >
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const direction = resolveDirection(finalDelta);
  const isGoodIfUp = finalDelta?.isGoodIfUp ?? true;
  const effLocale: "ar" | "en" =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang === "ar"
      ? "ar"
      : "en");

  const ago =
    lastUpdated != null
      ? formatDistanceToNow(new Date(lastUpdated), {
          addSuffix: true,
          locale: effLocale === "ar" ? arSA : enUS,
        })
      : null;

  const deltaIcon =
    direction === "up" ? (
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    ) : direction === "down" ? (
      <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
    ) : (
      <Minus className="h-3 w-3" aria-hidden="true" />
    );

  const interactive = Boolean(href || onClick);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "block font-medium text-muted-foreground",
              compact ? "text-[11px]" : "text-xs",
            )}
          >
            {label}
          </span>
          <div
            className={cn(
              "mt-1.5 flex items-baseline gap-1.5 font-bold text-card-foreground tabular-nums",
              compact ? "text-xl" : "text-3xl",
            )}
          >
            <span dir="ltr" className="inline-block">{value}</span>
            {unit && (
              <span className="text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {finalDelta && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  deltaTone(direction, isGoodIfUp),
                )}
              >
                {deltaIcon}
                <span className="number-ltr">
                  {Math.abs(finalDelta.value)}
                  {finalDelta.unit ?? "%"}
                </span>
              </span>
              {comparisonPeriod && (
                <span className="text-[11px] text-muted-foreground">
                  {comparisonPeriod}
                </span>
              )}
            </div>
          )}
          {finalSubtitle && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {finalSubtitle}
            </p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full",
              compact ? "h-9 w-9" : "h-10 w-10",
              ICON_BG[resolvedAccent],
            )}
            aria-hidden="true"
          >
            {IconNode ? (
              <IconNode className={compact ? "h-4 w-4" : "h-5 w-5"} />
            ) : (
              (icon as React.ReactNode)
            )}
          </span>
        )}
      </div>

      {sparkline && sparkline.length >= 2 && (
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="mt-3 h-8 w-full"
          aria-hidden="true"
        >
          <path
            d={sparkPath(sparkline, 100, 32)}
            fill="none"
            stroke={STROKE[resolvedAccent]}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {ago && (
        <div className="mt-2 text-[11px] text-muted-foreground">{ago}</div>
      )}
    </>
  );

  const classes = cn(
    "block rounded-lg border border-border bg-card shadow-card border-s-4 transition-shadow duration-200",
    BORDER[resolvedAccent],
    interactive && "hover:shadow-elevation-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    compact ? "p-4" : "p-6",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(classes, "text-start w-full")}
        style={{ display: "block" }}
      >
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}
