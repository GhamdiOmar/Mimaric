"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Loader2, MapPin, ChevronDown } from "lucide-react";
import { Button, Card, PageIntro, Badge } from "@repo/ui";
import { getProjectsForGisMap, getProjectGeoData, getGisDashboardStats } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapPopup from "../../../../components/map/MapPopup";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, featureCollectionFromEntities, emptyFeatureCollection, formatArea } from "../../../../lib/map-utils";
import { PLOT_STATUS_COLORS, getLegendItems } from "../../../../lib/map-styles";

// ─── Status Labels ──────────────────────────────────────────
const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  AVAILABLE_FOR_SALE: { ar: "متاح", en: "Available" },
  RESERVED: { ar: "محجوز", en: "Reserved" },
  SOLD: { ar: "مباع", en: "Sold" },
  HELD: { ar: "محتجز", en: "Held" },
  PLANNED: { ar: "مخطط", en: "Planned" },
  APPROVED: { ar: "معتمد", en: "Approved" },
};

const FILTER_STATUSES = ["ALL", "AVAILABLE_FOR_SALE", "RESERVED", "SOLD", "HELD", "PLANNED"] as const;

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

// ─── Page Component ─────────────────────────────────────────
export default function SalesMapPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<string>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);

  // Map data
  const [geoData, setGeoData] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);

  // Popup
  const [popupProps, setPopupProps] = React.useState<Record<string, unknown> | null>(null);

  // ─── Load Projects ────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getProjectsForGisMap();
        setProjects(data);
        if (data.length > 0) {
          const match = initialProjectId ? data.find((p: any) => p.id === initialProjectId) : null;
          setSelectedProjectId(match ? match.id : data[0].id);
        }
      } catch {
        // silently handle — empty state will show
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Load Project Data ────────────────────────────────────
  React.useEffect(() => {
    if (!selectedProjectId) return;
    async function loadProjectData() {
      setDataLoading(true);
      try {
        const [geo, s] = await Promise.all([
          getProjectGeoData(selectedProjectId!),
          getGisDashboardStats(selectedProjectId!),
        ]);
        setGeoData(geo);
        setStats(s);
        setActiveFilter("ALL");
        setPopupProps(null);
      } catch {
        setGeoData(null);
        setStats(null);
      } finally {
        setDataLoading(false);
      }
    }
    loadProjectData();
  }, [selectedProjectId]);

  // ─── Build Map Sources & Layers ───────────────────────────
  const plotsWithGeometry = React.useMemo(() => {
    if (!geoData?.plots) return [];
    return geoData.plots
      .filter((p: any) => p.boundaryGeoJson)
      .map((p: any) => ({
        id: p.id,
        geometry: typeof p.boundaryGeoJson === "string" ? JSON.parse(p.boundaryGeoJson) : p.boundaryGeoJson,
        plotNumber: p.plotNumber,
        area: p.areaSqm,
        status: p.status,
        landUse: p.landUse,
        productType: p.productType,
        phase: p.phase,
      }));
  }, [geoData]);

  const plotFeatureCollection = React.useMemo(
    () => plotsWithGeometry.length > 0 ? featureCollectionFromEntities(plotsWithGeometry) : emptyFeatureCollection(),
    [plotsWithGeometry],
  );

  const sources = React.useMemo(() => [
    { id: "plots-source", type: "geojson" as const, data: plotFeatureCollection },
  ], [plotFeatureCollection]);

  const layers = React.useMemo(() => {
    const plotFilter = activeFilter !== "ALL"
      ? ["==", ["get", "status"], activeFilter]
      : undefined;

    return [
      {
        id: "plots-fill",
        sourceId: "plots-source",
        type: "fill" as const,
        paint: {
          "fill-color": [
            "match", ["get", "status"],
            "AVAILABLE_FOR_SALE", "#22c55e",
            "RESERVED", "#f59e0b",
            "SOLD", "#6366f1",
            "HELD", "#ef4444",
            "PLANNED", "#94a3b8",
            "APPROVED", "#3b82f6",
            "#94a3b8",
          ],
          "fill-opacity": 0.6,
        },
        ...(plotFilter ? { filter: plotFilter } : {}),
      },
      {
        id: "plots-stroke",
        sourceId: "plots-source",
        type: "line" as const,
        paint: {
          "line-color": [
            "match", ["get", "status"],
            "AVAILABLE_FOR_SALE", "#16a34a",
            "RESERVED", "#d97706",
            "SOLD", "#4f46e5",
            "HELD", "#dc2626",
            "PLANNED", "#64748b",
            "APPROVED", "#2563eb",
            "#64748b",
          ],
          "line-width": 1,
        },
        ...(plotFilter ? { filter: plotFilter } : {}),
      },
    ];
  }, [activeFilter]);

  // ─── Map center ───────────────────────────────────────────
  const mapCenter = React.useMemo<[number, number]>(() => {
    if (!geoData?.project) return RIYADH_CENTER;
    const { longitude, latitude } = geoData.project;
    if (longitude && latitude) return [Number(longitude), Number(latitude)];
    return RIYADH_CENTER;
  }, [geoData]);

  // ─── Legend items ─────────────────────────────────────────
  const legendItems = React.useMemo(() =>
    getLegendItems("plot").map(item => ({ ...item, type: "fill" as const })),
    [],
  );

  // ─── Feature Click ────────────────────────────────────────
  const handleFeatureClick = React.useCallback((feature: { properties: Record<string, unknown> }) => {
    setPopupProps(feature.properties);
  }, []);

  // ─── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageIntro
          title={lang === "ar" ? "خريطة المبيعات" : "Sales Map"}
          description={lang === "ar" ? "عرض القطع حسب حالة البيع على الخريطة" : "View plots by sales status on the map"}
        />
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "قم بإنشاء مشروع أولاً لعرض خريطة المبيعات" : "Create a project first to view the sales map"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "خريطة المبيعات" : "Sales Map"}
        description={lang === "ar" ? "عرض القطع حسب حالة البيع على الخريطة" : "View plots by sales status on the map"}
      />

      {/* Controls: Project selector + Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Project Selector */}
        <div className="relative">
          <select
            value={selectedProjectId ?? ""}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 appearance-none rounded-md border border-border bg-card pe-8 ps-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {FILTER_STATUSES.map((status) => {
            const isActive = activeFilter === status;
            const label = status === "ALL"
              ? (lang === "ar" ? "الكل" : "All")
              : (STATUS_LABELS[status]?.[lang] ?? status);
            const color = status !== "ALL" ? PLOT_STATUS_COLORS[status] : undefined;

            return (
              <Button
                key={status}
                size="sm"
                variant={isActive ? "primary" : "outline"}
                className="h-7 px-2.5 text-xs gap-1.5"
                style={{
                  display: "inline-flex",
                  ...(isActive && color ? { backgroundColor: color, borderColor: color } : {}),
                }}
                onClick={() => setActiveFilter(status)}
              >
                {color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? "#fff" : color }}
                  />
                )}
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-lg border border-border overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
        {dataLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <MapView
          className="h-full w-full"
          initialCenter={mapCenter}
          initialZoom={14}
          sources={sources}
          layers={layers}
          onFeatureClick={handleFeatureClick}
        >
          {/* Popup */}
          {popupProps && (
            <MapPopup
              properties={popupProps}
              entityType="plot"
              onClose={() => setPopupProps(null)}
            />
          )}

          {/* Legend */}
          <MapLegend items={legendItems} />
        </MapView>
      </div>

      {/* Bottom Stats Bar */}
      {stats && (
        <div className="flex gap-3 p-3 bg-card/80 backdrop-blur rounded-lg border border-border">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-card-foreground">{fmt(stats.totalPlots)}</div>
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "إجمالي القطع" : "Total Plots"}
            </div>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-success">{fmt(stats.availablePlots)}</div>
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "متاح للبيع" : "Available"}
            </div>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-warning">{fmt(stats.reservedPlots)}</div>
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "محجوز" : "Reserved"}
            </div>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-primary">{stats.soldPercentage}%</div>
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "نسبة المباع" : "Sold %"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
