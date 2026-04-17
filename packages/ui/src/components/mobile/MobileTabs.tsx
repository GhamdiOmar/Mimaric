"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface MobileTabItem {
  key: string;
  label: string;
}

export interface MobileTabsProps {
  items: MobileTabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * MobileTabs — horizontally scrollable pill tabs.
 *
 * Bleeds to the edge of a padded container via negative margins. Active tab is
 * filled with the brand primary; inactive tabs are bordered cards. Scrollbar is
 * hidden in both webkit and firefox.
 */
function MobileTabs({
  items,
  active,
  onChange,
  className,
  ariaLabel,
}: MobileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-2",
        "[&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              "min-h-[36px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
              isActive
                ? "border border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "border border-border bg-card text-muted-foreground hover:border-foreground/20",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export { MobileTabs };
