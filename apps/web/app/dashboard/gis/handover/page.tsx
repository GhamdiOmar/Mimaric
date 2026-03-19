"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Loader2, MapPin, ChevronDown, Plus, ClipboardCheck, AlertTriangle, ShieldCheck, Eye, CheckCircle2,
} from "lucide-react";
import {
  Button, Card, CardContent, PageIntro, Badge, KPICard,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui";
import {
  getHandoverRecords, createHandoverRecord, updateHandoverStatus,
  createHandoverDefect, updateDefectStatus, getHandoverStats,
} from "../../../actions/gis-handover";
import { getProjectsForGisMap } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapPopup from "../../../../components/map/MapPopup";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, featureCollectionFromEntities, emptyFeatureCollection } from "../../../../lib/map-utils";

// ─── Config ─────────────────────────────────────────────────
const handoverStatusConfig: Record<string, { ar: string; en: string; color: string }> = {
  PENDING: { ar: "معلق", en: "Pending", color: "#94a3b8" },
  READY: { ar: "جاهز", en: "Ready", color: "#22c55e" },
  HANDED_OVER: { ar: "تم التسليم", en: "Handed Over", color: "#3b82f6" },
  REJECTED: { ar: "مرفوض", en: "Rejected", color: "#ef4444" },
};

const assetTypes: Record<string, { ar: string; en: string }> = {
  BUILDING: { ar: "مبنى", en: "Building" },
  ROAD: { ar: "طريق", en: "Road" },
  UTILITY: { ar: "بنية تحتية", en: "Utility" },
  PARK: { ar: "حديقة", en: "Park" },
  FACILITY: { ar: "مرفق", en: "Facility" },
};

const severityConfig: Record<string, { ar: string; en: string; color: string }> = {
  CRITICAL: { ar: "حرج", en: "Critical", color: "#ef4444" },
  MAJOR: { ar: "رئيسي", en: "Major", color: "#f97316" },
  MINOR: { ar: "ثانوي", en: "Minor", color: "#f59e0b" },
  COSMETIC: { ar: "تجميلي", en: "Cosmetic", color: "#94a3b8" },
};

