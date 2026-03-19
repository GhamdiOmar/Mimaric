import * as React from "react";
import { cn } from "../lib/utils";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: "primary" | "secondary" | "accent" | "destructive" | "warning" | "info" | "success";
  trend?: {
    value: number;
    label?: string;
    direction?: "up" | "down";
  };
  loading?: boolean;
  compact?: boolean;
}

const borderColorMap: Record<string, string> = {
  primary: "border-s-primary",
  secondary: "border-s-secondary",
  accent: "border-s-accent",
  destructive: "border-s-destructive",
  warning: "border-s-warning",
  info: "border-s-info",
  success: "border-s-success",
};

const iconBgMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
};

function KPICard({
  label,
  value,
  subtitle,
  icon,
  accentColor = "primary",
  trend,
  loading = false,
  compact = false,
  className,
  ...props
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card shadow-card",
          compact ? "p-4" : "p-6",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  const direction = trend ? (trend.direction || (trend.value >= 0 ? "up" : "down")) : undefined;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card shadow-card border-s-4 transition-shadow duration-200 hover:shadow-elevation-1",
        borderColorMap[accentColor] || borderColorMap.primary,
        compact ? "p-4" : "p-6",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-muted-foreground font-medium block",
            compact ? "text-xs" : "text-xs"
          )}>
            {label}
          </span>
          <div className={cn(
            "font-bold text-card-foreground number-ltr mt-1.5",
            compact ? "text-xl" : "text-2xl"
          )}>
            {value}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  direction === "up" ? "text-success" : "text-destructive"
                )}
              >
                {direction === "up" ? "\u2191" : "\u2193"} {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
          {subtitle && (
            <p className={cn(
              "text-muted-foreground leading-relaxed mt-2",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center shrink-0 rounded-full",
              compact ? "h-9 w-9" : "h-10 w-10",
              iconBgMap[accentColor] || iconBgMap.primary
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export { KPICard };
