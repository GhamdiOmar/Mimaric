"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@repo/ui";
import { Button } from "@repo/ui";
import { useLanguage } from "../LanguageProvider";
import { formatArea, formatLength } from "../../lib/map-utils";
import {
  PLOT_STATUS_COLORS,
  UTILITY_COLORS,
  ROAD_STYLES,
  getConstructionProgressColor,
  HANDOVER_STATUS_COLORS,
} from "../../lib/map-styles";

// ─── Types ─────────────────────────────────────────────────
type EntityType = "plot" | "building" | "road" | "utility" | "phase" | "asset";

interface MapPopupProps {
  properties: Record<string, unknown> | null;
  onClose: () => void;
  entityType?: EntityType;
}

// ─── Labels ────────────────────────────────────────────────
const LABELS: Record<string, { en: string; ar: string }> = {
  plotNumber: { en: "Plot Number", ar: "رقم القطعة" },
  area: { en: "Area", ar: "المساحة" },
  status: { en: "Status", ar: "الحالة" },
  landUse: { en: "Land Use", ar: "استخدام الأرض" },
  price: { en: "Price", ar: "السعر" },
  name: { en: "Name", ar: "الاسم" },
  type: { en: "Type", ar: "النوع" },
  floors: { en: "Floors", ar: "الأدوار" },
  constructionProgress: { en: "Construction", ar: "التنفيذ" },
  width: { en: "Width", ar: "العرض" },
  length: { en: "Length", ar: "الطول" },
  capacity: { en: "Capacity", ar: "السعة" },
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  PLANNED: { en: "Planned", ar: "مخطط" },
  APPROVED: { en: "Approved", ar: "معتمد" },
  AVAILABLE_FOR_SALE: { en: "Available", ar: "متاح" },
  RESERVED: { en: "Reserved", ar: "محجوز" },
  SOLD: { en: "Sold", ar: "مباع" },
  HELD: { en: "Held", ar: "محتجز" },
  PENDING: { en: "Pending", ar: "معلق" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  PASSED: { en: "Passed", ar: "ناجح" },
  FAILED: { en: "Failed", ar: "فاشل" },
  ACTIVE: { en: "Active", ar: "نشط" },
  INACTIVE: { en: "Inactive", ar: "غير نشط" },
};

// ─── Helpers ───────────────────────────────────────────────
function StatusBadge({
  status,
  lang,
  colorMap,
}: {
  status: string;
  lang: "ar" | "en";
  colorMap?: Record<string, string>;
}) {
  const color = colorMap?.[status] ?? "#94a3b8";
  const label = STATUS_LABELS[status]?.[lang] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-end">
        {value}
      </span>
    </div>
  );
}

function getLabel(key: string, lang: "ar" | "en"): string {
  return LABELS[key]?.[lang] ?? key;
}

// ─── Entity-Specific Layouts ───────────────────────────────
function PlotPopup({
  p,
  lang,
}: {
  p: Record<string, unknown>;
  lang: "ar" | "en";
}) {
  return (
    <>
      {p.plotNumber != null && (
        <Row
          label={getLabel("plotNumber", lang)}
          value={String(p.plotNumber)}
        />
      )}
      {p.area != null && (
        <Row
          label={getLabel("area", lang)}
          value={formatArea(Number(p.area), lang)}
        />
      )}
      {p.status != null && (
        <Row
          label={getLabel("status", lang)}
          value={
            <StatusBadge
              status={String(p.status)}
              lang={lang}
              colorMap={PLOT_STATUS_COLORS}
            />
          }
        />
      )}
      {p.landUse != null && (
        <Row label={getLabel("landUse", lang)} value={String(p.landUse)} />
      )}
      {p.price != null && (
        <Row
          label={getLabel("price", lang)}
          value={
            new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
              style: "currency",
              currency: "SAR",
              maximumFractionDigits: 0,
            }).format(Number(p.price))
          }
        />
      )}
    </>
  );
}

