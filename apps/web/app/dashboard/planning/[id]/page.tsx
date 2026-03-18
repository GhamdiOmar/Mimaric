"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  Layers,
  BarChart3,
  ShieldCheck,
  CircleDollarSign,
  MessageCircle,
  ChevronDown,
  Download,
  Upload,
  Play,
  Star,
  X,
  AlertTriangle,
  Maximize2,
  Compass,
} from "lucide-react";
import { useLanguage } from "../../../../components/LanguageProvider";
import { getPlanningWorkspaceDetail, updatePlanningWorkspace } from "../../../actions/planning-workspaces";
import {
  createPlanningScenario,
  duplicateScenario,
  updateScenarioStatus,
  setScenarioAsBaseline,
  deleteScenario,
  recalculateScenarioMetrics,
} from "../../../actions/planning-scenarios";
import { runComplianceCheck, getComplianceResults, getComplianceSummary } from "../../../actions/compliance";
import { upsertFeasibilityAssumptions } from "../../../actions/feasibility-assumptions";
import { createPlanningComment, getPlanningComments } from "../../../actions/planning-comments";
import { createSpatialLayer, toggleLayerVisibility, deleteSpatialLayer } from "../../../actions/spatial-layers";
import { createPlot, createRoad, createBlock, deletePlot, deleteRoad, deleteBlock } from "../../../actions/subdivision";
import { convertBaselineToProject } from "../../../actions/planning-conversion";

