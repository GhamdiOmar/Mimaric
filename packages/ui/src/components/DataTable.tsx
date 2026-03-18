"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  numeric?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  className?: string;
  skeletonRows?: number;
}

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyState,
  emptyTitle = "No data",
  emptyDescription,
  onRowClick,
  rowKey,
  sortKey,
  sortDirection,
  onSortChange,
  className,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortKey === key) {
      onSortChange(key, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="h-10 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className={cn("rounded-lg border border-border bg-card py-16 text-center", className)}>
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        {emptyDescription && (
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-10 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.numeric && "text-end",
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-foreground">
                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "border-b transition-colors hover:bg-muted/40",
                  onRowClick && "cursor-pointer"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3",
                      col.numeric && "text-end tabular-nums font-mono",
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
