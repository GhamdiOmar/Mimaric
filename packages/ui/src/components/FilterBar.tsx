import * as React from "react";
import { cn } from "../lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
}

function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {filters?.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange?.(filter.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeFilter === filter.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={cn(
                  "tabular-nums text-xs rounded-full px-1.5 py-px min-w-[1.25rem] text-center",
                  activeFilter === filter.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <input
            type="text"
            placeholder={searchPlaceholder || "Search..."}
            value={searchValue || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full sm:w-64 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring"
          />
        )}
        {actions}
      </div>
    </div>
  );
}

export { FilterBar };