const SCENARIO_STATUS_CONFIG: Record<string, { label: { ar: string; en: string }; color: string }> = {
  DRAFT: { label: { ar: "مسودة", en: "Draft" }, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  UNDER_REVIEW: { label: { ar: "قيد المراجعة", en: "Under Review" }, color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  APPROVED: { label: { ar: "معتمد", en: "Approved" }, color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  REJECTED: { label: { ar: "مرفوض", en: "Rejected" }, color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const LAND_USE_COLORS: Record<string, string> = {
  RESIDENTIAL: "#22c55e",
  COMMERCIAL: "#3b82f6",
  INDUSTRIAL: "#f59e0b",
  AGRICULTURAL: "#84cc16",
  MIXED_USE: "#8b5cf6",
  OPEN_SPACE: "#06b6d4",
  EDUCATIONAL: "#ec4899",
  HEALTHCARE: "#ef4444",
  RELIGIOUS: "#d97706",
  GOVERNMENT: "#6b7280",
};

export default function PlanningWorkspaceDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const router = useRouter();

  const [workspace, setWorkspace] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("map");
  const [activeScenarioId, setActiveScenarioId] = React.useState<string | null>(null);

  // Modal states
  const [showNewScenario, setShowNewScenario] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showFeasibility, setShowFeasibility] = React.useState(false);

  // Promote to project
  const [promoting, setPromoting] = React.useState(false);

  // Compliance
  const [complianceResults, setComplianceResults] = React.useState<any[]>([]);
  const [complianceSummary, setComplianceSummary] = React.useState<any>(null);
  const [runningCompliance, setRunningCompliance] = React.useState(false);

  // Comments
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");

  // Feasibility form
  const [feasForm, setFeasForm] = React.useState({
    landPriceSarPerSqm: 0,
    constructionCostPerSqm: 0,
    infrastructureCostTotal: 0,
    contingencyPct: 10,
    profitMarginPct: 15,
  });

  React.useEffect(() => {
    loadWorkspace();
  }, [id]);

  async function loadWorkspace() {
    try {
      const data = await getPlanningWorkspaceDetail(id as string);
      setWorkspace(data);
      if (data.scenarios?.length > 0 && !activeScenarioId) {
        setActiveScenarioId(data.scenarios[0].id);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  const activeScenario = workspace?.scenarios?.find((s: any) => s.id === activeScenarioId);
  const sp = activeScenario?.subdivisionPlan;

  // Load compliance when switching to compliance tab
  React.useEffect(() => {
    if (activeTab === "compliance" && activeScenarioId) {
      loadCompliance();
    }
  }, [activeTab, activeScenarioId]);

  // Load comments when switching to comments tab
  React.useEffect(() => {
    if (activeTab === "comments") {
      loadComments();
    }
  }, [activeTab]);

  async function loadCompliance() {
    if (!activeScenarioId) return;
    try {
      const [results, summary] = await Promise.all([
        getComplianceResults(activeScenarioId),
        getComplianceSummary(activeScenarioId),
      ]);
      setComplianceResults(results);
      setComplianceSummary(summary);
    } catch { /* empty */ }
  }

  async function loadComments() {
    try {
      const c = await getPlanningComments(id as string);
      setComments(c);
    } catch { /* empty */ }
  }

  async function handleCreateScenario(name: string, nameArabic?: string) {
    try {
      const s = await createPlanningScenario({ workspaceId: id as string, name, nameArabic });
      setActiveScenarioId(s.id);
      setShowNewScenario(false);
      loadWorkspace();
    } catch { /* empty */ }
  }

  async function handleDuplicate(scenarioId: string) {
    const src = workspace.scenarios.find((s: any) => s.id === scenarioId);
    if (!src) return;
    try {
      const s = await duplicateScenario(scenarioId, `${src.name} (Copy)`, src.nameArabic ? `${src.nameArabic} (نسخة)` : undefined);
      setActiveScenarioId(s.id);
      loadWorkspace();
    } catch { /* empty */ }
  }

  async function handleRunCompliance() {
    if (!activeScenarioId) return;
    setRunningCompliance(true);
    try {
      const result = await runComplianceCheck(activeScenarioId);
      setComplianceSummary(result);
      const results = await getComplianceResults(activeScenarioId);
      setComplianceResults(results);
    } catch { /* empty */ } finally {
      setRunningCompliance(false);
    }
  }

  async function handleSaveFeasibility() {
    if (!activeScenarioId) return;
    try {
      await upsertFeasibilityAssumptions(activeScenarioId, feasForm);
      await recalculateScenarioMetrics(activeScenarioId);
      setShowFeasibility(false);
      loadWorkspace();
    } catch { /* empty */ }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    try {
      await createPlanningComment({
        workspaceId: id as string,
        content: newComment,
        scenarioId: activeScenarioId || undefined,
      });
      setNewComment("");
      loadComments();
    } catch { /* empty */ }
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let geoJson: any;

        if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
          geoJson = JSON.parse(text);
        } else if (file.name.endsWith(".kml") || file.name.endsWith(".kmz")) {
          // KML parsing — requires browser DOMParser
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/xml");
          // Basic KML to GeoJSON (simplified for common cases)
          geoJson = kmlToGeoJson(doc);
        } else if (file.name.endsWith(".csv")) {
          geoJson = csvToGeoJson(text);
        }

        if (geoJson) {
          await createSpatialLayer({
            workspaceId: id as string,
            name: file.name.replace(/\.[^.]+$/, ""),
            type: "IMPORTED",
            geoJson,
            sourceFile: file.name,
          });
          loadWorkspace();
          setShowImport(false);
        }
      } catch (err) {
        console.error("Import error:", err);
      }
    };
    reader.readAsText(file);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-[600px] bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{lang === "ar" ? "مساحة العمل غير موجودة" : "Workspace not found"}</p>
      </div>
    );
  }

  const meta = workspace.siteMetadata || {};
  const metrics = activeScenario?.metrics || {};

  const tabs = [
    { key: "map", label: { ar: "الخريطة", en: "Map" }, icon: MapPin },
    { key: "scenarios", label: { ar: "السيناريوهات", en: "Scenarios" }, icon: Layers },
    { key: "compliance", label: { ar: "الامتثال", en: "Compliance" }, icon: ShieldCheck },
    { key: "feasibility", label: { ar: "الجدوى", en: "Feasibility" }, icon: CircleDollarSign },
    { key: "comparison", label: { ar: "المقارنة", en: "Compare" }, icon: BarChart3 },
    { key: "comments", label: { ar: "التعليقات", en: "Comments" }, icon: MessageCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/planning" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">{lang === "ar" ? (workspace.nameArabic || workspace.name) : workspace.name}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {(meta.city || meta.region) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[meta.district, meta.city, meta.region].filter(Boolean).join(", ")}
              </span>
            )}
            {meta.totalAreaSqm && (
              <span>{Number(meta.totalAreaSqm).toLocaleString()} {lang === "ar" ? "م²" : "sqm"}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            style={{ display: "inline-flex" }}
          >
            <Upload className="h-3.5 w-3.5" />
            {lang === "ar" ? "استيراد" : "Import"}
          </button>
          {workspace.scenarios?.some((s: any) => s.isBaseline && s.status === "APPROVED") && !workspace.projectId && (
            <button
              disabled={promoting}
              onClick={async () => {
                setPromoting(true);
                try {
                  const result = await convertBaselineToProject(workspace.id);
                  if (result.projectId) {
                    router.push(`/dashboard/projects/${result.projectId}`);
                  }
                } catch (e) {
                  console.error("Promote failed:", e);
                } finally {
                  setPromoting(false);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              style={{ display: "inline-flex" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {promoting
                ? (lang === "ar" ? "جاري التحويل..." : "Converting...")
                : (lang === "ar" ? "تحويل إلى مشروع" : "Promote to Project")}
            </button>
          )}
          <button
            onClick={() => setShowNewScenario(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
            style={{ display: "inline-flex" }}
          >
            <Plus className="h-3.5 w-3.5" />
            {lang === "ar" ? "سيناريو جديد" : "New Scenario"}
          </button>
        </div>
      </div>

      {/* Scenario Switcher */}
      {workspace.scenarios?.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {workspace.scenarios.map((s: any) => {
            const sc = SCENARIO_STATUS_CONFIG[s.status] ?? SCENARIO_STATUS_CONFIG["DRAFT"]!;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenarioId(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  activeScenarioId === s.id
                    ? "border-secondary bg-secondary/5 text-secondary"
                    : "border-border text-muted-foreground hover:border-secondary/30"
                }`}
                style={{ display: "inline-flex" }}
              >
                {s.isBaseline && <Star className="h-3 w-3 text-amber-500" />}
                <span>{lang === "ar" ? (s.nameArabic || s.name) : s.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${sc.color}`}>{sc.label[lang]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Summary Cards */}
      {activeScenario && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: { ar: "المساحة الإجمالية", en: "Total Area" }, value: `${Number(metrics.totalArea || meta.totalAreaSqm || 0).toLocaleString()} م²`, color: "text-primary" },
            { label: { ar: "المساحة القابلة للبيع", en: "Sellable Area" }, value: `${Number(metrics.sellableArea || 0).toLocaleString()} م²`, color: "text-secondary" },
            { label: { ar: "نسبة البيع", en: "Sellable %" }, value: `${metrics.sellablePct || 0}%`, color: "text-blue-600" },
            { label: { ar: "عدد القطع", en: "Plots" }, value: metrics.plotCount || sp?.plots?.length || 0, color: "text-primary" },
            { label: { ar: "الإيرادات المتوقعة", en: "Est. Revenue" }, value: metrics.estimatedRevenue ? `${(metrics.estimatedRevenue / 1000000).toFixed(1)}M SAR` : "—", color: "text-green-600" },
            { label: { ar: "الربح المتوقع", en: "Est. Profit" }, value: metrics.estimatedProfit ? `${(metrics.estimatedProfit / 1000000).toFixed(1)}M SAR` : "—", color: metrics.estimatedProfit > 0 ? "text-green-600" : "text-red-600" },
          ].map((card, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground font-medium">{card.label[lang]}</p>
              <p className={`text-lg font-bold ${card.color} mt-0.5`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-secondary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
              style={{ display: "inline-flex" }}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label[lang]}
              {tab.key === "comments" && comments.length > 0 && (
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[9px]">{comments.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden isolate" style={{ height: "500px" }}>
              <PlanningMapCanvas
                workspace={workspace}
                scenario={activeScenario}
                onRefresh={loadWorkspace}
                lang={lang}
              />
            </div>

            {/* Layer Manager */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {lang === "ar" ? "الطبقات" : "Layers"}
              </h3>
              <div className="space-y-2">
                {workspace.spatialLayers?.map((layer: any) => (
                  <div key={layer.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => { await toggleLayerVisibility(layer.id); loadWorkspace(); }}
                        className={`w-4 h-4 rounded border ${layer.visible ? "bg-secondary border-secondary" : "border-border"}`}
                      >
                        {layer.visible && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: layer.style?.color || "#3388ff" }}
                      />
                      <span className="text-xs text-primary">{lang === "ar" ? (layer.nameArabic || layer.name) : layer.name}</span>
                      <span className="text-[10px] text-muted-foreground">({layer.featureCount})</span>
                    </div>
                    <button
                      onClick={async () => { await deleteSpatialLayer(layer.id); loadWorkspace(); }}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {(!workspace.spatialLayers || workspace.spatialLayers.length === 0) && (
                  <p className="text-xs text-muted-foreground py-2">{lang === "ar" ? "لا توجد طبقات. استورد ملفات مكانية." : "No layers. Import spatial files."}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SCENARIOS TAB ── */}
        {activeTab === "scenarios" && (
          <div className="space-y-4">
            {workspace.scenarios?.map((s: any) => {
              const sc = SCENARIO_STATUS_CONFIG[s.status] ?? SCENARIO_STATUS_CONFIG["DRAFT"]!;
              const subPlan = s.subdivisionPlan;
              return (
                <div key={s.id} className={`bg-card border rounded-xl p-4 ${s.id === activeScenarioId ? "border-secondary" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {s.isBaseline && <Star className="h-3.5 w-3.5 text-amber-500" />}
                        <h3 className="font-bold text-sm text-primary">{s.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>{sc.label[lang]}</span>
                        <span className="text-[10px] text-muted-foreground">v{s.version}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setActiveScenarioId(s.id)} className="p-1.5 text-muted-foreground hover:text-primary" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDuplicate(s.id)} className="p-1.5 text-muted-foreground hover:text-primary" title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {s.status === "DRAFT" && (
                        <button
                          onClick={async () => { await updateScenarioStatus(s.id, "UNDER_REVIEW"); loadWorkspace(); }}
                          className="p-1.5 text-muted-foreground hover:text-yellow-600" title="Submit for Review"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {s.status === "UNDER_REVIEW" && (
                        <>
                          <button
                            onClick={async () => { await setScenarioAsBaseline(s.id); loadWorkspace(); }}
                            className="p-1.5 text-muted-foreground hover:text-green-600" title="Approve as Baseline"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={async () => { await updateScenarioStatus(s.id, "REJECTED"); loadWorkspace(); }}
                            className="p-1.5 text-muted-foreground hover:text-red-600" title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={async () => { await deleteScenario(s.id); loadWorkspace(); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive" title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {subPlan && (
                    <div className="grid grid-cols-4 gap-3 mt-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-primary">{subPlan.plots?.length ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "قطع" : "Plots"}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{subPlan.blocks?.length ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "بلوكات" : "Blocks"}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{subPlan.roads?.length ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "طرق" : "Roads"}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{s._count?.complianceResults ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "فحوصات" : "Checks"}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(!workspace.scenarios || workspace.scenarios.length === 0) && (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Layers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground">{lang === "ar" ? "لا توجد سيناريوهات" : "No scenarios yet"}</p>
                <button
                  onClick={() => setShowNewScenario(true)}
                  className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg text-sm hover:bg-secondary/90"
                  style={{ display: "inline-flex" }}
                >
                  {lang === "ar" ? "إنشاء سيناريو" : "Create Scenario"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLIANCE TAB ── */}
        {activeTab === "compliance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">{lang === "ar" ? "فحص الامتثال" : "Compliance Check"}</h3>
              <button
                onClick={handleRunCompliance}
                disabled={runningCompliance || !activeScenarioId}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white rounded-lg text-xs font-medium hover:bg-secondary/90 disabled:opacity-50"
                style={{ display: "inline-flex" }}
              >
                <Play className="h-3.5 w-3.5" />
                {runningCompliance ? (lang === "ar" ? "جاري الفحص..." : "Running...") : (lang === "ar" ? "تشغيل الفحص" : "Run Check")}
              </button>
            </div>

            {complianceSummary && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{complianceSummary.complianceScore}%</p>
                  <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "نسبة الامتثال" : "Compliance Score"}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{complianceSummary.passed}</p>
                  <p className="text-[10px] text-green-600">{lang === "ar" ? "نجح" : "Passed"}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{complianceSummary.failed}</p>
                  <p className="text-[10px] text-red-600">{lang === "ar" ? "فشل" : "Failed"}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{complianceSummary.total}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "إجمالي" : "Total"}</p>
                </div>
              </div>
            )}

            {complianceResults.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start px-3 py-2 text-muted-foreground font-medium">{lang === "ar" ? "الحالة" : "Status"}</th>
                      <th className="text-start px-3 py-2 text-muted-foreground font-medium">{lang === "ar" ? "القاعدة" : "Rule"}</th>
                      <th className="text-start px-3 py-2 text-muted-foreground font-medium">{lang === "ar" ? "العنصر" : "Feature"}</th>
                      <th className="text-start px-3 py-2 text-muted-foreground font-medium">{lang === "ar" ? "الفعلي" : "Actual"}</th>
                      <th className="text-start px-3 py-2 text-muted-foreground font-medium">{lang === "ar" ? "المطلوب" : "Expected"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceResults.map((r: any) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            r.status === "PASS" ? "bg-green-50 text-green-700" : r.status === "FAIL" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-primary">{lang === "ar" ? (r.rule?.nameArabic || r.rule?.name) : r.rule?.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.featureLabel}</td>
                        <td className="px-3 py-2 text-primary font-medium">{r.actualValue}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.expectedValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {complianceResults.length === 0 && !complianceSummary && (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground">{lang === "ar" ? "لم يتم تشغيل الفحص بعد" : "No compliance check run yet"}</p>
              </div>
            )}
          </div>
        )}

        {/* ── FEASIBILITY TAB ── */}
        {activeTab === "feasibility" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">{lang === "ar" ? "دراسة الجدوى" : "Feasibility Analysis"}</h3>
              <button
                onClick={() => {
                  if (activeScenario?.feasibilitySet) {
                    setFeasForm({
                      landPriceSarPerSqm: activeScenario.feasibilitySet.landPriceSarPerSqm || 0,
                      constructionCostPerSqm: activeScenario.feasibilitySet.constructionCostPerSqm || 0,
                      infrastructureCostTotal: activeScenario.feasibilitySet.infrastructureCostTotal || 0,
                      contingencyPct: activeScenario.feasibilitySet.contingencyPct || 10,
                      profitMarginPct: activeScenario.feasibilitySet.profitMarginPct || 15,
                    });
                  }
                  setShowFeasibility(true);
                }}
                disabled={!activeScenarioId}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white rounded-lg text-xs font-medium hover:bg-secondary/90 disabled:opacity-50"
                style={{ display: "inline-flex" }}
              >
                <Pencil className="h-3.5 w-3.5" />
                {lang === "ar" ? "تعديل الافتراضات" : "Edit Assumptions"}
              </button>
            </div>

            {activeScenario?.feasibilitySet?.calculatedMetrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: { ar: "إجمالي الإيرادات", en: "Total Revenue" }, value: activeScenario.feasibilitySet.calculatedMetrics.totalRevenue, format: "sar" },
                  { label: { ar: "إجمالي التكاليف", en: "Total Cost" }, value: activeScenario.feasibilitySet.calculatedMetrics.totalCost, format: "sar" },
                  { label: { ar: "إجمالي الربح", en: "Gross Profit" }, value: activeScenario.feasibilitySet.calculatedMetrics.grossProfit, format: "sar" },
                  { label: { ar: "العائد على الاستثمار", en: "ROI" }, value: activeScenario.feasibilitySet.calculatedMetrics.roi, format: "pct" },
                  { label: { ar: "المساحة القابلة للبيع", en: "Sellable Area" }, value: activeScenario.feasibilitySet.calculatedMetrics.sellableArea, format: "sqm" },
                  { label: { ar: "نسبة البيع", en: "Sellable %" }, value: activeScenario.feasibilitySet.calculatedMetrics.sellablePct, format: "pct" },
                  { label: { ar: "سعر/م² قابل للبيع", en: "Price/sqm" }, value: activeScenario.feasibilitySet.calculatedMetrics.pricePerSqmSellable, format: "sar" },
                  { label: { ar: "تكلفة/م² قابل للبيع", en: "Cost/sqm" }, value: activeScenario.feasibilitySet.calculatedMetrics.costPerSqmSellable, format: "sar" },
                ].map((item, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground">{item.label[lang]}</p>
                    <p className={`text-lg font-bold mt-0.5 ${item.format === "sar" && (item.value as number) < 0 ? "text-red-600" : "text-primary"}`}>
                      {item.format === "sar"
                        ? `${(Number(item.value) / 1000000).toFixed(2)}M SAR`
                        : item.format === "pct"
                          ? `${item.value}%`
                          : `${Number(item.value).toLocaleString()} م²`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <CircleDollarSign className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground">{lang === "ar" ? "لم تتم إضافة افتراضات الجدوى" : "No feasibility assumptions set"}</p>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARISON TAB ── */}
        {activeTab === "comparison" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary">{lang === "ar" ? "مقارنة السيناريوهات" : "Scenario Comparison"}</h3>
            {workspace.scenarios?.length >= 2 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs bg-card border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start px-3 py-2.5 text-muted-foreground font-medium min-w-[140px]">{lang === "ar" ? "المقياس" : "Metric"}</th>
                      {workspace.scenarios.map((s: any) => (
                        <th key={s.id} className="text-center px-3 py-2.5 text-primary font-medium min-w-[120px]">
                          {s.isBaseline && <Star className="h-2.5 w-2.5 inline text-amber-500 me-1" />}
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: { ar: "الحالة", en: "Status" }, key: "status" },
                      { label: { ar: "عدد القطع", en: "Plots" }, key: "plotCount" },
                      { label: { ar: "عدد البلوكات", en: "Blocks" }, key: "blockCount" },
                      { label: { ar: "عدد الطرق", en: "Roads" }, key: "roadCount" },
                      { label: { ar: "المساحة القابلة للبيع", en: "Sellable Area" }, key: "sellableArea" },
                      { label: { ar: "نسبة البيع", en: "Sellable %" }, key: "sellablePct" },
                      { label: { ar: "الإيرادات المتوقعة", en: "Est. Revenue" }, key: "estimatedRevenue" },
                      { label: { ar: "التكاليف المتوقعة", en: "Est. Cost" }, key: "estimatedCost" },
                      { label: { ar: "الربح المتوقع", en: "Est. Profit" }, key: "estimatedProfit" },
                    ].map((row) => (
                      <tr key={row.key} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground font-medium">{row.label[lang]}</td>
                        {workspace.scenarios.map((s: any) => {
                          const m = s.metrics || {};
                          let val: any = "—";
                          if (row.key === "status") {
                            const sc = SCENARIO_STATUS_CONFIG[s.status];
                            val = <span className={`px-1.5 py-0.5 rounded text-[10px] ${sc?.color}`}>{sc?.label[lang]}</span>;
                          } else if (row.key === "plotCount") val = s.subdivisionPlan?.plots?.length ?? m.plotCount ?? "—";
                          else if (row.key === "blockCount") val = s.subdivisionPlan?.blocks?.length ?? m.blockCount ?? "—";
                          else if (row.key === "roadCount") val = s.subdivisionPlan?.roads?.length ?? m.roadCount ?? "—";
                          else if (row.key === "sellableArea") val = m.sellableArea ? `${Number(m.sellableArea).toLocaleString()} م²` : "—";
                          else if (row.key === "sellablePct") val = m.sellablePct ? `${m.sellablePct}%` : "—";
                          else if (row.key === "estimatedRevenue") val = m.estimatedRevenue ? `${(m.estimatedRevenue / 1e6).toFixed(1)}M` : "—";
                          else if (row.key === "estimatedCost") val = m.estimatedCost ? `${(m.estimatedCost / 1e6).toFixed(1)}M` : "—";
                          else if (row.key === "estimatedProfit") val = m.estimatedProfit !== undefined ? `${(m.estimatedProfit / 1e6).toFixed(1)}M` : "—";
                          return <td key={s.id} className="px-3 py-2 text-center text-primary">{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground">{lang === "ar" ? "أنشئ سيناريوهين على الأقل للمقارنة" : "Create at least 2 scenarios to compare"}</p>
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS TAB ── */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder={lang === "ar" ? "أضف تعليقاً..." : "Add a comment..."}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
                style={{ display: "inline-flex" }}
              >
                {lang === "ar" ? "إرسال" : "Send"}
              </button>
            </div>

            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">{c.authorName || c.authorId}</span>
                    <span className="text-[10px] text-muted-foreground">{c.authorRole}</span>
                    <span className="text-[10px] text-muted-foreground/60">{new Date(c.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                  </div>
                  <p className="text-sm text-primary">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">{lang === "ar" ? "لا توجد تعليقات" : "No comments yet"}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* New Scenario Modal */}
      {showNewScenario && (
        <SimpleModal
          title={lang === "ar" ? "سيناريو جديد" : "New Scenario"}
          onClose={() => setShowNewScenario(false)}
          onConfirm={(data) => handleCreateScenario(data.name, data.nameArabic)}
          lang={lang}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-primary mb-4">{lang === "ar" ? "استيراد بيانات مكانية" : "Import Spatial Data"}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {lang === "ar" ? "الصيغ المدعومة: GeoJSON، KML، CSV" : "Supported: GeoJSON, KML, CSV with coordinates"}
            </p>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <input
                type="file"
                accept=".geojson,.json,.kml,.kmz,.csv"
                onChange={handleFileImport}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-primary" style={{ display: "inline-flex" }}>
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feasibility Modal */}
      {showFeasibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-bold text-primary mb-4">{lang === "ar" ? "افتراضات الجدوى" : "Feasibility Assumptions"}</h2>
            <div className="space-y-3">
              {[
                { key: "landPriceSarPerSqm", label: { ar: "سعر الأرض (ريال/م²)", en: "Land Price (SAR/sqm)" } },
                { key: "constructionCostPerSqm", label: { ar: "تكلفة البناء (ريال/م²)", en: "Construction Cost (SAR/sqm)" } },
                { key: "infrastructureCostTotal", label: { ar: "تكلفة البنية التحتية (إجمالي)", en: "Infrastructure Cost (total SAR)" } },
                { key: "contingencyPct", label: { ar: "نسبة الطوارئ %", en: "Contingency %" } },
                { key: "profitMarginPct", label: { ar: "هامش الربح %", en: "Profit Margin %" } },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-primary mb-1 block">{field.label[lang]}</label>
                  <input
                    type="number"
                    value={(feasForm as any)[field.key]}
                    onChange={(e) => setFeasForm((f) => ({ ...f, [field.key]: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowFeasibility(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-primary" style={{ display: "inline-flex" }}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleSaveFeasibility} className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90" style={{ display: "inline-flex" }}>
                {lang === "ar" ? "حفظ وحساب" : "Save & Calculate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SimpleModal({ title, onClose, onConfirm, lang }: { title: string; onClose: () => void; onConfirm: (data: { name: string; nameArabic?: string }) => void; lang: string }) {
  const [name, setName] = React.useState("");
  const [nameArabic, setNameArabic] = React.useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">{title}</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none" />
          <input value={nameArabic} onChange={(e) => setNameArabic(e.target.value)} placeholder={lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none" dir="rtl" />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground" style={{ display: "inline-flex" }}>{lang === "ar" ? "إلغاء" : "Cancel"}</button>
          <button onClick={() => onConfirm({ name, nameArabic: nameArabic || undefined })} disabled={!name.trim()} className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium disabled:opacity-50" style={{ display: "inline-flex" }}>{lang === "ar" ? "إنشاء" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Planning Map Canvas (Leaflet + Geoman) ─────────────────────────────────

function PlanningMapCanvas({ workspace, scenario, onRefresh, lang }: { workspace: any; scenario: any; onRefresh: () => void; lang: string }) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const [mapReady, setMapReady] = React.useState(false);

  React.useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;
    const container = mapRef.current;

    // Dynamic import of Leaflet + Geoman (client-only)
    import("leaflet").then((L) => {
      if (cancelled || !container) return;

      // If the container was already initialized (React strict mode double-mount),
      // remove the old instance and clear Leaflet's internal marker
      if ((container as any)._leaflet_id) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        // Leaflet stores _leaflet_id even after .remove() in some versions — clear it
        delete (container as any)._leaflet_id;
        // Clear any leftover child elements from previous map
        container.innerHTML = "";
      }

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const meta = workspace.siteMetadata || {};
      const center: [number, number] = [meta.latitude || 24.7136, meta.longitude || 46.6753];
      const zoom = meta.latitude ? 15 : 6;

      const map = L.map(container, { zoomControl: true }).setView(center, zoom);

      // Basemap layers
      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 20,
      });

      const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri",
        maxZoom: 20,
      });

      osmLayer.addTo(map);

      L.control.layers({
        "OpenStreetMap": osmLayer,
        "Satellite": satelliteLayer,
      }, {}, { position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      // Try to import Geoman
      import("@geoman-io/leaflet-geoman-free").then(() => {
        if (cancelled) return;

        // Inject Geoman CSS via link tag (dynamic CSS import doesn't work in Next.js)
        if (!document.querySelector('link[data-geoman-css]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/@geoman-io/leaflet-geoman-free@2.19.2/dist/leaflet-geoman.css";
          link.setAttribute("data-geoman-css", "true");
          document.head.appendChild(link);
        }

        if (map.pm) {
          map.pm.addControls({
            position: "topleft",
            drawCircle: false,
            drawCircleMarker: false,
            drawText: false,
            cutPolygon: true,
            rotateMode: false,
          });

          map.pm.setGlobalOptions({
            snappable: true,
            snapDistance: 15,
          });
        }
      }).catch(() => {
        // Geoman not available — fallback to basic map
        console.warn("Leaflet Geoman not available");
      });
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render geometry when scenario changes
  React.useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import("leaflet").then((L) => {
      // Clear existing layers (except tile layers)
      map.eachLayer((layer: any) => {
        if (layer instanceof L.GeoJSON || layer instanceof L.Polygon || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const bounds: any[] = [];

      // Render spatial layers
      if (workspace.spatialLayers) {
        for (const layer of workspace.spatialLayers) {
          if (!layer.visible || !layer.geoJson) continue;
          const style = layer.style || {};
          const geoLayer = L.geoJSON(layer.geoJson, {
            style: {
              color: style.color || "#3388ff",
              fillColor: style.fillColor || style.color || "#3388ff",
              fillOpacity: style.fillOpacity ?? 0.2,
              weight: style.weight ?? 2,
            },
          }).addTo(map);
          const layerBounds = geoLayer.getBounds();
          if (layerBounds.isValid()) bounds.push(layerBounds);
        }
      }

      // Render scenario geometry
      const sp = scenario?.subdivisionPlan;
      if (sp) {
        // Boundary
        if (sp.boundaryGeoJson) {
          const boundary = L.geoJSON(sp.boundaryGeoJson, {
            style: { color: "#ef4444", fillOpacity: 0.05, weight: 3, dashArray: "10 5" },
          }).addTo(map);
          const b = boundary.getBounds();
          if (b.isValid()) bounds.push(b);
        }

        // Blocks
        for (const block of (sp.blocks || [])) {
          if (!block.boundaryGeoJson) continue;
          L.geoJSON(block.boundaryGeoJson, {
            style: { color: "#6b7280", fillOpacity: 0.08, weight: 1.5 },
          }).bindTooltip(`Block ${block.blockNumber}`, { permanent: false }).addTo(map);
        }

        // Plots
        for (const plot of (sp.plots || [])) {
          if (!plot.boundaryGeoJson) continue;
          const color = LAND_USE_COLORS[plot.landUse] || "#22c55e";
          L.geoJSON(plot.boundaryGeoJson, {
            style: { color, fillColor: color, fillOpacity: 0.3, weight: 1.5 },
          }).bindTooltip(`${plot.plotNumber} (${plot.areaSqm ?? "?"} m²)`, { permanent: false }).addTo(map);
        }

        // Roads
        for (const road of (sp.roads || [])) {
          if (!road.lineGeoJson) continue;
          L.geoJSON(road.lineGeoJson, {
            style: { color: "#f59e0b", weight: road.widthMeters ? Math.max(2, road.widthMeters / 3) : 3 },
          }).bindTooltip(road.name || road.type, { permanent: false }).addTo(map);
        }

        // Utility corridors
        for (const uc of (sp.utilityCorridors || [])) {
          if (!uc.lineGeoJson) continue;
          L.geoJSON(uc.lineGeoJson, {
            style: { color: "#8b5cf6", weight: 2, dashArray: "5 5" },
          }).bindTooltip(uc.name || uc.utilityType, { permanent: false }).addTo(map);
        }
      }

      // Fit bounds
      if (bounds.length > 0) {
        const allBounds = bounds[0];
        for (let i = 1; i < bounds.length; i++) allBounds.extend(bounds[i]);
        map.fitBounds(allBounds, { padding: [30, 30] });
      }
    });
  }, [mapReady, scenario?.id, workspace?.spatialLayers]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}

// ─── Spatial Import Helpers ─────────────────────────────────────────────────

function kmlToGeoJson(doc: Document): any {
  const features: any[] = [];
  const placemarks = doc.getElementsByTagName("Placemark");

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i]!;
    const name = pm.getElementsByTagName("name")[0]?.textContent || "";

    // Points
    const point = pm.getElementsByTagName("Point")[0];
    if (point) {
      const coords = point.getElementsByTagName("coordinates")[0]?.textContent?.trim().split(",");
      if (coords && coords.length >= 2) {
        features.push({
          type: "Feature",
          properties: { name },
          geometry: { type: "Point", coordinates: [parseFloat(coords[0]!), parseFloat(coords[1]!)] },
        });
      }
    }

    // Polygons
    const polygon = pm.getElementsByTagName("Polygon")[0];
    if (polygon) {
      const coordStr = polygon.getElementsByTagName("coordinates")[0]?.textContent?.trim();
      if (coordStr) {
        const ring = coordStr.split(/\s+/).map((c) => {
          const parts = c.split(",");
          return [parseFloat(parts[0] ?? "0"), parseFloat(parts[1] ?? "0")];
        }).filter((c) => !isNaN(c[0]!) && !isNaN(c[1]!));
        if (ring.length >= 3) {
          features.push({
            type: "Feature",
            properties: { name },
            geometry: { type: "Polygon", coordinates: [ring] },
          });
        }
      }
    }

    // LineStrings
    const lineString = pm.getElementsByTagName("LineString")[0];
    if (lineString) {
      const coordStr = lineString.getElementsByTagName("coordinates")[0]?.textContent?.trim();
      if (coordStr) {
        const coords = coordStr.split(/\s+/).map((c) => {
          const parts = c.split(",");
          return [parseFloat(parts[0] ?? "0"), parseFloat(parts[1] ?? "0")];
        }).filter((c) => !isNaN(c[0]!) && !isNaN(c[1]!));
        if (coords.length >= 2) {
          features.push({
            type: "Feature",
            properties: { name },
            geometry: { type: "LineString", coordinates: coords },
          });
        }
      }
    }
  }

  return { type: "FeatureCollection", features };
}

function csvToGeoJson(text: string): any {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { type: "FeatureCollection", features: [] };

  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const latIdx = headers.findIndex((h) => h === "latitude" || h === "lat" || h === "y");
  const lngIdx = headers.findIndex((h) => h === "longitude" || h === "lng" || h === "lon" || h === "x");

  if (latIdx === -1 || lngIdx === -1) return { type: "FeatureCollection", features: [] };

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(",").map((c) => c.trim());
    const lat = parseFloat(cols[latIdx] ?? "");
    const lng = parseFloat(cols[lngIdx] ?? "");
    if (isNaN(lat) || isNaN(lng)) continue;

    const properties: any = {};
    headers.forEach((h, j) => {
      if (j !== latIdx && j !== lngIdx) properties[h] = cols[j];
    });

    features.push({
      type: "Feature",
      properties,
      geometry: { type: "Point", coordinates: [lng, lat] },
    });
  }

  return { type: "FeatureCollection", features };
}
