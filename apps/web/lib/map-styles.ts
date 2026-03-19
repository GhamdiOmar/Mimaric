// ─── Plot Status Colors ────────────────────────────────────
export const PLOT_STATUS_COLORS: Record<string, string> = {
  PLANNED: "#94a3b8",
  APPROVED: "#3b82f6",
  AVAILABLE_FOR_SALE: "#22c55e",
  RESERVED: "#f59e0b",
  SOLD: "#6366f1",
  HELD: "#ef4444",
};

// ─── Road Type Styles ──────────────────────────────────────
export const ROAD_STYLES: Record<
  string,
  { color: string; width: number; dasharray?: number[] }
> = {
  PRIMARY: { color: "#475569", width: 3 },
  SECONDARY: { color: "#64748b", width: 2 },
  LOCAL: { color: "#94a3b8", width: 1 },
  SERVICE: { color: "#94a3b8", width: 1, dasharray: [6, 4] },
  CUL_DE_SAC: { color: "#94a3b8", width: 1, dasharray: [2, 3] },
};

// ─── Utility Type Colors ───────────────────────────────────
export const UTILITY_COLORS: Record<string, string> = {
  WATER: "#3b82f6",
  SEWAGE: "#92400e",
  ELECTRICITY: "#f59e0b",
  TELECOM: "#8b5cf6",
  GAS: "#ef4444",
  STORMWATER: "#06b6d4",
};

// ─── Construction Progress Gradient ────────────────────────
export const CONSTRUCTION_PROGRESS_COLORS: Array<{
  stop: number;
  color: string;
}> = [
  { stop: 0, color: "#ef4444" },
  { stop: 25, color: "#f97316" },
  { stop: 50, color: "#f59e0b" },
  { stop: 75, color: "#84cc16" },
  { stop: 100, color: "#22c55e" },
];

export function getConstructionProgressColor(percent: number): string {
  if (percent <= 0) return CONSTRUCTION_PROGRESS_COLORS[0]!.color;
  if (percent >= 100) return CONSTRUCTION_PROGRESS_COLORS[4]!.color;
  // Linear interpolation between stops
  for (let i = 0; i < CONSTRUCTION_PROGRESS_COLORS.length - 1; i++) {
    const curr = CONSTRUCTION_PROGRESS_COLORS[i]!;
    const next = CONSTRUCTION_PROGRESS_COLORS[i + 1]!;
    if (percent >= curr.stop && percent <= next.stop) {
      return next.color;
    }
  }
  return CONSTRUCTION_PROGRESS_COLORS[4]!.color;
}

// ─── Handover Status Colors ────────────────────────────────
export const HANDOVER_STATUS_COLORS: Record<string, string> = {
  PENDING: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  PASSED: "#22c55e",
  FAILED: "#ef4444",
};

// ─── Entity Types ──────────────────────────────────────────
type EntityType =
  | "plot"
  | "building"
  | "road"
  | "utility"
  | "phase"
  | "asset"
  | "handover";

// ─── Feature Style Resolver ────────────────────────────────
export function getFeatureStyle(
  entityType: EntityType,
  statusOrType: string,
): Record<string, unknown> {
  switch (entityType) {
    case "plot":
      return {
        "fill-color": PLOT_STATUS_COLORS[statusOrType] ?? "#94a3b8",
        "fill-opacity": 0.5,
        "fill-outline-color": PLOT_STATUS_COLORS[statusOrType] ?? "#94a3b8",
      };

    case "building":
      return {
        "fill-color": getConstructionProgressColor(
          parseInt(statusOrType, 10) || 0,
        ),
        "fill-opacity": 0.6,
        "fill-outline-color": "#334155",
      };

    case "road": {
      const style = ROAD_STYLES[statusOrType] ?? ROAD_STYLES.LOCAL!;
      const paint: Record<string, unknown> = {
        "line-color": style.color,
        "line-width": style.width,
      };
      if (style.dasharray) {
        paint["line-dasharray"] = style.dasharray;
      }
      return paint;
    }

    case "utility":
      return {
        "line-color": UTILITY_COLORS[statusOrType] ?? "#94a3b8",
        "line-width": 2,
      };

    case "phase":
      return {
        "fill-color": PLOT_STATUS_COLORS[statusOrType] ?? "#94a3b8",
        "fill-opacity": 0.2,
        "fill-outline-color": PLOT_STATUS_COLORS[statusOrType] ?? "#94a3b8",
      };

    case "handover":
      return {
        "fill-color": HANDOVER_STATUS_COLORS[statusOrType] ?? "#94a3b8",
        "fill-opacity": 0.4,
        "fill-outline-color":
          HANDOVER_STATUS_COLORS[statusOrType] ?? "#94a3b8",
      };

    case "asset":
      return {
        "circle-color": "#6366f1",
        "circle-radius": 6,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      };

    default:
      return {
        "fill-color": "#94a3b8",
        "fill-opacity": 0.3,
      };
  }
}

