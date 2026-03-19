"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Map, Layers, Loader2, FolderOpen, ChevronDown } from "lucide-react";
import { Button, PageIntro, Badge } from "@repo/ui";
import MapView from "../../../components/map/MapView";
import MapLayerPanel from "../../../components/map/MapLayerPanel";
import MapPopup from "../../../components/map/MapPopup";
import MapLegend from "../../../components/map/MapLegend";
import { getProjectsForGisMap, getProjectGeoData } from "../../actions/gis";
import {
  RIYADH_CENTER,
  DEFAULT_ZOOM,
  featureCollectionFromEntities,
  emptyFeatureCollection,
} from "../../../lib/map-utils";
import {
  PLOT_STATUS_COLORS,
  ROAD_STYLES,
  UTILITY_COLORS,
  getLegendItems,
} from "../../../lib/map-styles";

// ─── Types ─────────────────────────────────────────────────
type GisProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  boundaries: unknown;
  totalAreaSqm: number | null;
  region: string | null;
  city: string | null;
  district: string | null;
  landUse: string | null;
  estimatedValueSar: number | null;
  _count: { buildings: number };
};

type GeoData = {
  project: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    boundaries: unknown;
    totalAreaSqm: number | null;
    region: string | null;
    city: string | null;
    district: string | null;
  };
  plots: Array<{
    id: string;
    plotNumber: string | null;
    areaSqm: number | null;
    landUse: string | null;
    phase: string | null;
    status: string;
    productType: string | null;
    boundaryGeoJson: unknown;
    dimensions: unknown;
  }>;
  blocks: Array<{
    id: string;
    blockNumber: string | null;
    areaSqm: number | null;
    landUse: string | null;
    numberOfPlots: number | null;
    boundaryGeoJson: unknown;
  }>;
  roads: Array<{
    id: string;
    name: string | null;
    type: string;
    widthMeters: number | null;
    lengthMeters: number | null;
    areaSqm: number | null;
    lineGeoJson: unknown;
  }>;
  utilities: Array<{
    id: string;
    name: string | null;
    utilityType: string;
    widthMeters: number | null;
    lengthMeters: number | null;
    lineGeoJson: unknown;
  }>;
  buildings: Array<{
    id: string;
    name: string | null;
    buildingType: string | null;
    numberOfFloors: number | null;
    buildingAreaSqm: number | null;
    occupancyStatus: string | null;
    towerName: string | null;
    blockCode: string | null;
  }>;
};

