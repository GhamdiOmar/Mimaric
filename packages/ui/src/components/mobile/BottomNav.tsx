"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface BottomNavItem {
  key: string;
  href: string;
  label: { ar: string; en: string };
  icon: LucideIcon;
  /** Optional extra pathname prefixes that mark this tab active. */
  matchPrefixes?: string[];
}

export interface BottomNavProps {
  items: BottomNavItem[];
  lang: "ar" | "en";
  className?: string;
}

function isItemActive(pathname: string | null, item: BottomNavItem): boolean {
  if (!pathname) return false;
  if (pathname === item.href) return true;
  if (pathname.startsWith(item.href + "/")) return true;
  if (item.matchPrefixes?.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  return false;
}

/**
 * BottomNav — primary bottom tab bar for mobile shells.
 *
 * 64px tall, each tab stacks icon + label. Active tab carries a 2px top
 * indicator in the brand primary, icon + label in primary, rest muted.
 */
function BottomNav({ items, lang, className }: BottomNavProps) {
  const pathname = usePathname();
  const count = items.length;
  const colsClass =
    count === 3
      ? "grid-cols-3"
      : count === 4
        ? "grid-cols-4"
        : "grid-cols-5";

  return (
    <nav
      aria-label={lang === "ar" ? "التنقل السفلي" : "Primary"}
      className={cn(
        "w-full border-t border-border bg-card/95 backdrop-blur-md",
        "pb-safe-bottom",
        className,
      )}
    >
      <ul className={cn("grid h-mobile-bottomnav", colsClass)}>
        {items.map((item) => {
          const active = isItemActive(pathname, item);
          const Icon = item.icon;
          const label = lang === "ar" ? item.label.ar : item.label.en;

          return (
            <li key={item.key} className="contents">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "relative flex min-h-[44px] flex-col items-center justify-center gap-1",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
                  active
                    ? "text-[hsl(var(--primary))]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-[hsl(var(--primary))]"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] shrink-0",
                    active ? "stroke-[2.25]" : undefined,
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BottomNav };
