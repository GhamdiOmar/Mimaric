"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Compass,
  MapPin,
  Calendar,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  Pencil,
  Eye,
  Trash2,
  Download,
} from "lucide-react";
import { PageIntro, Button } from "@repo/ui";
import { useLanguage } from "../../../components/LanguageProvider";
import { getPlanningWorkspaces, createPlanningWorkspace, deletePlanningWorkspace } from "../../actions/planning-workspaces";
import { getAcquiredLands } from "../../actions/land";

const STATUS_CONFIG: Record<string, { label: { ar: string; en: string }; color: string; icon: any }> = {
  DRAFT: { label: { ar: "مسودة", en: "Draft" }, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Pencil },
  ACTIVE: { label: { ar: "نشط", en: "Active" }, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Layers },
  UNDER_REVIEW: { label: { ar: "قيد المراجعة", en: "Under Review" }, color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  APPROVED: { label: { ar: "معتمد", en: "Approved" }, color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  ARCHIVED: { label: { ar: "مؤرشف", en: "Archived" }, color: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400", icon: Archive },
};

export default function PlanningWorkspacesPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [workspaces, setWorkspaces] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [showCreate, setShowCreate] = React.useState(false);
  const [lands, setLands] = React.useState<any[]>([]);
  const [newName, setNewName] = React.useState("");
  const [newNameArabic, setNewNameArabic] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [selectedLandId, setSelectedLandId] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const data = await getPlanningWorkspaces();
      setWorkspaces(data);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await createPlanningWorkspace({
        name: newName,
        nameArabic: newNameArabic || undefined,
        description: newDescription || undefined,
        landRecordId: selectedLandId || undefined,
      });
      router.push(`/dashboard/planning/${ws.id}`);
    } catch { /* empty */ } finally {
      setCreating(false);
    }
  }

  const filtered = workspaces.filter((ws) => {
    if (statusFilter !== "ALL" && ws.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return ws.name.toLowerCase().includes(q) || ws.nameArabic?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: workspaces.length };
    for (const ws of workspaces) {
      counts[ws.status] = (counts[ws.status] ?? 0) + 1;
    }
    return counts;
  }, [workspaces]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntro
        title={lang === "ar" ? "التخطيط" : "Planning"}
        description={
          lang === "ar"
            ? "التخطيط العمراني وتقسيم الأراضي وتقييم الجدوى"
            : "Urban planning, subdivision, and feasibility assessment"
        }
        actions={
          <>
            <Button
              className="gap-2"
              onClick={async () => {
                setShowCreate(true);
                try {
                  const l = await getAcquiredLands();
                  setLands(l);
                } catch { /* empty */ }
              }}
              style={{ display: "inline-flex" }}
            >
              <Plus className="h-4 w-4" />
              {lang === "ar" ? "مساحة عمل جديدة" : "New Workspace"}
            </Button>
            <Button variant="outline" className="gap-2" style={{ display: "inline-flex" }}>
              <Download className="h-4 w-4" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: { ar: "الكل", en: "All" } },
          ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({ key, label: val.label })),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.key
                ? "bg-secondary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={{ display: "inline-flex" }}
          >
            {tab.label[lang]}
            {statusCounts[tab.key] !== undefined && (
              <span className="ms-1.5 bg-white/20 px-1.5 rounded-full text-[10px]">
                {statusCounts[tab.key] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-[18px] w-[18px] absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "ar" ? "بحث في مساحات العمل..." : "Search workspaces..."}
          className="w-full bg-card border border-border rounded-lg py-2.5 ps-10 pe-4 text-sm focus:ring-2 focus:ring-ring focus:border-primary/20 outline-none"
        />
      </div>

      {/* Workspace Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Compass className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">{lang === "ar" ? "لا توجد مساحات عمل" : "No workspaces found"}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {lang === "ar" ? "ابدأ بإنشاء مساحة عمل تخطيطية جديدة" : "Start by creating a new planning workspace"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => {
            const statusConf = STATUS_CONFIG[ws.status] ?? STATUS_CONFIG["DRAFT"]!;
            const StatusIcon = statusConf.icon;
            const meta = ws.siteMetadata || {};
            const approvedScenarios = ws.scenarios?.filter((s: any) => s.status === "APPROVED").length || 0;
            const baselineScenario = ws.scenarios?.find((s: any) => s.isBaseline);

            return (
              <Link
                key={ws.id}
                href={`/dashboard/planning/${ws.id}`}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-secondary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary text-sm truncate group-hover:text-secondary transition-colors">
                      {lang === "ar" ? (ws.nameArabic || ws.name) : ws.name}
                    </h3>
                    {ws.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ws.description}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConf.label[lang]}
                  </span>
                </div>

                {/* Site info */}
                {(meta.city || meta.region) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{[meta.district, meta.city, meta.region].filter(Boolean).join(", ")}</span>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{ws._count?.scenarios ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "سيناريوهات" : "Scenarios"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary">{approvedScenarios}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "معتمد" : "Approved"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{ws._count?.spatialLayers ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "طبقات" : "Layers"}</p>
                  </div>
                </div>

                {/* Baseline indicator */}
                {baselineScenario && (
                  <div className="mt-3 px-2 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lang === "ar" ? `خط أساس: ${baselineScenario.name}` : `Baseline: ${baselineScenario.name}`}
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(ws.updatedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-CA")}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-bold text-primary mb-4">
              {lang === "ar" ? "إنشاء مساحة عمل تخطيطية" : "Create Planning Workspace"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-primary mb-1 block">
                  {lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={lang === "ar" ? "اسم مساحة العمل" : "Workspace name"}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-1 block">
                  {lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
                </label>
                <input
                  value={newNameArabic}
                  onChange={(e) => setNewNameArabic(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-1 block">
                  {lang === "ar" ? "الوصف" : "Description"}
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-1 block">
                  {lang === "ar" ? "ربط بأرض (اختياري)" : "Link to Land (optional)"}
                </label>
                <select
                  value={selectedLandId}
                  onChange={(e) => setSelectedLandId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring outline-none"
                >
                  <option value="">{lang === "ar" ? "— بدون ربط —" : "— No link —"}</option>
                  {lands.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.parcelNumber || l.city || ""})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                style={{ display: "inline-flex" }}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                style={{ display: "inline-flex" }}
              >
                {creating
                  ? (lang === "ar" ? "جاري الإنشاء..." : "Creating...")
                  : (lang === "ar" ? "إنشاء" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
