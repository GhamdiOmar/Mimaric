"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  CheckCircle2,
  Circle,
  FolderOpen,
  Layers,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  PageIntro,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui";
import {
  getProjectPhases,
  upsertPhaseReadinessRule,
  initializePhaseReadinessRules,
} from "../../../actions/gis-phases";
import { getProjectsForGisMap } from "../../../actions/gis";
import MapView from "../../../../components/map/MapView";
import MapLegend from "../../../../components/map/MapLegend";
import { RIYADH_CENTER, emptyFeatureCollection } from "../../../../lib/map-utils";

// ─── Readiness Color Helpers ─────────────────────────────────
function getReadinessColor(score: number): string {
  if (score >= 100) return "#3b82f6"; // blue — Released
  if (score >= 70) return "#22c55e"; // green — Nearly Ready
  if (score >= 30) return "#f59e0b"; // amber — In Progress
  return "#ef4444"; // red — Not Ready
}

function getReadinessLabel(score: number, lang: "ar" | "en"): string {
  if (score >= 100) return lang === "ar" ? "جاهز للإطلاق" : "Released";
  if (score >= 70) return lang === "ar" ? "شبه جاهز" : "Nearly Ready";
  if (score >= 30) return lang === "ar" ? "قيد التنفيذ" : "In Progress";
  return lang === "ar" ? "غير جاهز" : "Not Ready";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

// ─── Page Component ─────────────────────────────────────────
export default function PhasesPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");

  // Projects
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = React.useState(true);

  // Phases
  const [phases, setPhases] = React.useState<any[]>([]);
  const [loadingPhases, setLoadingPhases] = React.useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = React.useState<string | null>(null);

  // Checklist dialog
  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [checklistPhase, setChecklistPhase] = React.useState<any>(null);
  const [togglingRule, setTogglingRule] = React.useState<string | null>(null);

  // ─── Load Projects ────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingProjects(true);
      try {
        const data = await getProjectsForGisMap();
        if (!cancelled) {
          setProjects(data);
          if (data.length > 0) {
            const match = initialProjectId ? data.find((p: any) => p.id === initialProjectId) : null;
            setSelectedProjectId(match ? match.id : data[0].id);
          }
        }
      } catch {
        // empty state
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Load Phases ──────────────────────────────────────────
  React.useEffect(() => {
    if (!selectedProjectId) {
      setPhases([]);
      return;
    }
    let cancelled = false;
    setLoadingPhases(true);
    setSelectedPhaseId(null);
    getProjectPhases(selectedProjectId)
      .then(async (data) => {
        if (cancelled) return;
        // Auto-initialize readiness rules for phases that have none
        for (const phase of data) {
          if (phase.readinessRules.length === 0) {
            try {
              await initializePhaseReadinessRules(phase.id);
            } catch {
              // ignore
            }
          }
        }
        // Re-fetch if any were initialized
        const hasEmpty = data.some((p: any) => p.readinessRules.length === 0);
        if (hasEmpty) {
          const refreshed = await getProjectPhases(selectedProjectId);
          if (!cancelled) setPhases(refreshed);
        } else {
          if (!cancelled) setPhases(data);
        }
      })
      .catch(() => {
        if (!cancelled) setPhases([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPhases(false);
      });
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  // ─── Readiness Calculation ────────────────────────────────
  const phaseStats = React.useMemo(() => {
    return phases.map((phase) => {
      const rules = phase.readinessRules || [];
      const total = rules.length;
      const met = rules.filter((r: any) => r.isMet).length;
      const score = total > 0 ? Math.round((met / total) * 100) : 0;
      return { ...phase, total, met, score };
    });
  }, [phases]);

  // ─── KPIs ─────────────────────────────────────────────────
  const kpis = React.useMemo(() => {
    const totalPhases = phaseStats.length;
    const readyCount = phaseStats.filter((p) => p.score >= 100).length;
    const avgReadiness =
      totalPhases > 0 ? Math.round(phaseStats.reduce((s, p) => s + p.score, 0) / totalPhases) : 0;
    const totalBuildings = phaseStats.reduce((s, p) => s + (p._count?.buildings ?? 0), 0);
    return { totalPhases, readyCount, avgReadiness, totalBuildings };
  }, [phaseStats]);

  // ─── Map: Show project boundary as context ────────────────
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const mapCenter = React.useMemo<[number, number]>(() => {
    if (selectedProject?.latitude && selectedProject?.longitude) {
      return [Number(selectedProject.longitude), Number(selectedProject.latitude)];
    }
    return RIYADH_CENTER;
  }, [selectedProject]);

  const { sources, layers } = React.useMemo(() => {
    if (!selectedProject?.boundaries) {
      return { sources: [], layers: [] };
    }

    let geometry = selectedProject.boundaries;
    if (typeof geometry === "string") {
      try { geometry = JSON.parse(geometry); } catch { return { sources: [], layers: [] }; }
    }
    if (!geometry || typeof geometry !== "object") return { sources: [], layers: [] };

    const geoJson =
      (geometry as any).type === "FeatureCollection"
        ? geometry
        : (geometry as any).type === "Feature"
          ? { type: "FeatureCollection", features: [geometry] }
          : {
              type: "FeatureCollection",
              features: [{ type: "Feature", geometry, properties: {} }],
            };

    return {
      sources: [
        { id: "project-boundary", type: "geojson" as const, data: geoJson as GeoJSON.FeatureCollection },
      ],
      layers: [
        {
          id: "project-boundary-outline",
          sourceId: "project-boundary",
          type: "line" as const,
          paint: {
            "line-color": "#7c3aed",
            "line-width": 3,
            "line-dasharray": [4, 3],
            "line-opacity": 0.8,
          },
        },
        {
          id: "project-boundary-fill",
          sourceId: "project-boundary",
          type: "fill" as const,
          paint: {
            "fill-color": "#7c3aed",
            "fill-opacity": 0.05,
          },
        },
      ],
    };
  }, [selectedProject]);

  // ─── Legend ────────────────────────────────────────────────
  const legendItems = React.useMemo(
    () => [
      { label: "Not Ready (<30%)", labelAr: "غير جاهز (<30%)", color: "#ef4444", type: "fill" as const },
      { label: "In Progress (30-70%)", labelAr: "قيد التنفيذ (30-70%)", color: "#f59e0b", type: "fill" as const },
      { label: "Nearly Ready (70-99%)", labelAr: "شبه جاهز (70-99%)", color: "#22c55e", type: "fill" as const },
      { label: "Released (100%)", labelAr: "جاهز (100%)", color: "#3b82f6", type: "fill" as const },
    ],
    [],
  );

  // ─── Open Checklist Dialog ────────────────────────────────
  function openChecklist(phase: any) {
    setChecklistPhase(phase);
    setChecklistOpen(true);
  }

  // ─── Toggle Rule ──────────────────────────────────────────
  async function handleToggleRule(rule: any) {
    if (togglingRule) return;
    setTogglingRule(rule.id);
    try {
      await upsertPhaseReadinessRule({
        id: rule.id,
        phaseId: rule.phaseId,
        ruleType: rule.ruleType,
        ruleLabel: rule.ruleLabel,
        ruleLabelAr: rule.ruleLabelAr,
        isMet: !rule.isMet,
      });
      // Refresh phases
      if (selectedProjectId) {
        const refreshed = await getProjectPhases(selectedProjectId);
        setPhases(refreshed);
        // Update checklist phase
        const updated = refreshed.find((p: any) => p.id === checklistPhase?.id);
        if (updated) setChecklistPhase(updated);
      }
    } catch {
      // error handling — toast would be ideal, but keep simple
    } finally {
      setTogglingRule(null);
    }
  }

  // ─── Checklist Phase Stats ────────────────────────────────
  const checklistStats = React.useMemo(() => {
    if (!checklistPhase) return { total: 0, met: 0, score: 0 };
    const rules = checklistPhase.readinessRules || [];
    const total = rules.length;
    const met = rules.filter((r: any) => r.isMet).length;
    const score = total > 0 ? Math.round((met / total) * 100) : 0;
    return { total, met, score };
  }, [checklistPhase]);

  // ─── Render ───────────────────────────────────────────────
  if (loadingProjects) {
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
          title={lang === "ar" ? "المراحل" : "Phases"}
          description={
            lang === "ar"
              ? "عرض جاهزية المراحل وإدارة معايير الإطلاق"
              : "View phase readiness and manage release criteria"
          }
        />
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد مشاريع" : "No Projects"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "قم بإنشاء مشروع أولاً لعرض المراحل"
              : "Create a project first to view phases"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "المراحل" : "Phases"}
        description={
          lang === "ar"
            ? "عرض جاهزية المراحل وإدارة معايير الإطلاق"
            : "View phase readiness and manage release criteria"
        }
      />

      {/* Project Selector */}
      <div className="relative inline-block">
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="h-9 appearance-none rounded-md border border-border bg-card pe-8 ps-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[220px]"
        >
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.city ? ` — ${p.city}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* KPI Bar */}
      {phaseStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{fmt(kpis.totalPhases)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "إجمالي المراحل" : "Total Phases"}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-success">{fmt(kpis.readyCount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "جاهز للإطلاق" : "Ready"}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <span className="text-2xl font-bold text-foreground">{kpis.avgReadiness}%</span>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "متوسط الجاهزية" : "Avg Readiness"}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{fmt(kpis.totalBuildings)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "المباني" : "Buildings"}
            </p>
          </Card>
        </div>
      )}

      {/* Main Layout: Left Panel + Map */}
      <div className="flex gap-4" style={{ height: "calc(100vh - 460px)", minHeight: 400 }}>
        {/* Left Panel — Phase List */}
        <div className="w-[350px] shrink-0 overflow-y-auto rounded-lg border border-border bg-card">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "ar" ? "قائمة المراحل" : "Phase List"}
            </h3>
          </div>

          {loadingPhases ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : phaseStats.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد مراحل لهذا المشروع" : "No phases for this project"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {phaseStats.map((phase) => {
                const isActive = selectedPhaseId === phase.id;
                const color = getReadinessColor(phase.score);

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      openChecklist(phase);
                    }}
                    className={`w-full text-start px-4 py-3 hover:bg-muted/40 transition-colors ${
                      isActive ? "bg-primary/5 border-s-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {phase.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>

                    {/* Building count + readiness label */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {phase._count?.buildings ?? 0}{" "}
                        {lang === "ar" ? "مبنى" : "buildings"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {getReadinessLabel(phase.score, lang)}
                      </span>
                    </div>

                    {/* Readiness progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${phase.score}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground w-14 text-end">
                        {phase.met}/{phase.total}{" "}
                        {lang === "ar" ? "متحقق" : "met"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative rounded-lg border border-border overflow-hidden">
          {loadingPhases && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <MapView
            className="h-full w-full"
            initialCenter={mapCenter}
            initialZoom={13}
            sources={sources}
            layers={layers}
          >
            <MapLegend items={legendItems} />
          </MapView>
        </div>
      </div>

      {/* Readiness Checklist Dialog */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {checklistPhase?.name} —{" "}
              {lang === "ar" ? "معايير الجاهزية" : "Readiness Checklist"}
            </DialogTitle>
          </DialogHeader>

          {checklistPhase && (
            <div className="space-y-4">
              {/* Progress summary */}
              <div className="flex items-center gap-3 px-1">
                <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${checklistStats.score}%`,
                      backgroundColor: getReadinessColor(checklistStats.score),
                    }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: getReadinessColor(checklistStats.score) }}>
                  {checklistStats.score}%
                </span>
              </div>

              <p className="text-xs text-muted-foreground px-1">
                {checklistStats.met} / {checklistStats.total}{" "}
                {lang === "ar" ? "معيار متحقق" : "criteria met"}
              </p>

              {/* Rules list */}
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {(checklistPhase.readinessRules || []).map((rule: any) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => handleToggleRule(rule)}
                    disabled={togglingRule === rule.id}
                    className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-muted/30 transition-colors disabled:opacity-50"
                  >
                    {togglingRule === rule.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                    ) : rule.isMet ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${rule.isMet ? "text-foreground" : "text-muted-foreground"}`}>
                        {lang === "ar" ? rule.ruleLabelAr : rule.ruleLabel}
                      </p>
                      {rule.isMet && rule.checkedAt && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {lang === "ar" ? "تم التحقق" : "Verified"}{" "}
                          {new Date(rule.checkedAt).toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                          )}
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={rule.isMet ? "default" : "outline"}
                      className="text-[10px] shrink-0"
                    >
                      {rule.isMet
                        ? lang === "ar"
                          ? "متحقق"
                          : "Met"
                        : lang === "ar"
                          ? "غير متحقق"
                          : "Not Met"}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChecklistOpen(false)}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