function BuildingPopup({
  p,
  lang,
}: {
  p: Record<string, unknown>;
  lang: "ar" | "en";
}) {
  const progress = Number(p.constructionProgress ?? p.progress ?? 0);
  return (
    <>
      {p.name != null && (
        <Row label={getLabel("name", lang)} value={String(p.name)} />
      )}
      {p.type != null && (
        <Row label={getLabel("type", lang)} value={String(p.type)} />
      )}
      {p.floors != null && (
        <Row label={getLabel("floors", lang)} value={String(p.floors)} />
      )}
      {p.area != null && (
        <Row
          label={getLabel("area", lang)}
          value={formatArea(Number(p.area), lang)}
        />
      )}
      <Row
        label={getLabel("constructionProgress", lang)}
        value={
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-12 rounded-full overflow-hidden bg-muted"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getConstructionProgressColor(progress),
                }}
              />
            </span>
            <span className="text-xs">{progress}%</span>
          </span>
        }
      />
    </>
  );
}

function RoadPopup({
  p,
  lang,
}: {
  p: Record<string, unknown>;
  lang: "ar" | "en";
}) {
  return (
    <>
      {p.name != null && (
        <Row label={getLabel("name", lang)} value={String(p.name)} />
      )}
      {p.type != null && (
        <Row
          label={getLabel("type", lang)}
          value={
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{
                  backgroundColor:
                    ROAD_STYLES[String(p.type)]?.color ?? "#94a3b8",
                }}
              />
              {String(p.type)}
            </span>
          }
        />
      )}
      {p.width != null && (
        <Row
          label={getLabel("width", lang)}
          value={formatLength(Number(p.width), lang)}
        />
      )}
      {p.length != null && (
        <Row
          label={getLabel("length", lang)}
          value={formatLength(Number(p.length), lang)}
        />
      )}
    </>
  );
}

function UtilityPopup({
  p,
  lang,
}: {
  p: Record<string, unknown>;
  lang: "ar" | "en";
}) {
  return (
    <>
      {p.type != null && (
        <Row
          label={getLabel("type", lang)}
          value={
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    UTILITY_COLORS[String(p.type)] ?? "#94a3b8",
                }}
              />
              {String(p.type)}
            </span>
          }
        />
      )}
      {p.capacity != null && (
        <Row
          label={getLabel("capacity", lang)}
          value={String(p.capacity)}
        />
      )}
      {p.status != null && (
        <Row
          label={getLabel("status", lang)}
          value={
            <StatusBadge
              status={String(p.status)}
              lang={lang}
              colorMap={HANDOVER_STATUS_COLORS}
            />
          }
        />
      )}
    </>
  );
}

function GenericPopup({
  p,
  lang,
}: {
  p: Record<string, unknown>;
  lang: "ar" | "en";
}) {
  // Show all non-internal properties
  const entries = Object.entries(p).filter(
    ([key]) => !key.startsWith("_") && key !== "id",
  );
  return (
    <>
      {entries.slice(0, 6).map(([key, value]) => (
        <Row key={key} label={getLabel(key, lang)} value={String(value)} />
      ))}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function MapPopup({
  properties,
  onClose,
  entityType,
}: MapPopupProps) {
  const { lang } = useLanguage();

  if (!properties) return null;

  const title =
    (properties.name as string) ??
    (properties.plotNumber
      ? `${lang === "ar" ? "قطعة" : "Plot"} ${properties.plotNumber}`
      : lang === "ar"
        ? "تفاصيل العنصر"
        : "Feature Details");

  function renderContent() {
    switch (entityType) {
      case "plot":
        return <PlotPopup p={properties!} lang={lang} />;
      case "building":
        return <BuildingPopup p={properties!} lang={lang} />;
      case "road":
        return <RoadPopup p={properties!} lang={lang} />;
      case "utility":
        return <UtilityPopup p={properties!} lang={lang} />;
      default:
        return <GenericPopup p={properties!} lang={lang} />;
    }
  }

  return (
    <Card className="absolute bottom-4 start-4 z-10 w-72 shadow-lg border-border/80 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {title}
        </h3>
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
      <CardContent className="px-4 pb-3 pt-0">
        <div className="divide-y divide-border/50">{renderContent()}</div>
      </CardContent>
    </Card>
  );
}