// ─── Legend Items ───────────────────────────────────────────
interface LegendItem {
  label: string;
  labelAr: string;
  color: string;
}

export function getLegendItems(entityType: EntityType): LegendItem[] {
  switch (entityType) {
    case "plot":
      return [
        { label: "Planned", labelAr: "مخطط", color: PLOT_STATUS_COLORS.PLANNED! },
        { label: "Approved", labelAr: "معتمد", color: PLOT_STATUS_COLORS.APPROVED! },
        {
          label: "Available for Sale",
          labelAr: "متاح للبيع",
          color: PLOT_STATUS_COLORS.AVAILABLE_FOR_SALE!,
        },
        { label: "Reserved", labelAr: "محجوز", color: PLOT_STATUS_COLORS.RESERVED! },
        { label: "Sold", labelAr: "مباع", color: PLOT_STATUS_COLORS.SOLD! },
        { label: "Held", labelAr: "محتجز", color: PLOT_STATUS_COLORS.HELD! },
      ];

    case "road":
      return [
        { label: "Primary", labelAr: "رئيسي", color: ROAD_STYLES.PRIMARY!.color },
        { label: "Secondary", labelAr: "ثانوي", color: ROAD_STYLES.SECONDARY!.color },
        { label: "Local", labelAr: "محلي", color: ROAD_STYLES.LOCAL!.color },
        { label: "Service", labelAr: "خدمة", color: ROAD_STYLES.SERVICE!.color },
        {
          label: "Cul-de-sac",
          labelAr: "طريق مسدود",
          color: ROAD_STYLES.CUL_DE_SAC!.color,
        },
      ];

    case "utility":
      return [
        { label: "Water", labelAr: "مياه", color: UTILITY_COLORS.WATER! },
        { label: "Sewage", labelAr: "صرف صحي", color: UTILITY_COLORS.SEWAGE! },
        { label: "Electricity", labelAr: "كهرباء", color: UTILITY_COLORS.ELECTRICITY! },
        { label: "Telecom", labelAr: "اتصالات", color: UTILITY_COLORS.TELECOM! },
        { label: "Gas", labelAr: "غاز", color: UTILITY_COLORS.GAS! },
        {
          label: "Stormwater",
          labelAr: "تصريف أمطار",
          color: UTILITY_COLORS.STORMWATER!,
        },
      ];

    case "building":
      return CONSTRUCTION_PROGRESS_COLORS.map((c) => ({
        label: `${c.stop}%`,
        labelAr: `${c.stop}٪`,
        color: c.color,
      }));

    case "handover":
      return [
        { label: "Pending", labelAr: "معلق", color: HANDOVER_STATUS_COLORS.PENDING! },
        {
          label: "In Progress",
          labelAr: "قيد التنفيذ",
          color: HANDOVER_STATUS_COLORS.IN_PROGRESS!,
        },
        { label: "Passed", labelAr: "ناجح", color: HANDOVER_STATUS_COLORS.PASSED! },
        { label: "Failed", labelAr: "فاشل", color: HANDOVER_STATUS_COLORS.FAILED! },
      ];

    case "phase":
      return [
        { label: "Planned", labelAr: "مخطط", color: PLOT_STATUS_COLORS.PLANNED! },
        { label: "Approved", labelAr: "معتمد", color: PLOT_STATUS_COLORS.APPROVED! },
        { label: "Sold", labelAr: "مباع", color: PLOT_STATUS_COLORS.SOLD! },
      ];

    case "asset":
      return [{ label: "Asset", labelAr: "أصل", color: "#6366f1" }];

    default:
      return [];
  }
}
