"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface MobileShellProps {
  children: React.ReactNode;
  appBar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

/**
 * MobileShell — mobile viewport frame that stacks an optional sticky AppBar,
 * a scrollable main content area, and an optional sticky BottomNav.
 *
 * Renders unconditionally; parent is responsible for breakpoint gating (md+).
 */
function MobileShell({ children, appBar, bottomNav, className }: MobileShellProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      {appBar ? (
        <div className="sticky top-0 z-mobile-appbar">{appBar}</div>
      ) : null}

      <main
        className={cn(
          "flex-1 overflow-y-auto",
          bottomNav
            ? "pb-[calc(theme(height.mobile-bottomnav)+env(safe-area-inset-bottom)+0.5rem)]"
            : null,
        )}
      >
        {children}
      </main>

      {bottomNav ? (
        <div className="sticky bottom-0 z-mobile-bottomnav">{bottomNav}</div>
      ) : null}
    </div>
  );
}

export { MobileShell };
