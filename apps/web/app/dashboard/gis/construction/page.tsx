"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Loader2, MapPin, ChevronDown, Plus, HardHat, Package, CheckCircle2, Clock, Percent,
} from "lucide-react";
import {
  Button, Card, CardContent, PageIntro, Badge, KPICard,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui";
import {
  getConstructionPackages, createConstructionPackage, updatePackageProgress, getConstructionStats,
} from "../../../actions/gis-construction";
import { getProjectsForGisMap } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapPopup from "../../../../components/map/MapPopup";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, featureCollectionFromEntities, emptyFeatureCollection } from "../../../../lib/map-utils";

// ─── Config ─────────────────────────────────────────────────
const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
  NOT_STARTED: { ar: "لم يبدأ", en: "Not Started", color: "#94a3b8" },
  MOBILIZED: { ar: "تم التحشيد", en: "Mobilized", color: "#3b82f6" },
  IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", color: "#f59e0b" },
  SUBSTANTIALLY_COMPLETE: { ar: "شبه مكتمل", en: "Substantially Complete", color: "#84cc16" },
  COMPLETED: { ar: "مكتمل", en: "Completed", color: "#22c55e" },
};

const packageTypes: Record<string, { ar: string; en: string }> = {
  ROADS: { ar: "طرق", en: "Roads" },
  UTILITIES: { ar: "بنية تحتية", en: "Utilities" },
  BUILDINGS: { ar: "مباني", en: "Buildings" },
  LANDSCAPING: { ar: "تنسيق حدائق", en: "Landscaping" },
  MIXED: { ar: "مختلط", en: "Mixed" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA").format(n);

// ─── Page Component ─────────────────────────────────────────
export default function ConstructionProgressPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);

  const [packages, setPackages] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [popupProps, setPopupProps] = React.useState<Record<string, unknown> | null>(null);

  // Dialogs
  const [addOpen, setAddOpen] = React.useState(false);
  const [updateOpen, setUpdateOpen] = React.useState(false);
  const [selectedPkg, setSelectedPkg] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);

  // Add form
  const [addForm, setAddForm] = React.useState({
    name: "", nameArabic: "", packageType: "ROADS", contractorName: "",
    plannedStart: "", plannedFinish: "",
  });

  // Update form
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [updateStatus, setUpdateStatus] = React.useState("IN_PROGRESS");

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

  // ─── Load Project Data ────────────────────────────────────
  const loadData = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setDataLoading(true);
    try {
      const [pkgs, s] = await Promise.all([
        getConstructionPackages(selectedProjectId),
        getConstructionStats(selectedProjectId),
      ]);
      setPackages(pkgs);
      setStats(s);
      setPopupProps(null);
    } catch {
      setPackages([]);
      setStats(null);
    } finally {
      setDataLoading(false);
    }
  }, [selectedProjectId]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ─── Map Data ─────────────────────────────────────────────
  const packagesWithGeo = React.useMemo(() => {
    return packages
      .filter((p: any) => p.boundaryGeoJson)
      .map((p: any) => ({
        id: p.id,
        geometry: typeof p.boundaryGeoJson === "string" ? JSON.parse(p.boundaryGeoJson) : p.boundaryGeoJson,
        name: lang === "ar" && p.nameArabic ? p.nameArabic : p.name,
        packageType: p.packageType,
        contractorName: p.contractorName || "",
        status: p.status,
        progressPercent: Number(p.progressPercent ?? 0),
        plannedStart: p.plannedStart ? new Date(p.plannedStart).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "",
        plannedFinish: p.plannedFinish ? new Date(p.plannedFinish).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "",
        actualStart: p.actualStart ? new Date(p.actualStart).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "",
        actualFinish: p.actualFinish ? new Date(p.actualFinish).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "",
      }));
  }, [packages, lang]);

  const featureCollection = React.useMemo(
    () => packagesWithGeo.length > 0 ? featureCollectionFromEntities(packagesWithGeo) : emptyFeatureCollection(),
    [packagesWithGeo],
  );

  const sources = React.useMemo(() => [
    { id: "construction-source", type: "geojson" as const, data: featureCollection },
  ], [featureCollection]);

  const layers = React.useMemo(() => [
    {
      id: "construction-fill",
      sourceId: "construction-source",
      type: "fill" as const,
      paint: {
        "fill-color": [
          "interpolate", ["linear"], ["get", "progressPercent"],
          0, "#ef4444", 25, "#f97316", 50, "#f59e0b", 75, "#84cc16", 100, "#22c55e",
        ],
        "fill-opacity": 0.55,
      },
    },
    {
      id: "construction-stroke",
      sourceId: "construction-source",
      type: "line" as const,
      paint: {
        "line-color": [
          "interpolate", ["linear"], ["get", "progressPercent"],
          0, "#dc2626", 25, "#ea580c", 50, "#d97706", 75, "#65a30d", 100, "#16a34a",
        ],
        "line-width": 2,
      },
    },
  ], []);

  const mapCenter = React.useMemo<[number, number]>(() => {
    const proj = projects.find((p: any) => p.id === selectedProjectId);
    if (proj?.longitude && proj?.latitude) return [Number(proj.longitude), Number(proj.latitude)];
    return RIYADH_CENTER;
  }, [projects, selectedProjectId]);

  const legendItems = React.useMemo(() => [
    { label: "0%", labelAr: "٠٪", color: "#ef4444", type: "fill" as const },
    { label: "25%", labelAr: "٢٥٪", color: "#f97316", type: "fill" as const },
    { label: "50%", labelAr: "٥٠٪", color: "#f59e0b", type: "fill" as const },
    { label: "75%", labelAr: "٧٥٪", color: "#84cc16", type: "fill" as const },
    { label: "100%", labelAr: "١٠٠٪", color: "#22c55e", type: "fill" as const },
  ], []);

  const handleFeatureClick = React.useCallback((feature: { properties: Record<string, unknown> }) => {
    setPopupProps(feature.properties);
  }, []);

  // ─── Add Package ──────────────────────────────────────────
  async function handleAddPackage() {
    if (!selectedProjectId || !addForm.name) return;
    setSaving(true);
    try {
      await createConstructionPackage({
        projectId: selectedProjectId,
        name: addForm.name,
        nameArabic: addForm.nameArabic || undefined,
        packageType: addForm.packageType,
        contractorName: addForm.contractorName || undefined,
        plannedStart: addForm.plannedStart || undefined,
        plannedFinish: addForm.plannedFinish || undefined,
      });
      setAddOpen(false);
      setAddForm({ name: "", nameArabic: "", packageType: "ROADS", contractorName: "", plannedStart: "", plannedFinish: "" });
      await loadData();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  }

  // ─── Update Progress ─────────────────────────────────────
  async function handleUpdateProgress() {
    if (!selectedPkg) return;
    setSaving(true);
    try {
      await updatePackageProgress(selectedPkg.id, updateProgress, updateStatus);
      setUpdateOpen(false);
      setSelectedPkg(null);
      await loadData();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  }

  function openUpdateDialog(pkg: any) {
    setSelectedPkg(pkg);
    setUpdateProgress(Number(pkg.progressPercent ?? 0));
    setUpdateStatus(pkg.status || "IN_PROGRESS");
    setUpdateOpen(true);
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
          title={lang === "ar" ? "تقدم التنفيذ" : "Construction Progress"}
          description={lang === "ar" ? "متابعة حزم التنفيذ ونسب الإنجاز" : "Track construction packages and completion rates"}
        />
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "قم بإنشاء مشروع أولاً لمتابعة التنفيذ" : "Create a project first to track construction"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "تقدم التنفيذ" : "Construction Progress"}
        description={lang === "ar" ? "متابعة حزم التنفيذ ونسب الإنجاز على الخريطة" : "Track construction packages and completion rates on the map"}
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
          onClick={() => setAddOpen(true)}
          style={{ display: "inline-flex" }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {lang === "ar" ? "إضافة حزمة" : "Add Package"}
        </Button>
      </div>

      {/* KPI Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            compact
            label={lang === "ar" ? "إجمالي الحزم" : "Total Packages"}
            value={fmt(stats.total)}
            icon={<Package className="h-4 w-4" />}
            accentColor="primary"
          />
          <KPICard
            compact
            label={lang === "ar" ? "متوسط التقدم" : "Avg Progress"}
            value={`${stats.avgProgress}%`}
            icon={<Percent className="h-4 w-4" />}
            accentColor="info"
          />
          <KPICard
            compact
            label={lang === "ar" ? "مكتمل" : "Completed"}
            value={fmt(stats.completed)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accentColor="success"
          />
          <KPICard
            compact
            label={lang === "ar" ? "قيد التنفيذ" : "In Progress"}
            value={fmt(stats.inProgress)}
            icon={<HardHat className="h-4 w-4" />}
            accentColor="warning"
          />
          <KPICard
            compact
            label={lang === "ar" ? "لم يبدأ" : "Not Started"}
            value={fmt(stats.notStarted)}
            icon={<Clock className="h-4 w-4" />}
            accentColor="secondary"
          />
        </div>
      )}

      {/* Map + Side Panel */}
      <div className="flex gap-4" style={{ height: "calc(100vh - 400px)", minHeight: 400 }}>
        {/* Map */}
        <div className="relative flex-1 rounded-lg border border-border overflow-hidden">
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
                onClose={() => setPopupProps(null)}
              />
            )}
            <MapLegend items={legendItems} />
          </MapView>
        </div>

        {/* Side Panel */}
        <div className="w-80 shrink-0 rounded-lg border border-border bg-card overflow-y-auto hidden lg:block">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "ar" ? "حزم التنفيذ" : "Construction Packages"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmt(packages.length)} {lang === "ar" ? "حزمة" : "packages"}
            </p>
          </div>
          <div className="p-2 space-y-2">
            {packages.length === 0 && !dataLoading && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {lang === "ar" ? "لا توجد حزم تنفيذ" : "No construction packages"}
              </div>
            )}
            {packages.map((pkg: any) => {
              const progress = Number(pkg.progressPercent ?? 0);
              const status = statusConfig[pkg.status] ?? { ar: "غير محدد", en: "Unknown", color: "#94a3b8" };
              const pType = packageTypes[pkg.packageType];
              return (
                <Card key={pkg.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lang === "ar" && pkg.nameArabic ? pkg.nameArabic : pkg.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {pType && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {pType[lang]}
                          </Badge>
                        )}
                        {pkg.contractorName && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {pkg.contractorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                        {status[lang]}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-foreground">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: progress < 25 ? "#ef4444" : progress < 50 ? "#f97316" : progress < 75 ? "#f59e0b" : progress < 100 ? "#84cc16" : "#22c55e",
                        }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  {(pkg.plannedStart || pkg.plannedFinish) && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {lang === "ar" ? "مخطط:" : "Planned:"}{" "}
                        {pkg.plannedStart ? new Date(pkg.plannedStart).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "—"}
                      </span>
                      <span>
                        {pkg.plannedFinish ? new Date(pkg.plannedFinish).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA") : "—"}
                      </span>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    style={{ display: "inline-flex" }}
                    onClick={() => openUpdateDialog(pkg)}
                  >
                    {lang === "ar" ? "تحديث التقدم" : "Update Progress"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Add Package Dialog ─────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة حزمة تنفيذ" : "Add Construction Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
              </label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الحزمة بالإنجليزي" : "Package name"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </label>
              <Input
                value={addForm.nameArabic}
                onChange={(e) => setAddForm(f => ({ ...f, nameArabic: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الحزمة بالعربي" : "Package name in Arabic"}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "نوع الحزمة" : "Package Type"}
              </label>
              <Select value={addForm.packageType} onValueChange={(v) => setAddForm(f => ({ ...f, packageType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(packageTypes).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "المقاول" : "Contractor"}
              </label>
              <Input
                value={addForm.contractorName}
                onChange={(e) => setAddForm(f => ({ ...f, contractorName: e.target.value }))}
                placeholder={lang === "ar" ? "اسم المقاول" : "Contractor name"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {lang === "ar" ? "بداية مخططة" : "Planned Start"}
                </label>
                <Input
                  type="date"
                  value={addForm.plannedStart}
                  onChange={(e) => setAddForm(f => ({ ...f, plannedStart: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {lang === "ar" ? "نهاية مخططة" : "Planned Finish"}
                </label>
                <Input
                  type="date"
                  value={addForm.plannedFinish}
                  onChange={(e) => setAddForm(f => ({ ...f, plannedFinish: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddPackage}
              disabled={saving || !addForm.name}
              style={{ display: "inline-flex" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
              {lang === "ar" ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Update Progress Dialog ─────────────────────────── */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "تحديث التقدم" : "Update Progress"}
              {selectedPkg && (
                <span className="block text-xs font-normal text-muted-foreground mt-1">
                  {lang === "ar" && selectedPkg.nameArabic ? selectedPkg.nameArabic : selectedPkg.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "نسبة الإنجاز" : "Progress"}: {updateProgress}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={updateProgress}
                onChange={(e) => setUpdateProgress(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الحالة" : "Status"}
              </label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleUpdateProgress}
              disabled={saving}
              style={{ display: "inline-flex" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
