import * as React from "react";
import { cn } from "../lib/utils";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: "primary" | "secondary" | "accent" | "destructive" | "warning" | "info" | "success";
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
}

const accentColorMap: Record<string, string> = {
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
  icon,
  accentColor = "primary",
  trend,
  loading = false,
  className,
  ...props
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-5 space-y-3",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-raised",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-md",
              accentColorMap[accentColor] || accentColorMap.primary
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-card-foreground number-ltr">
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={cn(
              "text-xs font-semibold",
              trend.value >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { KPICard };
