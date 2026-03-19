"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

// ─── Types ─────────────────────────────────────────────────
interface LegendItem {
  label: string;
  labelAr?: string;
  color: string;
  type: "fill" | "line" | "circle";
}

interface MapLegendProps {
  items: LegendItem[];
}

// ─── Swatch Components ─────────────────────────────────────
function Swatch({ item }: { item: LegendItem }) {
  switch (item.type) {
    case "fill":
      return (
        <span
          className="h-3 w-4 rounded-sm border border-border/40 shrink-0"
          style={{ backgroundColor: item.color }}
        />
      );
    case "line":
      return (
        <span
          className="h-0.5 w-4 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
      );
    case "circle":
      return (
        <span
          className="h-2.5 w-2.5 rounded-full border-2 border-white shrink-0"
          style={{ backgroundColor: item.color }}
        />
      );
  }
}

// ─── Component ─────────────────────────────────────────────
export default function MapLegend({ items }: MapLegendProps) {
  const { lang } = useLanguage();
  const [collapsed, setCollapsed] = React.useState(false);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-4 end-4 z-10 rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{lang === "ar" ? "دليل الألوان" : "Legend"}</span>
        {collapsed ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="px-3 pb-2.5 space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <Swatch item={item} />
              <span className="text-[11px] text-muted-foreground leading-tight">
                {lang === "ar" && item.labelAr ? item.labelAr : item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
