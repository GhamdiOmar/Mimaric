"use client";

import * as React from "react";
import { AlertTriangle, Clock, FileWarning, ArrowRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import Link from "next/link";
import { useLanguage } from "../LanguageProvider";

interface ActionItem {
  type: "overdue" | "expiring" | "pending";
  label: string;
  count: number;
  href: string;
}

const iconMap = {
  overdue: AlertTriangle,
  expiring: Clock,
  pending: FileWarning,
};

const colorMap = {
  overdue: "text-destructive bg-destructive/10",
  expiring: "text-warning bg-warning/10",
  pending: "text-info bg-info/10",
};

export function ActionItems({ items }: { items: ActionItem[] }) {
  const { lang } = useLanguage();
  const filtered = items.filter((i) => i.count > 0);

  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{lang === "ar" ? "البنود العاجلة" : "Action Items"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {lang === "ar" ? "لا توجد بنود تحتاج انتباهك" : "Nothing needs your attention"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{lang === "ar" ? "البنود العاجلة" : "Action Items"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map((item) => {
          const Icon = iconMap[item.type];
          return (
            <Link
              key={item.type + item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/40 group"
            >
              <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg shrink-0", colorMap[item.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{item.count} {lang === "ar" ? "عنصر" : item.count === 1 ? "item" : "items"}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors icon-directional" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
