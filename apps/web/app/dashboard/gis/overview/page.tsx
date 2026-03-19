"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Loader2, MapPin, LandPlot, Map, TrendingUp, RouteIcon, Building2, Ruler, ChevronDown, BarChart3 } from "lucide-react";
import { Card, CardContent, PageIntro, KPICard } from "@repo/ui";
import { getProjectsForGisMap, getProjectGeoData, getGisDashboardStats } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, featureCollectionFromEntities, emptyFeatureCollection, formatArea, formatLength } from "../../../../lib/map-utils";
import { PLOT_STATUS_COLORS, getLegendItems } from "../../../../lib/map-styles";

// ─── Status Labels ──────────────────────────────────────────
const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  AVAILABLE_FOR_SALE: { ar: "متاح للبيع", en: "Available" },
  RESERVED: { ar: "محجوز", en: "Reserved" },
  SOLD: { ar: "مباع", en: "Sold" },
  HELD: { ar: "محتجز", en: "Held" },
  PLANNED: { ar: "مخطط", en: "Planned" },
  APPROVED: { ar: "معتمد", en: "Approved" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

// ─── Page Component ─────────────────────────────────────────
export default function GisOverviewPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);

  const [geoData, setGeoData] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);

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
        // empty state will show
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
        status: p.status,
        area: p.areaSqm,
      }));
  }, [geoData]);

  const plotFeatureCollection = React.useMemo(
    () => plotsWithGeometry.length > 0 ? featureCollectionFromEntities(plotsWithGeometry) : emptyFeatureCollection(),
    [plotsWithGeometry],
  );

  const sources = React.useMemo(() => [
    { id: "plots-source", type: "geojson" as const, data: plotFeatureCollection },
  ], [plotFeatureCollection]);

  const layers = React.useMemo(() => [
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
    },
  ], []);

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
          title={lang === "ar" ? "نظرة عامة على GIS" : "GIS Overview"}
          description={lang === "ar" ? "لوحة معلومات نظام المعلومات الجغرافية للمشروع" : "Geographic information system dashboard for your project"}
        />
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "قم بإنشاء مشروع أولاً لعرض بيانات GIS" : "Create a project first to view GIS data"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "نظرة عامة على GIS" : "GIS Overview"}
        description={lang === "ar" ? "لوحة معلومات نظام المعلومات الجغرافية للمشروع" : "Geographic information system dashboard for your project"}
      />

      {/* Project Selector */}
      <div className="relative w-fit">
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

      {/* Loading overlay for data */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards — Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label={lang === "ar" ? "إجمالي المساحة" : "Total Area"}
              value={stats.totalAreaSqm ? formatArea(Number(stats.totalAreaSqm), lang) : "—"}
              icon={<LandPlot className="h-5 w-5" />}
              accentColor="primary"
            />
            <KPICard
              label={lang === "ar" ? "مساحة القطع" : "Plot Area"}
              value={stats.totalPlotArea ? formatArea(Number(stats.totalPlotArea), lang) : "—"}
              icon={<Map className="h-5 w-5" />}
              accentColor="info"
            />
            <KPICard
              label={lang === "ar" ? "نسبة المباع" : "Sold %"}
              value={`${stats.soldPercentage}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor={stats.soldPercentage >= 70 ? "success" : stats.soldPercentage >= 40 ? "warning" : "destructive"}
            />
            <KPICard
              label={lang === "ar" ? "عدد الشوارع" : "Total Roads"}
              value={fmt(stats.totalRoads)}
              icon={<RouteIcon className="h-5 w-5" />}
              accentColor="accent"
            />
          </div>

          {/* KPI Cards — Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label={lang === "ar" ? "قطع متاحة" : "Available Plots"}
              value={fmt(stats.availablePlots)}
              icon={<MapPin className="h-5 w-5" />}
              accentColor="success"
            />
            <KPICard
              label={lang === "ar" ? "قطع محجوزة" : "Reserved Plots"}
              value={fmt(stats.reservedPlots)}
              icon={<MapPin className="h-5 w-5" />}
              accentColor="warning"
            />
            <KPICard
              label={lang === "ar" ? "المباني" : "Buildings"}
              value={fmt(stats.totalBuildings)}
              icon={<Building2 className="h-5 w-5" />}
              accentColor="secondary"
            />
            <KPICard
              label={lang === "ar" ? "شبكة الطرق" : "Road Network"}
              value={stats.totalRoadLength ? formatLength(Number(stats.totalRoadLength), lang) : "—"}
              icon={<Ruler className="h-5 w-5" />}
              accentColor="info"
            />
          </div>

          {/* Bottom Row: Mini Map + Plot Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mini Map */}
            <Card className="overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {lang === "ar" ? "خريطة المشروع" : "Project Map"}
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="relative" style={{ height: 400 }}>
                  <MapView
                    className="h-full w-full"
                    initialCenter={mapCenter}
                    initialZoom={14}
                    sources={sources}
                    layers={layers}
                    showControls={false}
                  >
                    <MapLegend items={legendItems} />
                  </MapView>
                </div>
              </CardContent>
            </Card>

            {/* Plot Status Breakdown */}
            <Card>
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {lang === "ar" ? "توزيع القطع حسب الحالة" : "Plot Status Breakdown"}
                </h3>
              </div>
              <CardContent className="px-4 pb-4">
                {/* Summary line */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-card-foreground">{fmt(stats.totalPlots)}</span>
                  <span className="text-sm text-muted-foreground">
                    {lang === "ar" ? "إجمالي القطع" : "total plots"}
                  </span>
                </div>

                {/* Status bars */}
                <div className="space-y-4">
                  {stats.plotsByStatus.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {lang === "ar" ? "لا توجد بيانات قطع" : "No plot data available"}
                    </p>
                  ) : (
                    stats.plotsByStatus.map((s: any) => {
                      const pct = stats.totalPlots > 0 ? (s.count / stats.totalPlots) * 100 : 0;
                      const color = PLOT_STATUS_COLORS[s.status] ?? "#94a3b8";
                      return (
                        <div key={s.status} className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="flex-1 text-sm text-card-foreground">
                            {STATUS_LABELS[s.status]?.[lang] ?? s.status}
                          </span>
                          <span className="font-mono font-bold text-sm text-card-foreground tabular-nums">
                            {s.count}
                          </span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Area breakdown if available */}
                {stats.plotsByStatus.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      {lang === "ar" ? "المساحة حسب الحالة" : "Area by Status"}
                    </p>
                    <div className="space-y-2">
                      {stats.plotsByStatus.map((s: any) => {
                        const color = PLOT_STATUS_COLORS[s.status] ?? "#94a3b8";
                        return (
                          <div key={`area-${s.status}`} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                              {STATUS_LABELS[s.status]?.[lang] ?? s.status}
                            </span>
                            <span className="font-mono text-card-foreground">
                              {s.area ? formatArea(Number(s.area), lang) : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد بيانات" : "No Data"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "لا تتوفر بيانات GIS لهذا المشروع" : "No GIS data available for this project"}
          </p>
        </Card>
      )}
    </div>
  );
}
