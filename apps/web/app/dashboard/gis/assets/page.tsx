"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Loader2, MapPin, ChevronDown, Plus, Boxes, Activity, ShieldAlert, Download, Layers,
} from "lucide-react";
import {
  Button, Card, CardContent, PageIntro, Badge, KPICard,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui";
import {
  getOperationalAssets, createOperationalAsset, updateAssetStatus, getAssetStats,
} from "../../../actions/gis-assets";
import { getProjectsForGisMap } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapPopup from "../../../../components/map/MapPopup";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, featureCollectionFromEntities, emptyFeatureCollection } from "../../../../lib/map-utils";

// ─── Config ─────────────────────────────────────────────────
const assetClasses: Record<string, { ar: string; en: string; color: string }> = {
  ROAD: { ar: "طريق", en: "Road", color: "#94a3b8" },
  STREETLIGHT: { ar: "إنارة", en: "Streetlight", color: "#f59e0b" },
  TREE: { ar: "شجرة", en: "Tree", color: "#22c55e" },
  VALVE: { ar: "صمام", en: "Valve", color: "#3b82f6" },
  PUMP: { ar: "مضخة", en: "Pump", color: "#6366f1" },
  SUBSTATION: { ar: "محطة فرعية", en: "Substation", color: "#f97316" },
  PLAYGROUND: { ar: "ملعب", en: "Playground", color: "#84cc16" },
  BENCH: { ar: "مقعد", en: "Bench", color: "#8b5cf6" },
  SIGN: { ar: "لوحة", en: "Sign", color: "#06b6d4" },
  BUILDING_ASSET: { ar: "أصل مبنى", en: "Building Asset", color: "#ec4899" },
};

