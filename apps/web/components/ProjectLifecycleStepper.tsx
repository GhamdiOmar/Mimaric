"use client";

import * as React from "react";
import { CheckCircle, Circle, ArrowRight } from "@phosphor-icons/react";

const LIFECYCLE_STAGES = [
  // Land Phase
  { status: "LAND_IDENTIFIED", group: "land", label: { ar: "تحديد الأرض", en: "Identified" } },
  { status: "LAND_UNDER_REVIEW", group: "land", label: { ar: "مراجعة", en: "Review" } },
  { status: "LAND_ACQUIRED", group: "land", label: { ar: "استحواذ", en: "Acquired" } },
  // Design Phase
  { status: "CONCEPT_DESIGN", group: "design", label: { ar: "تصميم مبدئي", en: "Concept" } },
  { status: "SUBDIVISION_PLANNING", group: "design", label: { ar: "تقسيم", en: "Subdivision" } },
  // Authority Phase
  { status: "AUTHORITY_SUBMISSION", group: "authority", label: { ar: "تقديم", en: "Authority" } },
  { status: "INFRASTRUCTURE_PLANNING", group: "authority", label: { ar: "بنية تحتية", en: "Infrastructure" } },
  // Off-Plan Phase
  { status: "INVENTORY_STRUCTURING", group: "offplan", label: { ar: "مخزون", en: "Inventory" } },
  { status: "PRICING_PACKAGING", group: "offplan", label: { ar: "تسعير", en: "Pricing" } },
  { status: "LAUNCH_READINESS", group: "offplan", label: { ar: "جاهزية", en: "Ready" } },
  { status: "OFF_PLAN_LAUNCHED", group: "offplan", label: { ar: "إطلاق", en: "Launched" } },
  // Construction & Handover
  { status: "PLANNING", group: "build", label: { ar: "تخطيط", en: "Planning" } },
  { status: "UNDER_CONSTRUCTION", group: "build", label: { ar: "إنشاء", en: "Construction" } },
  { status: "READY", group: "build", label: { ar: "جاهز", en: "Ready" } },
  { status: "HANDED_OVER", group: "build", label: { ar: "تسليم", en: "Handover" } },
];

const GROUP_LABELS: Record<string, { ar: string; en: string }> = {
  land: { ar: "الأرض", en: "Land" },
  design: { ar: "التصميم", en: "Design" },
  authority: { ar: "الجهات", en: "Authority" },
  offplan: { ar: "ما قبل البيع", en: "Off-Plan" },
  build: { ar: "التنفيذ", en: "Execution" },
};

const GROUP_COLORS: Record<string, string> = {
  land: "bg-emerald-500",
  design: "bg-blue-500",
  authority: "bg-amber-500",
  offplan: "bg-purple-500",
  build: "bg-teal-500",
};

interface ProjectLifecycleStepperProps {
  currentStatus: string;
  lang: "ar" | "en";
}

export function ProjectLifecycleStepper({ currentStatus, lang }: ProjectLifecycleStepperProps) {
  const currentIdx = LIFECYCLE_STAGES.findIndex((s) => s.status === currentStatus);

  // Group stages
  const groups = ["land", "design", "authority", "offplan", "build"];

  return (
    <div className="bg-card rounded-xl border border-border p-4 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-[900px]">
        {groups.map((group, gi) => {
          const stages = LIFECYCLE_STAGES.filter((s) => s.group === group);
          const groupLabel = GROUP_LABELS[group]?.[lang] || group;

          return (
            <React.Fragment key={group}>
              {gi > 0 && (
                <ArrowRight size={14} className="text-neutral/40 shrink-0 mx-0.5" />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral text-center">
                  {groupLabel}
                </span>
                <div className="flex items-center gap-0.5">
                  {stages.map((stage) => {
                    const stageIdx = LIFECYCLE_STAGES.findIndex((s) => s.status === stage.status);
                    const isComplete = stageIdx < currentIdx;
                    const isCurrent = stageIdx === currentIdx;
                    const isFuture = stageIdx > currentIdx;

                    return (
                      <div
                        key={stage.status}
                        className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors ${
                          isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : ""
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                            isComplete
                              ? GROUP_COLORS[group]
                              : isCurrent
                                ? GROUP_COLORS[group]
                                : "bg-muted"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle size={14} weight="fill" />
                          ) : isCurrent ? (
                            <Circle size={10} weight="fill" />
                          ) : (
                            <Circle size={10} className="text-neutral/50" />
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-medium text-center leading-tight whitespace-nowrap ${
                            isComplete
                              ? "text-secondary"
                              : isCurrent
                                ? "text-primary font-bold"
                                : "text-neutral/50"
                          }`}
                        >
                          {stage.label[lang]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
