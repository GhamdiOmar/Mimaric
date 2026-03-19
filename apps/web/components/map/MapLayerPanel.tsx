"use client";

import * as React from "react";
import { Eye, EyeOff, Layers, X } from "lucide-react";
import { Button } from "@repo/ui";
import { useLanguage } from "../LanguageProvider";

// ─── Types ─────────────────────────────────────────────────
interface LayerInfo {
  id: string;
  name: string;
  nameArabic?: string;
  type: string;
  featureCount: number;
  visible: boolean;
  color: string;
}

interface MapLayerPanelProps {
  layers: LayerInfo[];
  onToggleVisibility: (layerId: string) => void;
  onClose: () => void;
}

// ─── Group Labels ──────────────────────────────────────────
const GROUP_LABELS: Record<string, { en: string; ar: string }> = {
  boundary: { en: "Boundaries", ar: "الحدود" },
  parcel: { en: "Parcels", ar: "القطع" },
  plot: { en: "Plots", ar: "الأراضي" },
  road: { en: "Roads", ar: "الطرق" },
  utility: { en: "Utilities", ar: "المرافق" },
  building: { en: "Buildings", ar: "المباني" },
  phase: { en: "Phases", ar: "المراحل" },
  asset: { en: "Assets", ar: "الأصول" },
  other: { en: "Other", ar: "أخرى" },
};

// ─── Component ─────────────────────────────────────────────
export default function MapLayerPanel({
  layers,
  onToggleVisibility,
  onClose,
}: MapLayerPanelProps) {
  const { lang } = useLanguage();

  // Group layers by type
  const grouped = React.useMemo(() => {
    const map = new Map<string, LayerInfo[]>();
    for (const layer of layers) {
      const groupKey = layer.type.toLowerCase();
      const key = GROUP_LABELS[groupKey] ? groupKey : "other";
      const group = map.get(key) ?? [];
      group.push(layer);
      map.set(key, group);
    }
    return map;
  }, [layers]);

  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set(),
  );

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  return (
    <div className="absolute top-4 start-4 z-10 w-64 max-h-[calc(100%-2rem)] flex flex-col rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {lang === "ar" ? "الطبقات" : "Layers"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
          style={{ display: "inline-flex" }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Layer List */}
      <div className="overflow-y-auto flex-1 py-1">
        {Array.from(grouped.entries()).map(([group, groupLayers]) => {
          const isCollapsed = collapsedGroups.has(group);
          const groupLabel =
            GROUP_LABELS[group]?.[lang] ?? GROUP_LABELS.other![lang];

          return (
            <div key={group}>
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:bg-muted/40 transition-colors"
              >
                <span>{groupLabel}</span>
                <span className="text-[10px] font-normal normal-case">
                  {groupLayers.length}
                </span>
              </button>

              {/* Layers */}
              {!isCollapsed &&
                groupLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/30 transition-colors"
                  >
                    {/* Color swatch */}
                    <span
                      className="h-3 w-3 rounded-sm shrink-0 border border-border/40"
                      style={{ backgroundColor: layer.color }}
                    />

                    {/* Name & count */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-foreground truncate block">
                        {lang === "ar" && layer.nameArabic
                          ? layer.nameArabic
                          : layer.name}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {layer.featureCount}
                    </span>

                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(layer.id)}
                      className="p-0.5 rounded hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                      title={
                        layer.visible
                          ? lang === "ar"
                            ? "إخفاء"
                            : "Hide"
                          : lang === "ar"
                            ? "إظهار"
                            : "Show"
                      }
                    >
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          );
        })}

        {layers.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {lang === "ar" ? "لا توجد طبقات" : "No layers"}
          </div>
        )}
      </div>
    </div>
  );
}