const defectStatusConfig: Record<string, { ar: string; en: string; color: string }> = {
  OPEN: { ar: "مفتوح", en: "Open", color: "#ef4444" },
  IN_PROGRESS: { ar: "قيد المعالجة", en: "In Progress", color: "#f59e0b" },
  RESOLVED: { ar: "تم الحل", en: "Resolved", color: "#22c55e" },
  VERIFIED: { ar: "تم التحقق", en: "Verified", color: "#3b82f6" },
  WONT_FIX: { ar: "لن يُعالج", en: "Won't Fix", color: "#94a3b8" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA").format(n);

const FILTER_TABS = ["ALL", "PENDING", "READY", "HANDED_OVER"] as const;

// ─── Page Component ─────────────────────────────────────────
export default function HandoverDefectsPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);

  const [records, setRecords] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [expandedRecord, setExpandedRecord] = React.useState<string | null>(null);
  const [popupProps, setPopupProps] = React.useState<Record<string, unknown> | null>(null);

  // Dialogs
  const [addRecordOpen, setAddRecordOpen] = React.useState(false);
  const [addDefectOpen, setAddDefectOpen] = React.useState(false);
  const [defectParentId, setDefectParentId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Add record form
  const [recordForm, setRecordForm] = React.useState({
    assetType: "BUILDING", assetName: "", assetNameArabic: "",
  });

  // Add defect form
  const [defectForm, setDefectForm] = React.useState({
    title: "", titleArabic: "", description: "", severity: "MINOR",
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
      const [recs, s] = await Promise.all([
        getHandoverRecords(selectedProjectId),
        getHandoverStats(selectedProjectId),
      ]);
      setRecords(recs);
      setStats(s);
      setPopupProps(null);
    } catch {
      setRecords([]);
      setStats(null);
    } finally {
      setDataLoading(false);
    }
  }, [selectedProjectId]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered Records ─────────────────────────────────────
  const filteredRecords = React.useMemo(() => {
    if (statusFilter === "ALL") return records;
    return records.filter((r: any) => r.handoverStatus === statusFilter);
  }, [records, statusFilter]);

  // ─── Map Data ─────────────────────────────────────────────
  const recordsWithGeo = React.useMemo(() => {
    return records
      .filter((r: any) => r.geometry)
      .map((r: any) => ({
        id: r.id,
        geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry,
        name: lang === "ar" && r.assetNameArabic ? r.assetNameArabic : r.assetName,
        assetType: r.assetType,
        handoverStatus: r.handoverStatus,
        inspectionStatus: r.inspectionStatus || "",
        criticalDefects: r.criticalDefectCount ?? 0,
        minorDefects: r.minorDefectCount ?? 0,
      }));
  }, [records, lang]);

  const featureCollection = React.useMemo(
    () => recordsWithGeo.length > 0 ? featureCollectionFromEntities(recordsWithGeo) : emptyFeatureCollection(),
    [recordsWithGeo],
  );

  const sources = React.useMemo(() => [
    { id: "handover-source", type: "geojson" as const, data: featureCollection },
  ], [featureCollection]);

  const layers = React.useMemo(() => [
    {
      id: "handover-fill",
      sourceId: "handover-source",
      type: "fill" as const,
      paint: {
        "fill-color": [
          "match", ["get", "handoverStatus"],
          "PENDING", "#94a3b8",
          "READY", "#22c55e",
          "HANDED_OVER", "#3b82f6",
          "REJECTED", "#ef4444",
          "#94a3b8",
        ],
        "fill-opacity": 0.5,
      },
    },
    {
      id: "handover-stroke",
      sourceId: "handover-source",
      type: "line" as const,
      paint: {
        "line-color": [
          "match", ["get", "handoverStatus"],
          "PENDING", "#64748b",
          "READY", "#16a34a",
          "HANDED_OVER", "#2563eb",
          "REJECTED", "#dc2626",
          "#64748b",
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

  const legendItems = React.useMemo(() =>
    Object.entries(handoverStatusConfig).map(([, val]) => ({
      label: val.en, labelAr: val.ar, color: val.color, type: "fill" as const,
    })),
    [],
  );

  const handleFeatureClick = React.useCallback((feature: { properties: Record<string, unknown> }) => {
    setPopupProps(feature.properties);
  }, []);

  // ─── Add Handover Record ──────────────────────────────────
  async function handleAddRecord() {
    if (!selectedProjectId || !recordForm.assetName) return;
    setSaving(true);
    try {
      await createHandoverRecord({
        projectId: selectedProjectId,
        assetType: recordForm.assetType,
        assetId: `${recordForm.assetType}-${Date.now()}`,
        assetName: recordForm.assetName,
        assetNameArabic: recordForm.assetNameArabic || undefined,
      });
      setAddRecordOpen(false);
      setRecordForm({ assetType: "BUILDING", assetName: "", assetNameArabic: "" });
      await loadData();
    } catch {
      // error handled
    } finally {
      setSaving(false);
    }
  }

  // ─── Add Defect ───────────────────────────────────────────
  function openAddDefect(recordId: string) {
    setDefectParentId(recordId);
    setDefectForm({ title: "", titleArabic: "", description: "", severity: "MINOR" });
    setAddDefectOpen(true);
  }

  async function handleAddDefect() {
    if (!defectParentId || !defectForm.title) return;
    setSaving(true);
    try {
      await createHandoverDefect({
        handoverRecordId: defectParentId,
        title: defectForm.title,
        titleArabic: defectForm.titleArabic || undefined,
        description: defectForm.description || undefined,
        severity: defectForm.severity,
      });
      setAddDefectOpen(false);
      await loadData();
    } catch {
      // error handled
    } finally {
      setSaving(false);
    }
  }

  // ─── Update Defect Status ─────────────────────────────────
  async function handleDefectStatusChange(defectId: string, status: string) {
    try {
      await updateDefectStatus(defectId, status);
      await loadData();
    } catch {
      // error handled
    }
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
          title={lang === "ar" ? "التسليم والعيوب" : "Handover & Defects"}
          description={lang === "ar" ? "إدارة تسليم الأصول وتتبع العيوب" : "Manage asset handover and track defects"}
        />
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "قم بإنشاء مشروع أولاً لإدارة التسليم" : "Create a project first to manage handover"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "التسليم والعيوب" : "Handover & Defects"}
        description={lang === "ar" ? "إدارة تسليم الأصول وتتبع العيوب على الخريطة" : "Manage asset handover and track defects on the map"}
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

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((tab) => {
            const isActive = statusFilter === tab;
            const label = tab === "ALL"
              ? (lang === "ar" ? "الكل" : "All")
              : (handoverStatusConfig[tab]?.[lang] ?? tab);
            const color = tab !== "ALL" ? handoverStatusConfig[tab]?.color : undefined;
            return (
              <Button
                key={tab}
                size="sm"
                variant={isActive ? "primary" : "outline"}
                className="h-7 px-2.5 text-xs gap-1.5"
                style={{
                  display: "inline-flex",
                  ...(isActive && color ? { backgroundColor: color, borderColor: color } : {}),
                }}
                onClick={() => setStatusFilter(tab)}
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

        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => setAddRecordOpen(true)}
          style={{ display: "inline-flex" }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {lang === "ar" ? "سجل تسليم جديد" : "New Handover Record"}
        </Button>
      </div>

      {/* KPI Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            compact
            label={lang === "ar" ? "إجمالي الأصول" : "Total Assets"}
            value={fmt(stats.total)}
            icon={<ClipboardCheck className="h-4 w-4" />}
            accentColor="primary"
          />
          <KPICard
            compact
            label={lang === "ar" ? "نسبة التسليم" : "Handed Over %"}
            value={`${stats.handoverPercentage}%`}
            icon={<ShieldCheck className="h-4 w-4" />}
            accentColor="info"
          />
          <KPICard
            compact
            label={lang === "ar" ? "جاهز" : "Ready"}
            value={fmt(stats.ready)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accentColor="success"
          />
          <KPICard
            compact
            label={lang === "ar" ? "معلق" : "Pending"}
            value={fmt(stats.pending)}
            icon={<Eye className="h-4 w-4" />}
            accentColor="secondary"
          />
          <KPICard
            compact
            label={lang === "ar" ? "عيوب حرجة" : "Critical Defects"}
            value={fmt(stats.totalCriticalDefects)}
            icon={<AlertTriangle className="h-4 w-4" />}
            accentColor="destructive"
          />
          <KPICard
            compact
            label={lang === "ar" ? "عيوب ثانوية" : "Minor Defects"}
            value={fmt(stats.totalMinorDefects)}
            icon={<AlertTriangle className="h-4 w-4" />}
            accentColor="warning"
          />
        </div>
      )}

      {/* Map + Side Panel */}
      <div className="flex gap-4" style={{ height: "calc(100vh - 440px)", minHeight: 400 }}>
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
              {lang === "ar" ? "سجلات التسليم" : "Handover Records"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmt(filteredRecords.length)} {lang === "ar" ? "سجل" : "records"}
            </p>
          </div>
          <div className="p-2 space-y-2">
            {filteredRecords.length === 0 && !dataLoading && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {lang === "ar" ? "لا توجد سجلات تسليم" : "No handover records"}
              </div>
            )}
            {filteredRecords.map((rec: any) => {
              const hStatus = handoverStatusConfig[rec.handoverStatus] ?? { ar: "غير محدد", en: "Unknown", color: "#94a3b8" };
              const aType = assetTypes[rec.assetType];
              const isExpanded = expandedRecord === rec.id;
              const defects = rec.defects || [];

              return (
                <Card key={rec.id} className="p-3 space-y-2">
                  <div
                    className="cursor-pointer"
                    onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {lang === "ar" && rec.assetNameArabic ? rec.assetNameArabic : rec.assetName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {aType && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {aType[lang]}
                            </Badge>
                          )}
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${hStatus.color}20`, color: hStatus.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hStatus.color }} />
                            {hStatus[lang]}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {rec.criticalDefectCount > 0 && (
                          <Badge variant="error" className="text-[10px] px-1.5 py-0">
                            {rec.criticalDefectCount}
                          </Badge>
                        )}
                        {rec.minorDefectCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning">
                            {rec.minorDefectCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded defect list */}
                  {isExpanded && (
                    <div className="border-t border-border pt-2 space-y-1.5">
                      {defects.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          {lang === "ar" ? "لا توجد عيوب" : "No defects"}
                        </p>
                      ) : (
                        defects.map((d: any) => {
                          const sev = severityConfig[d.severity] ?? { ar: "غير محدد", en: "Unknown", color: "#94a3b8" };
                          const dStatus = defectStatusConfig[d.status] ?? { ar: "غير محدد", en: "Unknown", color: "#94a3b8" };
                          return (
                            <div key={d.id} className="flex items-center gap-2 rounded-md bg-muted/40 p-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {lang === "ar" && d.titleArabic ? d.titleArabic : d.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-medium"
                                    style={{ backgroundColor: `${sev.color}20`, color: sev.color }}
                                  >
                                    {sev[lang]}
                                  </span>
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-medium"
                                    style={{ backgroundColor: `${dStatus.color}20`, color: dStatus.color }}
                                  >
                                    {dStatus[lang]}
                                  </span>
                                </div>
                              </div>
                              {d.status === "OPEN" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-[10px]"
                                  style={{ display: "inline-flex" }}
                                  onClick={() => handleDefectStatusChange(d.id, "RESOLVED")}
                                >
                                  {lang === "ar" ? "حل" : "Resolve"}
                                </Button>
                              )}
                              {d.status === "RESOLVED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-[10px]"
                                  style={{ display: "inline-flex" }}
                                  onClick={() => handleDefectStatusChange(d.id, "VERIFIED")}
                                >
                                  {lang === "ar" ? "تحقق" : "Verify"}
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs gap-1"
                        style={{ display: "inline-flex" }}
                        onClick={() => openAddDefect(rec.id)}
                      >
                        <Plus className="h-3 w-3" />
                        {lang === "ar" ? "إضافة عيب" : "Add Defect"}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Add Handover Record Dialog ──────────────────────── */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "سجل تسليم جديد" : "New Handover Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "نوع الأصل" : "Asset Type"}
              </label>
              <Select value={recordForm.assetType} onValueChange={(v) => setRecordForm(f => ({ ...f, assetType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(assetTypes).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "اسم الأصل (إنجليزي)" : "Asset Name (English)"}
              </label>
              <Input
                value={recordForm.assetName}
                onChange={(e) => setRecordForm(f => ({ ...f, assetName: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الأصل بالإنجليزي" : "Asset name"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "اسم الأصل (عربي)" : "Asset Name (Arabic)"}
              </label>
              <Input
                value={recordForm.assetNameArabic}
                onChange={(e) => setRecordForm(f => ({ ...f, assetNameArabic: e.target.value }))}
                placeholder={lang === "ar" ? "اسم الأصل بالعربي" : "Asset name in Arabic"}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRecordOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddRecord}
              disabled={saving || !recordForm.assetName}
              style={{ display: "inline-flex" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
              {lang === "ar" ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Defect Dialog ───────────────────────────────── */}
      <Dialog open={addDefectOpen} onOpenChange={setAddDefectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة عيب" : "Add Defect"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}
              </label>
              <Input
                value={defectForm.title}
                onChange={(e) => setDefectForm(f => ({ ...f, title: e.target.value }))}
                placeholder={lang === "ar" ? "عنوان العيب بالإنجليزي" : "Defect title"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}
              </label>
              <Input
                value={defectForm.titleArabic}
                onChange={(e) => setDefectForm(f => ({ ...f, titleArabic: e.target.value }))}
                placeholder={lang === "ar" ? "عنوان العيب بالعربي" : "Defect title in Arabic"}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الوصف" : "Description"}
              </label>
              <Input
                value={defectForm.description}
                onChange={(e) => setDefectForm(f => ({ ...f, description: e.target.value }))}
                placeholder={lang === "ar" ? "وصف تفصيلي للعيب" : "Detailed description"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "ar" ? "الخطورة" : "Severity"}
              </label>
              <Select value={defectForm.severity} onValueChange={(v) => setDefectForm(f => ({ ...f, severity: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(severityConfig).map(([key, val]) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDefectOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddDefect}
              disabled={saving || !defectForm.title}
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