const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
  ACTIVE: { ar: "نشط", en: "Active", color: "#22c55e" },
  INACTIVE: { ar: "غير نشط", en: "Inactive", color: "#94a3b8" },
  UNDER_REPAIR: { ar: "تحت الصيانة", en: "Under Repair", color: "#f59e0b" },
  DECOMMISSIONED: { ar: "خارج الخدمة", en: "Decommissioned", color: "#ef4444" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA").format(n);

// ─── Page Component ─────────────────────────────────────────
export default function OperationalAssetsPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);

  const [assets, setAssets] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [popupProps, setPopupProps] = React.useState<Record<string, unknown> | null>(null);

  // Filters
  const [filterClass, setFilterClass] = React.useState<string>("ALL");
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");
  const [filterZone, setFilterZone] = React.useState<string>("ALL");

  // Add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    assetClass: "ROAD", assetName: "", assetNameArabic: "",
    installationDate: "", warrantyEndDate: "", maintenanceZone: "", operationalOwner: "",
  });

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
        // empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Load Data ────────────────────────────────────────────
  const loadData = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setDataLoading(true);
    try {
      const filters: any = {};
      if (filterClass !== "ALL") filters.assetClass = filterClass;
      if (filterStatus !== "ALL") filters.operationalStatus = filterStatus;
      if (filterZone !== "ALL") filters.maintenanceZone = filterZone;

      const [a, s] = await Promise.all([
        getOperationalAssets(selectedProjectId, Object.keys(filters).length > 0 ? filters : undefined),
        getAssetStats(selectedProjectId),
      ]);
      setAssets(a);
      setStats(s);
      setPopupProps(null);
    } catch {
      setAssets([]);
      setStats(null);
    } finally {
      setDataLoading(false);
    }
  }, [selectedProjectId, filterClass, filterStatus, filterZone]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ─── Unique maintenance zones ─────────────────────────────
  const maintenanceZones = React.useMemo(() => {
    const zones = new Set<string>();
    assets.forEach((a: any) => { if (a.maintenanceZone) zones.add(a.maintenanceZone); });
    return Array.from(zones).sort();
  }, [assets]);

  // ─── Map Data ─────────────────────────────────────────────
  const assetsWithGeo = React.useMemo(() => {
    return assets
      .filter((a: any) => a.geometry)
      .map((a: any) => ({
        id: a.id,
        geometry: typeof a.geometry === "string" ? JSON.parse(a.geometry) : a.geometry,
        name: lang === "ar" && a.assetNameArabic ? a.assetNameArabic : a.assetName,
        assetCode: a.assetCode,
        assetClass: a.assetClass,
        operationalStatus: a.operationalStatus,
        installationDate: a.installationDate ? new Date(a.installationDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "",
        warrantyActive: a.warrantyEndDate ? new Date(a.warrantyEndDate) > new Date() : false,
        maintenanceZone: a.maintenanceZone || "",
      }));
  }, [assets, lang]);

  const featureCollection = React.useMemo(
    () => assetsWithGeo.length > 0 ? featureCollectionFromEntities(assetsWithGeo) : emptyFeatureCollection(),
    [assetsWithGeo],
  );

  const sources = React.useMemo(() => [
    { id: "assets-source", type: "geojson" as const, data: featureCollection },
  ], [featureCollection]);

  const layers = React.useMemo(() => {
    const colorMatch: any[] = ["match", ["get", "assetClass"]];
    Object.entries(assetClasses).forEach(([key, val]) => {
      colorMatch.push(key, val.color);
    });
    colorMatch.push("#94a3b8"); // fallback

    return [
      {
        id: "assets-circles",
        sourceId: "assets-source",
        type: "circle" as const,
        paint: {
          "circle-color": colorMatch,
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.85,
        },
      },
    ];
  }, []);

  const mapCenter = React.useMemo<[number, number]>(() => {
    const proj = projects.find((p: any) => p.id === selectedProjectId);
    if (proj?.longitude && proj?.latitude) return [Number(proj.longitude), Number(proj.latitude)];
    return RIYADH_CENTER;
  }, [projects, selectedProjectId]);

  const legendItems = React.useMemo(() =>
    Object.entries(assetClasses).map(([, val]) => ({
      label: val.en, labelAr: val.ar, color: val.color, type: "circle" as const,
    })),
    [],
  );

  const handleFeatureClick = React.useCallback((feature: { properties: Record<string, unknown> }) => {
    setPopupProps(feature.properties);
  }, []);

  // ─── Add Asset ────────────────────────────────────────────
  async function handleAddAsset() {
    if (!selectedProjectId || !addForm.assetName) return;
    setSaving(true);
    try {
      await createOperationalAsset({
        projectId: selectedProjectId,
        assetClass: addForm.assetClass,
        assetName: addForm.assetName,
        assetNameArabic: addForm.assetNameArabic || undefined,
        installationDate: addForm.installationDate || undefined,
        warrantyEndDate: addForm.warrantyEndDate || undefined,
        maintenanceZone: addForm.maintenanceZone || undefined,
        operationalOwner: addForm.operationalOwner || undefined,
      });
      setAddOpen(false);
      setAddForm({ assetClass: "ROAD", assetName: "", assetNameArabic: "", installationDate: "", warrantyEndDate: "", maintenanceZone: "", operationalOwner: "" });
      await loadData();
    } catch {
      // error handled
    } finally {
      setSaving(false);
    }
  }

  // ─── Update Status ────────────────────────────────────────
  async function handleStatusChange(assetId: string, status: string) {
    try {
      await updateAssetStatus(assetId, status);
      await loadData();
    } catch {
      // error handled
    }
  }

  // ─── Export CSV ───────────────────────────────────────────
  function handleExport() {
    if (assets.length === 0) return;
    const headers = ["Code", "Name", "Class", "Status", "Installation Date", "Warranty End", "Zone", "Owner"];
    const rows = assets.map((a: any) => [
      a.assetCode,
      a.assetName,
      a.assetClass,
      a.operationalStatus,
      a.installationDate ? new Date(a.installationDate).toISOString().split("T")[0] : "",
      a.warrantyEndDate ? new Date(a.warrantyEndDate).toISOString().split("T")[0] : "",
      a.maintenanceZone || "",
      a.operationalOwner || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assets-${selectedProjectId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── Warranty check helper ────────────────────────────────
  function isWarrantyExpired(warrantyEndDate: string | null | undefined): boolean {
    if (!warrantyEndDate) return false;
    return new Date(warrantyEndDate) < new Date();
  }

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
          title={lang === "ar" ? "سجل الأصول التشغيلية" : "Operational Asset Registry"}
          description={lang === "ar" ? "إدارة وتتبع الأصول التشغيلية" : "Manage and track operational assets"}
        />
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "قم بإنشاء مشروع أولاً لإدارة الأصول" : "Create a project first to manage assets"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "سجل الأصول التشغيلية" : "Operational Asset Registry"}
        description={lang === "ar" ? "إدارة وتتبع الأصول التشغيلية على الخريطة" : "Manage and track operational assets on the map"}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={assets.length === 0}
          style={{ display: "inline-flex" }}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          {lang === "ar" ? "تصدير" : "Export"}
        </Button>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          style={{ display: "inline-flex" }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {lang === "ar" ? "إضافة أصل" : "Add Asset"}
        </Button>
      </div>

      {/* KPI Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            compact
            label={lang === "ar" ? "إجمالي الأصول" : "Total Assets"}
            value={fmt(stats.total)}
            icon={<Boxes className="h-4 w-4" />}
            accentColor="primary"
          />
          <KPICard
            compact
            label={lang === "ar" ? "نشط" : "Active"}
            value={fmt(stats.active)}
            icon={<Activity className="h-4 w-4" />}
            accentColor="success"
          />
          <KPICard
            compact
            label={lang === "ar" ? "ضمان منتهي" : "Warranty Expired"}
            value={fmt(stats.warrantyExpired)}
            icon={<ShieldAlert className="h-4 w-4" />}
            accentColor="destructive"
          />
          <KPICard
            compact
            label={lang === "ar" ? "فئات الأصول" : "Asset Classes"}
            value={fmt(stats.byClass?.length ?? 0)}
            icon={<Layers className="h-4 w-4" />}
            accentColor="info"
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder={lang === "ar" ? "فئة الأصل" : "Asset Class"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{lang === "ar" ? "كل الفئات" : "All Classes"}</SelectItem>
            {Object.entries(assetClasses).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: val.color }} />
                  {val[lang]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder={lang === "ar" ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{lang === "ar" ? "كل الحالات" : "All Statuses"}</SelectItem>
            {Object.entries(statusConfig).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {maintenanceZones.length > 0 && (
          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder={lang === "ar" ? "منطقة الصيانة" : "Maintenance Zone"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{lang === "ar" ? "كل المناطق" : "All Zones"}</SelectItem>
              {maintenanceZones.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-lg border border-border overflow-hidden" style={{ height: 400 }}>
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
          {popupProps && (
            <MapPopup
              properties={popupProps}
              entityType="asset"
              onClose={() => setPopupProps(null)}
            />
          )}
          <MapLegend items={legendItems} />
        </MapView>
      </div>

      {/* Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الكود" : "Code"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الاسم" : "Name"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الفئة" : "Class"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "تاريخ التركيب" : "Installation"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الضمان" : "Warranty"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "المنطقة" : "Zone"}
                </th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الإجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && !dataLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                    {lang === "ar" ? "لا توجد أصول" : "No assets found"}
                  </td>
                </tr>
              )}
              {assets.map((a: any) => {
                const cls = assetClasses[a.assetClass];
                const st = statusConfig[a.operationalStatus] ?? { ar: "غير محدد", en: "Unknown", color: "#94a3b8" };
                const warrantyExpired = isWarrantyExpired(a.warrantyEndDate);
                return (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                      {a.assetCode}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                      {lang === "ar" && a.assetNameArabic ? a.assetNameArabic : a.assetName}
                    </td>
                    <td className="px-4 py-2.5">
                      {cls && (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cls.color }} />
                          {cls[lang]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${st.color}20`, color: st.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                        {st[lang]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {a.installationDate
                        ? new Date(a.installationDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {a.warrantyEndDate ? (
                        <Badge
                          variant={warrantyExpired ? "error" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                          style={!warrantyExpired ? { borderColor: "#22c55e", color: "#22c55e" } : undefined}
                        >
                          {warrantyExpired
                            ? (lang === "ar" ? "منتهي" : "Expired")
                            : (lang === "ar" ? "ساري" : "Active")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {a.maintenanceZone || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Select
                        value={a.operationalStatus}
                        onValueChange={(v) => handleStatusChange(a.id, v)}
                      >
                        <SelectTrigger className="h-7 w-32 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Add Asset Dialog ────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة أصل تشغيلي" : "Add Operational Asset"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "فئة الأصل" : "Asset Class"}
              </label>
              <Select value={addForm.assetClass} onValueChange={(v) => setAddForm(f => ({ ...f, assetClass: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(assetClasses).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: val.color }} />
                        {val[lang]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
              </label>
              <Input
                value={addForm.assetName}
                onChange={(e) => setAddForm(f => ({ ...f, assetName: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الأصل بالإنجليزي" : "Asset name"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </label>
              <Input
                value={addForm.assetNameArabic}
                onChange={(e) => setAddForm(f => ({ ...f, assetNameArabic: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الأصل بالعربي" : "Asset name in Arabic"}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {lang === "ar" ? "تاريخ التركيب" : "Installation Date"}
                </label>
                <Input
                  type="date"
                  value={addForm.installationDate}
                  onChange={(e) => setAddForm(f => ({ ...f, installationDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {lang === "ar" ? "انتهاء الضمان" : "Warranty End"}
                </label>
                <Input
                  type="date"
                  value={addForm.warrantyEndDate}
                  onChange={(e) => setAddForm(f => ({ ...f, warrantyEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "منطقة الصيانة" : "Maintenance Zone"}
              </label>
              <Input
                value={addForm.maintenanceZone}
                onChange={(e) => setAddForm(f => ({ ...f, maintenanceZone: e.target.value }))}
                placeholder={lang === "ar" ? "مثال: المنطقة أ" : "e.g. Zone A"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الجهة المشغلة" : "Operational Owner"}
              </label>
              <Input
                value={addForm.operationalOwner}
                onChange={(e) => setAddForm(f => ({ ...f, operationalOwner: e.target.value }))}
                placeholder={lang === "ar" ? "الجهة المسؤولة عن التشغيل" : "Entity responsible for operations"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddAsset}
              disabled={saving || !addForm.assetName}
              style={{ display: "inline-flex" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
              {lang === "ar" ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