type LayerVisibility = {
  plots: boolean;
  blocks: boolean;
  roads: boolean;
  utilities: boolean;
  boundary: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────

function detectEntityType(
  layerId: string,
): "plot" | "road" | "utility" | "building" | undefined {
  if (layerId.startsWith("plots")) return "plot";
  if (layerId.startsWith("roads")) return "road";
  if (layerId.startsWith("utilities")) return "utility";
  return undefined;
}

// ─── Component ────────────────────────────────────────────────
export default function GisPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  // ── Data state ──
  const [projects, setProjects] = React.useState<GisProject[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [geoData, setGeoData] = React.useState<GeoData | null>(null);
  const [loadingGeo, setLoadingGeo] = React.useState(false);

  // ── UI state ──
  const [showLayerPanel, setShowLayerPanel] = React.useState(true);
  const [layerVisibility, setLayerVisibility] = React.useState<LayerVisibility>({
    plots: true,
    blocks: true,
    roads: true,
    utilities: true,
    boundary: true,
  });
  const [selectedFeature, setSelectedFeature] = React.useState<{
    properties: Record<string, unknown>;
    entityType?: "plot" | "road" | "utility" | "building";
  } | null>(null);

  // ── Map center ──
  const [mapCenter, setMapCenter] = React.useState<[number, number]>(RIYADH_CENTER);
  const [mapZoom, setMapZoom] = React.useState(DEFAULT_ZOOM);

  // ── Load projects on mount ──
  React.useEffect(() => {
    let cancelled = false;
    getProjectsForGisMap()
      .then((data) => {
        if (!cancelled) setProjects(data as GisProject[]);
      })
      .catch(() => {
        // Error loading projects — empty state will show
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-select project from URL query param ──
  React.useEffect(() => {
    if (initialProjectId && projects.length > 0 && !selectedProjectId) {
      const match = projects.find((p) => p.id === initialProjectId);
      if (match) setSelectedProjectId(match.id);
    }
  }, [initialProjectId, projects, selectedProjectId]);

  // ── Load geo data when project changes ──
  React.useEffect(() => {
    if (!selectedProjectId) {
      setGeoData(null);
      return;
    }

    let cancelled = false;
    setLoadingGeo(true);
    setSelectedFeature(null);

    getProjectGeoData(selectedProjectId)
      .then((data) => {
        if (cancelled) return;
        const d = data as GeoData;
        setGeoData(d);

        // Center on project
        if (d.project.latitude && d.project.longitude) {
          setMapCenter([d.project.longitude, d.project.latitude]);
          setMapZoom(15);
        }
      })
      .catch(() => {
        if (!cancelled) setGeoData(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingGeo(false);
      });

    return () => { cancelled = true; };
  }, [selectedProjectId]);

  // ─── Build sources & layers ───────────────────────────────
  const { sources, layers } = React.useMemo(() => {
    if (!geoData) return { sources: [], layers: [] };

    const srcList: Array<{ id: string; type: "geojson"; data: GeoJSON.FeatureCollection }> = [];
    const lyrList: Array<{
      id: string;
      sourceId: string;
      type: "fill" | "line" | "circle" | "symbol";
      paint: Record<string, unknown>;
      layout?: Record<string, unknown>;
    }> = [];

    // ── Project boundary ──
    if (geoData.project.boundaries && layerVisibility.boundary) {
      let boundaryGeometry: unknown = geoData.project.boundaries;
      if (typeof boundaryGeometry === "string") {
        try { boundaryGeometry = JSON.parse(boundaryGeometry); } catch { boundaryGeometry = null; }
      }
      if (boundaryGeometry && typeof boundaryGeometry === "object") {
        const boundaryGeoJson = (boundaryGeometry as Record<string, unknown>).type === "FeatureCollection"
          ? boundaryGeometry
          : (boundaryGeometry as Record<string, unknown>).type === "Feature"
            ? { type: "FeatureCollection", features: [boundaryGeometry] }
            : { type: "FeatureCollection", features: [{ type: "Feature", geometry: boundaryGeometry, properties: {} }] };

        srcList.push({
          id: "project-boundary",
          type: "geojson",
          data: boundaryGeoJson as GeoJSON.FeatureCollection,
        });
        lyrList.push({
          id: "project-boundary-outline",
          sourceId: "project-boundary",
          type: "line",
          paint: {
            "line-color": "#7c3aed",
            "line-width": 3,
            "line-dasharray": [4, 3],
            "line-opacity": 0.8,
          },
        });
      }
    }

    // ── Plots ──
    if (layerVisibility.plots) {
      const plotEntities = geoData.plots
        .filter((p) => p.boundaryGeoJson != null)
        .map((p) => ({
          id: p.id,
          geometry: p.boundaryGeoJson,
          plotNumber: p.plotNumber,
          areaSqm: p.areaSqm,
          status: p.status,
          landUse: p.landUse,
          productType: p.productType,
        }));

      const plotFc = plotEntities.length > 0
        ? featureCollectionFromEntities(plotEntities)
        : emptyFeatureCollection();

      srcList.push({ id: "plots", type: "geojson", data: plotFc });

      lyrList.push({
        id: "plots-fill",
        sourceId: "plots",
        type: "fill",
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "AVAILABLE_FOR_SALE", PLOT_STATUS_COLORS.AVAILABLE_FOR_SALE,
            "RESERVED", PLOT_STATUS_COLORS.RESERVED,
            "SOLD", PLOT_STATUS_COLORS.SOLD,
            "HELD", PLOT_STATUS_COLORS.HELD,
            "PLANNED", PLOT_STATUS_COLORS.PLANNED,
            "APPROVED", PLOT_STATUS_COLORS.APPROVED,
            "#94a3b8",
          ],
          "fill-opacity": 0.5,
        },
      });

      lyrList.push({
        id: "plots-outline",
        sourceId: "plots",
        type: "line",
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "AVAILABLE_FOR_SALE", PLOT_STATUS_COLORS.AVAILABLE_FOR_SALE,
            "RESERVED", PLOT_STATUS_COLORS.RESERVED,
            "SOLD", PLOT_STATUS_COLORS.SOLD,
            "HELD", PLOT_STATUS_COLORS.HELD,
            "PLANNED", PLOT_STATUS_COLORS.PLANNED,
            "APPROVED", PLOT_STATUS_COLORS.APPROVED,
            "#94a3b8",
          ],
          "line-width": 1.5,
          "line-opacity": 0.9,
        },
      });
    }

    // ── Blocks ──
    if (layerVisibility.blocks) {
      const blockEntities = geoData.blocks
        .filter((b) => b.boundaryGeoJson != null)
        .map((b) => ({
          id: b.id,
          geometry: b.boundaryGeoJson,
          blockNumber: b.blockNumber,
          areaSqm: b.areaSqm,
          landUse: b.landUse,
          numberOfPlots: b.numberOfPlots,
        }));

      const blockFc = blockEntities.length > 0
        ? featureCollectionFromEntities(blockEntities)
        : emptyFeatureCollection();

      srcList.push({ id: "blocks", type: "geojson", data: blockFc });

      lyrList.push({
        id: "blocks-outline",
        sourceId: "blocks",
        type: "line",
        paint: {
          "line-color": "#475569",
          "line-width": 1.5,
          "line-dasharray": [6, 3],
          "line-opacity": 0.7,
        },
      });
    }

    // ── Roads ──
    if (layerVisibility.roads) {
      const roadEntities = geoData.roads
        .filter((r) => r.lineGeoJson != null)
        .map((r) => ({
          id: r.id,
          geometry: r.lineGeoJson,
          name: r.name,
          type: r.type,
          widthMeters: r.widthMeters,
          lengthMeters: r.lengthMeters,
        }));

      const roadFc = roadEntities.length > 0
        ? featureCollectionFromEntities(roadEntities)
        : emptyFeatureCollection();

      srcList.push({ id: "roads", type: "geojson", data: roadFc });

      lyrList.push({
        id: "roads-line",
        sourceId: "roads",
        type: "line",
        paint: {
          "line-color": [
            "match",
            ["get", "type"],
            "PRIMARY", ROAD_STYLES.PRIMARY!.color,
            "SECONDARY", ROAD_STYLES.SECONDARY!.color,
            "LOCAL", ROAD_STYLES.LOCAL!.color,
            "SERVICE", ROAD_STYLES.SERVICE!.color,
            "CUL_DE_SAC", ROAD_STYLES.CUL_DE_SAC!.color,
            "#94a3b8",
          ],
          "line-width": [
            "match",
            ["get", "type"],
            "PRIMARY", ROAD_STYLES.PRIMARY!.width,
            "SECONDARY", ROAD_STYLES.SECONDARY!.width,
            "LOCAL", ROAD_STYLES.LOCAL!.width,
            "SERVICE", ROAD_STYLES.SERVICE!.width,
            "CUL_DE_SAC", ROAD_STYLES.CUL_DE_SAC!.width,
            1,
          ],
          "line-opacity": 0.85,
        },
      });
    }

    // ── Utilities ──
    if (layerVisibility.utilities) {
      const utilEntities = geoData.utilities
        .filter((u) => u.lineGeoJson != null)
        .map((u) => ({
          id: u.id,
          geometry: u.lineGeoJson,
          name: u.name,
          type: u.utilityType,
          widthMeters: u.widthMeters,
          lengthMeters: u.lengthMeters,
        }));

      const utilFc = utilEntities.length > 0
        ? featureCollectionFromEntities(utilEntities)
        : emptyFeatureCollection();

      srcList.push({ id: "utilities", type: "geojson", data: utilFc });

      lyrList.push({
        id: "utilities-line",
        sourceId: "utilities",
        type: "line",
        paint: {
          "line-color": [
            "match",
            ["get", "type"],
            "WATER", UTILITY_COLORS.WATER,
            "SEWAGE", UTILITY_COLORS.SEWAGE,
            "ELECTRICITY", UTILITY_COLORS.ELECTRICITY,
            "TELECOM", UTILITY_COLORS.TELECOM,
            "GAS", UTILITY_COLORS.GAS,
            "STORMWATER", UTILITY_COLORS.STORMWATER,
            "#94a3b8",
          ],
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });
    }

    return { sources: srcList, layers: lyrList };
  }, [geoData, layerVisibility]);

  // ─── Legend items ──────────────────────────────────────────
  const legendItems = React.useMemo(() => {
    if (!geoData) return [];

    const items: Array<{ label: string; labelAr?: string; color: string; type: "fill" | "line" | "circle" }> = [];

    if (layerVisibility.plots && geoData.plots.length > 0) {
      const plotLegend = getLegendItems("plot");
      for (const item of plotLegend) {
        items.push({ label: item.label, labelAr: item.labelAr, color: item.color, type: "fill" });
      }
    }

    if (layerVisibility.roads && geoData.roads.length > 0) {
      const roadLegend = getLegendItems("road");
      for (const item of roadLegend) {
        items.push({ label: item.label, labelAr: item.labelAr, color: item.color, type: "line" });
      }
    }

    if (layerVisibility.utilities && geoData.utilities.length > 0) {
      const utilLegend = getLegendItems("utility");
      for (const item of utilLegend) {
        items.push({ label: item.label, labelAr: item.labelAr, color: item.color, type: "line" });
      }
    }

    return items;
  }, [geoData, layerVisibility]);

  // ─── Layer panel info ─────────────────────────────────────
  const layerPanelItems = React.useMemo(() => {
    if (!geoData) return [];

    const items: Array<{
      id: string;
      name: string;
      nameArabic?: string;
      type: string;
      featureCount: number;
      visible: boolean;
      color: string;
    }> = [];

    items.push({
      id: "boundary",
      name: "Project Boundary",
      nameArabic: "حدود المشروع",
      type: "boundary",
      featureCount: geoData.project.boundaries ? 1 : 0,
      visible: layerVisibility.boundary,
      color: "#7c3aed",
    });

    items.push({
      id: "plots",
      name: "Plots",
      nameArabic: "الأراضي",
      type: "plot",
      featureCount: geoData.plots.filter((p) => p.boundaryGeoJson != null).length,
      visible: layerVisibility.plots,
      color: "#22c55e",
    });

    items.push({
      id: "blocks",
      name: "Blocks",
      nameArabic: "البلوكات",
      type: "plot",
      featureCount: geoData.blocks.filter((b) => b.boundaryGeoJson != null).length,
      visible: layerVisibility.blocks,
      color: "#475569",
    });

    items.push({
      id: "roads",
      name: "Roads",
      nameArabic: "الطرق",
      type: "road",
      featureCount: geoData.roads.filter((r) => r.lineGeoJson != null).length,
      visible: layerVisibility.roads,
      color: "#64748b",
    });

    items.push({
      id: "utilities",
      name: "Utilities",
      nameArabic: "المرافق",
      type: "utility",
      featureCount: geoData.utilities.filter((u) => u.lineGeoJson != null).length,
      visible: layerVisibility.utilities,
      color: "#3b82f6",
    });

    return items;
  }, [geoData, layerVisibility]);

  // ─── Handlers ─────────────────────────────────────────────
  function handleToggleLayerVisibility(layerId: string) {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId as keyof LayerVisibility],
    }));
  }

  function handleFeatureClick(feature: {
    id: string;
    properties: Record<string, unknown>;
    geometry: unknown;
  }) {
    // Find which layer was clicked based on properties
    const props = feature.properties;
    let entityType: "plot" | "road" | "utility" | "building" | undefined;
    if (props.plotNumber !== undefined || props.status !== undefined) {
      entityType = "plot";
    } else if (props.widthMeters !== undefined && props.type !== undefined) {
      entityType = "road";
    } else if (props.utilityType !== undefined || (props.type !== undefined && !props.widthMeters)) {
      entityType = "utility";
    }

    setSelectedFeature({ properties: props, entityType });
  }

  function handleMapClick() {
    setSelectedFeature(null);
  }

  // ─── Selected project info ────────────────────────────────
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <PageIntro
        title={lang === "ar" ? "نظام المعلومات الجغرافية" : "GIS Hub"}
        description={
          lang === "ar"
            ? "عرض وتحليل البيانات المكانية لجميع مشاريعك العقارية على الخريطة التفاعلية."
            : "Visualize and analyze spatial data for all your real estate projects on the interactive map."
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pe-9 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer min-w-[220px]"
                disabled={loadingProjects}
              >
                <option value="">
                  {loadingProjects
                    ? (lang === "ar" ? "جاري التحميل..." : "Loading...")
                    : (lang === "ar" ? "اختر مشروعاً" : "Select a project")}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.city ? ` — ${p.city}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Layer panel toggle */}
            {geoData && (
              <Button
                variant={showLayerPanel ? "primary" : "outline"}
                size="sm"
                style={{ display: "inline-flex" }}
                onClick={() => setShowLayerPanel((v) => !v)}
              >
                <Layers className="h-4 w-4" />
                {lang === "ar" ? "الطبقات" : "Layers"}
              </Button>
            )}
          </div>
        }
      />

      {/* Selected project badge */}
      {selectedProject && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" className="text-xs">
            {selectedProject.name}
          </Badge>
          {selectedProject.city && (
            <span className="text-xs text-muted-foreground">
              {[selectedProject.district, selectedProject.city, selectedProject.region]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
          {selectedProject.totalAreaSqm && (
            <span className="text-xs text-muted-foreground">
              {Number(selectedProject.totalAreaSqm).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}{" "}
              {lang === "ar" ? "م²" : "sqm"}
            </span>
          )}
          {selectedProject._count.buildings > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedProject._count.buildings} {lang === "ar" ? "مبنى" : "buildings"}
            </span>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/30"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        {/* Loading States */}
        {(loadingProjects || loadingGeo) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">
                {loadingProjects
                  ? (lang === "ar" ? "جاري تحميل المشاريع..." : "Loading projects...")
                  : (lang === "ar" ? "جاري تحميل البيانات المكانية..." : "Loading spatial data...")}
              </span>
            </div>
          </div>
        )}

        {/* Empty state — no project selected */}
        {!loadingProjects && !selectedProjectId && projects.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center max-w-sm pointer-events-auto shadow-lg">
              <Map className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-bold text-foreground">
                {lang === "ar" ? "اختر مشروعاً" : "Select a Project"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "ar"
                  ? "اختر مشروعاً من القائمة أعلاه لعرض بياناته المكانية على الخريطة."
                  : "Choose a project from the dropdown above to view its spatial data on the map."}
              </p>
            </div>
          </div>
        )}

        {/* Empty state — no projects at all */}
        {!loadingProjects && projects.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center max-w-sm pointer-events-auto shadow-lg">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-bold text-foreground">
                {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "ar"
                  ? "أنشئ مشروعاً أولاً من صفحة المشاريع لعرض بياناته الجغرافية."
                  : "Create a project first from the Projects page to view its geographic data."}
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        <MapView
          className="w-full h-full"
          initialCenter={mapCenter}
          initialZoom={mapZoom}
          sources={sources}
          layers={layers}
          onFeatureClick={handleFeatureClick}
          onMapClick={handleMapClick}
          interactive
          showControls
        >
          {/* Layer Panel */}
          {showLayerPanel && geoData && (
            <MapLayerPanel
              layers={layerPanelItems}
              onToggleVisibility={handleToggleLayerVisibility}
              onClose={() => setShowLayerPanel(false)}
            />
          )}

          {/* Feature Popup */}
          {selectedFeature && (
            <MapPopup
              properties={selectedFeature.properties}
              onClose={() => setSelectedFeature(null)}
              entityType={selectedFeature.entityType}
            />
          )}

          {/* Legend */}
          {geoData && legendItems.length > 0 && (
            <MapLegend items={legendItems} />
          )}
        </MapView>
      </div>
    </div>
  );
}
