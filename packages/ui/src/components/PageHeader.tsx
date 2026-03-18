import * as React from "react";
import { cn } from "../lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4", className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export { PageHeader };
