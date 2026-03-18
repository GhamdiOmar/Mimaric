import * as React from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-4" : "py-16 px-6",
        className
      )}
      {...props}
    >
      {icon && (
        <div className={cn(
          "text-muted-foreground/40",
          compact ? "mb-2" : "mb-4"
        )} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={cn(
        "font-semibold text-foreground",
        compact ? "text-sm mb-0.5" : "text-base mb-1"
      )}>{title}</h3>
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          compact ? "text-xs mb-2" : "text-sm mb-4"
        )}>
          {description}
        </p>
      )}
      {action && <div className={compact ? "mt-1" : "mt-2"}>{action}</div>}
    </div>
  );
}

export { EmptyState };
