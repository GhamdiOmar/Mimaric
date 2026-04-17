import * as React from "react";
import { cn } from "../../lib/utils";

export interface MobileKanbanColumn {
  key: string;
  /** Usually composed by the caller like "New (32)". */
  title: React.ReactNode;
  /** Typically a stack of <DataCard> or mini cards. */
  children: React.ReactNode;
}

export interface MobileKanbanProps {
  columns: MobileKanbanColumn[];
  className?: string;
}

/**
 * MobileKanban — horizontal snap-scroll columns for pipelines.
 *
 * Bleeds edge-to-edge inside a padded container. Columns snap-scroll
 * horizontally and share a muted background so they read as grouped buckets
 * rather than standalone cards.
 */
function MobileKanban({ columns, className }: MobileKanbanProps) {
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2",
        "[&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {columns.map((col) => (
        <section
          key={col.key}
          className="min-w-[260px] max-w-[300px] shrink-0 snap-start rounded-2xl border border-border bg-muted/40 p-3"
        >
          <header className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground">
            {col.title}
          </header>
          <div className="flex flex-col gap-2">{col.children}</div>
        </section>
      ))}
    </div>
  );
}

export { MobileKanban };
