"use client";

import * as React from "react";
import { Badge } from "@repo/ui";
import { useLanguage } from "./LanguageProvider";

interface ReadinessFlags {
  launchReady: boolean;
  handoverReady: boolean;
  blockers: string[];
}

interface ReadinessBadgeProps {
  readiness: ReadinessFlags;
  compact?: boolean;
}

const LABELS = {
  ar: {
    launchReady: "جاهز للإطلاق",
    handoverReady: "جاهز للتسليم",
    inProgress: "قيد التجهيز",
    blocked: "يوجد عوائق",
    blockers: "العوائق",
  },
  en: {
    launchReady: "Launch Ready",
    handoverReady: "Handover Ready",
    inProgress: "In Progress",
    blocked: "Blocked",
    blockers: "Blockers",
  },
};

export function ReadinessBadge({ readiness, compact = false }: ReadinessBadgeProps) {
  const { lang } = useLanguage();
  const t = LABELS[lang];

  if (compact) {
    if (readiness.handoverReady) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t.handoverReady}</Badge>;
    }
    if (readiness.launchReady) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t.launchReady}</Badge>;
    }
    if (readiness.blockers.length > 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t.blocked}</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{t.inProgress}</Badge>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${readiness.launchReady ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20" : "border-muted bg-muted/30"}`}>
          <div className={`h-3 w-3 rounded-full ${readiness.launchReady ? "bg-green-500" : "bg-muted-foreground/30"}`} />
          <span className="text-sm font-medium">{t.launchReady}</span>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${readiness.handoverReady ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20" : "border-muted bg-muted/30"}`}>
          <div className={`h-3 w-3 rounded-full ${readiness.handoverReady ? "bg-green-500" : "bg-muted-foreground/30"}`} />
          <span className="text-sm font-medium">{t.handoverReady}</span>
        </div>
      </div>

      {readiness.blockers.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">{t.blockers}:</p>
          <ul className="space-y-1">
            {readiness.blockers.map((b, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
