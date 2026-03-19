"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Loader2, MapPin, LandPlot, DollarSign, Target, ChevronRight } from "lucide-react";
import { Button, Card, CardContent, PageIntro, Badge } from "@repo/ui";
import { getLandBankGeoData, getLandScorecard } from "../../../actions/gis-land";
import MapView from "../../../../components/map/MapView";
import MapPopup from "../../../../components/map/MapPopup";
import MapLegend from "../../../../components/map/MapLegend";
import {
  RIYADH_CENTER,
  featureCollectionFromEntities,
  emptyFeatureCollection,
  formatArea,
} from "../../../../lib/map-utils";

// ─── Status Labels ──────────────────────────────────────────
const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  LAND_IDENTIFIED: { ar: "تم التحديد", en: "Identified", color: "#3b82f6" },
  LAND_UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under Review", color: "#f59e0b" },
  LAND_ACQUIRED: { ar: "تم الاستحواذ", en: "Acquired", color: "#22c55e" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const fmtSAR = (n: number, lang: "ar" | "en") =>
  new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Page Component ─────────────────────────────────────────
export default function LandBankPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialLandId = searchParams.get("land");

  const [lands, setLands] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [scorecard, setScorecard] = React.useState<any>(null);
  const [scorecardLoading, setScorecardLoading] = React.useState(false);

  // ─── Load Land Records ────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getLandBankGeoData();
        if (!cancelled) setLands(data);
      } catch {
        // empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Auto-select land parcel from URL query param ─────────
  const landListRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (initialLandId && lands.length > 0 && !selectedId) {
      const match = lands.find((l) => l.id === initialLandId);
      if (match) {
        setSelectedId(match.id);
        // Scroll the matching land item into view in the left panel
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-land-id="${match.id}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    }
  }, [initialLandId, lands, selectedId]);

  // ─── Load Scorecard on Selection ──────────────────────────
  React.useEffect(() => {
    if (!selectedId) {
      setScorecard(null);
      return;
    }
    let cancelled = false;
    setScorecardLoading(true);
    getLandScorecard(selectedId)
      .then((data) => {
        if (!cancelled) setScorecard(data);
      })
      .catch(() => {
        if (!cancelled) setScorecard(null);
      })
      .finally(() => {
        if (!cancelled) setScorecardLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  // ─── KPIs ─────────────────────────────────────────────────
  const kpis = React.useMemo(() => {
    const totalParcels = lands.length;
    const totalArea = lands.reduce((s, l) => s + Number(l.totalAreaSqm || 0), 0);
    const avgSuitability =
      lands.length > 0
        ? Math.round(
            lands.reduce((s, l) => s + Number(l.suitabilityScore || 0), 0) / lands.length,
          )
        : 0;
    const totalValue = lands.reduce((s, l) => s + Number(l.estimatedValueSar || 0), 0);
    return { totalParcels, totalArea, avgSuitability, totalValue };
  }, [lands]);

  // ─── Build Map Sources & Layers ───────────────────────────
  // Parcels with boundary polygons
  const polygonEntities = React.useMemo(() => {
    return lands
      .filter((l) => l.boundaries)
      .map((l) => {
        let geometry = l.boundaries;
        if (typeof geometry === "string") {
          try { geometry = JSON.parse(geometry); } catch { geometry = null; }
        }
        if (!geometry) return null;
        return {
          id: l.id,
          geometry,
          name: l.name,
          status: l.status,
          totalAreaSqm: l.totalAreaSqm,
          region: l.region,
          city: l.city,
          district: l.district,
          landUse: l.landUse,
          estimatedValueSar: l.estimatedValueSar,
          suitabilityScore: l.suitabilityScore,
          landOwner: l.landOwner,
          acquisitionPrice: l.acquisitionPrice,
        };
      })
      .filter(Boolean) as any[];
  }, [lands]);

  const polygonFC = React.useMemo(
    () => polygonEntities.length > 0 ? featureCollectionFromEntities(polygonEntities) : emptyFeatureCollection(),
    [polygonEntities],
  );

  // Parcels with lat/lng but no boundary (point markers)
  const pointEntities = React.useMemo(() => {
    const polygonIds = new Set(polygonEntities.map((e) => e.id));
    return lands
      .filter((l) => !polygonIds.has(l.id) && l.latitude && l.longitude)
      .map((l) => ({
        id: l.id,
        geometry: {
          type: "Point" as const,
          coordinates: [Number(l.longitude), Number(l.latitude)],
        },
        name: l.name,
        status: l.status,
        totalAreaSqm: l.totalAreaSqm,
        region: l.region,
        city: l.city,
        district: l.district,
        landUse: l.landUse,
        estimatedValueSar: l.estimatedValueSar,
        suitabilityScore: l.suitabilityScore,
        landOwner: l.landOwner,
        acquisitionPrice: l.acquisitionPrice,
      }));
  }, [lands, polygonEntities]);

  const pointFC = React.useMemo(
    () => pointEntities.length > 0 ? featureCollectionFromEntities(pointEntities) : emptyFeatureCollection(),
    [pointEntities],
  );

  const sources = React.useMemo(
    () => [
      { id: "land-polygons", type: "geojson" as const, data: polygonFC },
      { id: "land-points", type: "geojson" as const, data: pointFC },
    ],
    [polygonFC, pointFC],
  );

  const colorExpression = [
    "match",
    ["get", "status"],
    "LAND_IDENTIFIED", "#3b82f6",
    "LAND_UNDER_REVIEW", "#f59e0b",
    "LAND_ACQUIRED", "#22c55e",
    "#94a3b8",
  ];

  const layers = React.useMemo(
    () => [
      {
        id: "land-fill",
        sourceId: "land-polygons",
        type: "fill" as const,
        paint: { "fill-color": colorExpression, "fill-opacity": 0.5 },
      },
      {
        id: "land-stroke",
        sourceId: "land-polygons",
        type: "line" as const,
        paint: { "line-color": colorExpression, "line-width": 2 },
      },
      {
        id: "land-circles",
        sourceId: "land-points",
        type: "circle" as const,
        paint: {
          "circle-color": colorExpression,
          "circle-radius": 8,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      },
    ],
    [],
  );

  // ─── Legend ────────────────────────────────────────────────
  const legendItems = React.useMemo(
    () =>
      Object.entries(statusLabels).map(([, v]) => ({
        label: v.en,
        labelAr: v.ar,
        color: v.color,
        type: "fill" as const,
      })),
    [],
  );

  // ─── Map Center ───────────────────────────────────────────
  const mapCenter = React.useMemo<[number, number]>(() => {
    if (selectedId) {
      const land = lands.find((l) => l.id === selectedId);
      if (land?.latitude && land?.longitude) {
        return [Number(land.longitude), Number(land.latitude)];
      }
    }
    // Use first land with coords
    const first = lands.find((l) => l.latitude && l.longitude);
    if (first) return [Number(first.longitude), Number(first.latitude)];
    return RIYADH_CENTER;
  }, [lands, selectedId]);

  // ─── Feature Click ────────────────────────────────────────
  const [popupProps, setPopupProps] = React.useState<Record<string, unknown> | null>(null);

  const handleFeatureClick = React.useCallback(
    (feature: { properties: Record<string, unknown> }) => {
      const props = feature.properties;
      setPopupProps(props);
      if (props.id) setSelectedId(String(props.id));
    },
    [],
  );

  // ─── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "بنك الأراضي" : "Land Bank"}
        description={
          lang === "ar"
            ? "عرض وإدارة جميع الأراضي المحددة والمراجعة والمستحوذ عليها"
            : "View and manage all identified, reviewed, and acquired land parcels"
        }
      />

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <LandPlot className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">{fmt(kpis.totalParcels)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "إجمالي الأراضي" : "Total Parcels"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{formatArea(kpis.totalArea, lang)}</div>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "إجمالي المساحة" : "Total Area"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">{kpis.avgSuitability}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "متوسط الملاءمة" : "Avg Suitability"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">{fmtSAR(kpis.totalValue, lang)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "إجمالي القيمة" : "Total Value"}
          </p>
        </Card>
      </div>

      {/* Main Layout: Left Panel + Map */}
      <div className="flex gap-4" style={{ height: "calc(100vh - 400px)", minHeight: 450 }}>
        {/* Left Panel — Land Pipeline */}
        <div className="w-[350px] shrink-0 overflow-y-auto rounded-lg border border-border bg-card">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "ar" ? "سجل الأراضي" : "Land Pipeline"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "ar"
                ? `${lands.length} قطعة أرض`
                : `${lands.length} parcels`}
            </p>
          </div>

          {lands.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد أراضي مسجلة" : "No land parcels found"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {lands.map((land) => {
                const st = statusLabels[land.status];
                const isActive = selectedId === land.id;
                return (
                  <button
                    key={land.id}
                    data-land-id={land.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(land.id);
                      setPopupProps(null);
                    }}
                    className={`w-full text-start px-4 py-3 hover:bg-muted/40 transition-colors ${
                      isActive ? "bg-primary/5 border-s-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {land.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>

                    {/* Status badge */}
                    {st && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium mt-1.5"
                        style={{ backgroundColor: `${st.color}15`, color: st.color }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: st.color }}
                        />
                        {lang === "ar" ? st.ar : st.en}
                      </span>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {land.totalAreaSqm && (
                        <span>{formatArea(Number(land.totalAreaSqm), lang)}</span>
                      )}
                      {(land.city || land.district) && (
                        <span>{[land.district, land.city].filter(Boolean).join(", ")}</span>
                      )}
                    </div>

                    {/* Suitability bar */}
                    {land.suitabilityScore != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Number(land.suitabilityScore))}%`,
                              backgroundColor:
                                Number(land.suitabilityScore) >= 70
                                  ? "#22c55e"
                                  : Number(land.suitabilityScore) >= 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-end">
                          {land.suitabilityScore}%
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative rounded-lg border border-border overflow-hidden">
          <MapView
            className="h-full w-full"
            initialCenter={mapCenter}
            initialZoom={12}
            sources={sources}
            layers={layers}
            onFeatureClick={handleFeatureClick}
            onMapClick={() => setPopupProps(null)}
          >
            {/* Scorecard Popup */}
            {popupProps && (() => {
              const p = popupProps as Record<string, string | number | null>;
              const st = p.status ? statusLabels[String(p.status)] : null;
              return (
                <Card className="absolute bottom-4 start-4 z-10 w-80 shadow-lg border-border/80 bg-card/95 backdrop-blur-sm">
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {String(p.name ?? "")}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPopupProps(null)}
                        className="h-6 w-6 p-0"
                        style={{ display: "inline-flex" }}
                      >
                        <span className="sr-only">Close</span>
                        &times;
                      </Button>
                    </div>

                    {/* Status */}
                    {st && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium mt-1"
                        style={{ backgroundColor: `${st.color}15`, color: st.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                        {lang === "ar" ? st.ar : st.en}
                      </span>
                    )}
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="divide-y divide-border/50 text-sm">
                      {/* Area */}
                      {p.totalAreaSqm != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "المساحة" : "Area"}
                          </span>
                          <span className="font-medium">
                            {formatArea(Number(p.totalAreaSqm), lang)}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {(p.city || p.district) && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "الموقع" : "Location"}
                          </span>
                          <span className="font-medium text-end">
                            {[p.district, p.city, p.region].filter(Boolean).map(String).join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Land Use */}
                      {p.landUse != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "الاستخدام" : "Land Use"}
                          </span>
                          <span className="font-medium">{String(p.landUse)}</span>
                        </div>
                      )}

                      {/* Owner */}
                      {p.landOwner != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "المالك" : "Owner"}
                          </span>
                          <span className="font-medium">{String(p.landOwner)}</span>
                        </div>
                      )}

                      {/* Asking Price */}
                      {p.acquisitionPrice != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "سعر الطلب" : "Asking Price"}
                          </span>
                          <span className="font-medium">
                            {fmtSAR(Number(p.acquisitionPrice), lang)}
                          </span>
                        </div>
                      )}

                      {/* Estimated Value */}
                      {p.estimatedValueSar != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "القيمة التقديرية" : "Est. Value"}
                          </span>
                          <span className="font-medium">
                            {fmtSAR(Number(p.estimatedValueSar), lang)}
                          </span>
                        </div>
                      )}

                      {/* Suitability */}
                      {p.suitabilityScore != null && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "الملاءمة" : "Suitability"}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Number(p.suitabilityScore))}%`,
                                  backgroundColor:
                                    Number(p.suitabilityScore) >= 70
                                      ? "#22c55e"
                                      : Number(p.suitabilityScore) >= 40
                                        ? "#f59e0b"
                                        : "#ef4444",
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {String(p.suitabilityScore)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Legend */}
            <MapLegend items={legendItems} />
          </MapView>
        </div>
      </div>
    </div>
  );
}
