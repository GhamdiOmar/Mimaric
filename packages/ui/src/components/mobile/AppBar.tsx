"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/utils";

export interface AppBarProps {
  title: string | React.ReactNode;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** If set, renders a built-in back button as leading (unless `leading` is provided). */
  onBack?: () => void;
  /** Controls the back-button aria-label and icon direction. */
  lang?: "ar" | "en";
  className?: string;
  /** If true, no background or border — useful over hero sections. */
  transparent?: boolean;
  /** If true, title is centered — matches iOS-style navigation bars. */
  centered?: boolean;
}

/**
 * AppBar — compact top bar for mobile shells.
 *
 * 48px tall with `border-b border-border` (no shadow). A single-icon back
 * button flips direction in RTL via `rtl:scale-x-[-1]`.
 */
function AppBar({
  title,
  subtitle,
  leading,
  trailing,
  onBack,
  lang = "en",
  className,
  transparent = false,
  centered = false,
}: AppBarProps) {
  const isArabic = lang === "ar";
  const backLabel = isArabic ? "رجوع" : "Back";

  const resolvedLeading =
    leading ??
    (onBack ? (
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-full",
          "text-foreground",
          "hover:bg-muted/60 active:bg-muted",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
          "-ms-2",
        )}
      >
        <ChevronLeft
          className="h-5 w-5 rtl:scale-x-[-1]"
          aria-hidden="true"
        />
      </button>
    ) : null);

  const titleBlock = (
    <div
      className={cn(
        "min-w-0 flex flex-col justify-center leading-tight",
        centered ? "items-center text-center" : "items-start",
      )}
    >
      {typeof title === "string" ? (
        <span className="truncate text-base font-semibold text-foreground">
          {title}
        </span>
      ) : (
        title
      )}
      {subtitle ? (
        <span className="truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "pt-safe-top",
        transparent
          ? "bg-transparent"
          : "bg-card/95 backdrop-blur-md border-b border-border",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-mobile-appbar items-center gap-3 px-4",
        )}
      >
        {centered ? (
          <>
            <div className="absolute inset-y-0 start-4 flex items-center">
              {resolvedLeading}
            </div>
            <div className="mx-auto flex min-w-0 max-w-[60%] justify-center">
              {titleBlock}
            </div>
            <div className="absolute inset-y-0 end-4 flex items-center gap-1">
              {trailing}
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {resolvedLeading}
              {titleBlock}
            </div>
            {trailing ? (
              <div className="flex shrink-0 items-center gap-1 -me-2">
                {trailing}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export { AppBar };
