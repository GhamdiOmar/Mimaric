import * as React from "react";
import { cn } from "../lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  change?: {
    value: number;
    label?: string;
  };
}

function StatCard({
  label,
  value,
  icon,
  change,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/60 text-muted-foreground shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground number-ltr">{value}</p>
      </div>
      {change && (
        <span
          className={cn(
            "text-xs font-semibold tabular-nums shrink-0",
            change.value >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {change.value >= 0 ? "+" : ""}{change.value}%
        </span>
      )}
    </div>
  );
}

export { StatCard };
