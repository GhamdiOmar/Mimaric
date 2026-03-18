"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Upload,
  ClipboardList,
  Eye,
  Download,
  CheckCircle2,
  Star,
  LayoutGrid,
  ShieldCheck,
  XCircle,
  Shield,
  History,
  Filter,
  Compass,
  Wrench,
  HardHat,
  Package,
  DollarSign,
  Rocket,
  Zap,
  Droplets,
  Wifi,
  Car,
  CloudRain,
  TreePine,
  Fence,
  Signpost,
  Lamp,
  ToggleRight,
  Play,
  Square,
} from "lucide-react";
import { Button, Badge, SARAmount, Card } from "@repo/ui";
import {
  getProjectDetail,
  updateProject,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  registerProjectDocument,
  deleteProjectDocument,
  uploadDocumentVersion,
} from "../../../actions/projects";
import { getMaintenanceForProject } from "../../../actions/maintenance";
import { getConceptPlans, createConceptPlan, selectConceptPlan, deleteConceptPlan } from "../../../actions/concept-plans";
import { getSubdivisionPlans, createSubdivisionPlan, getSubdivisionPlanDetail } from "../../../actions/subdivision";
import { createBlock, createPlot, createRoad, deleteBlock, deletePlot, deleteRoad } from "../../../actions/subdivision";
import { getApprovalSubmissions, createApprovalSubmission, submitApproval, getApprovalDetail, addApprovalComment, addApprovalCondition, resolveComment, markConditionMet, deleteApprovalSubmission } from "../../../actions/approvals";
import { getInfrastructureItems, createInfrastructureItem, updateInfrastructureItem, deleteInfrastructureItem, getOverallReadinessScore } from "../../../actions/infrastructure";
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, releaseInventory, generateInventoryFromPlots, getInventoryStats } from "../../../actions/inventory";
import { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, togglePricingRule, bulkCalculatePrices, getPricingSummary } from "../../../actions/pricing";
import { getLaunchWaves, createLaunchWave, updateLaunchWave, deleteLaunchWave, launchWave, closeWave, getWaveAnalytics } from "../../../actions/launch-waves";
import { getLaunchReadinessChecklist, getSalesTracking } from "../../../actions/launch";
import { getPricingAnalytics, getWavePerformance } from "../../../actions/analytics";
import { createWorkspaceFromProject, getLinkedWorkspaces } from "../../../actions/planning-workspaces";
import { requestStageTransition } from "../../../actions/decision-gates";
import { getProjectFinancials } from "../../../actions/finance";
import { convertInventoryToUnits } from "../../../actions/inventory-handoff";
import { setupPostHandoverMaintenance } from "../../../actions/post-handover";
/* Lucide icons imported above — Phosphor removed in Phase 6 */
import { generateBuildingsFromPlots } from "../../../actions/plot-conversion";
import { ProjectLifecycleStepper } from "../../../../components/ProjectLifecycleStepper";
import { formatDualDate } from "../../../../lib/hijri";
import MapPicker from "../../../../components/MapPicker";
import { UploadButton } from "../../../../lib/uploadthing";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { ar: string; en: string; variant: string }> = {
  PLANNING: { ar: "تخطيط", en: "Planning", variant: "draft" },
  UNDER_CONSTRUCTION: { ar: "قيد الإنشاء", en: "Under Construction", variant: "reserved" },
  READY: { ar: "جاهز", en: "Ready", variant: "available" },
  HANDED_OVER: { ar: "تم التسليم", en: "Handed Over", variant: "sold" },
  LAND_IDENTIFIED: { ar: "تم التحديد", en: "Identified", variant: "draft" },
  LAND_UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under Review", variant: "reserved" },
  LAND_ACQUIRED: { ar: "تم الاستحواذ", en: "Acquired", variant: "available" },
  CONCEPT_DESIGN: { ar: "التصميم المبدئي", en: "Concept Design", variant: "draft" },
  SUBDIVISION_PLANNING: { ar: "تخطيط التقسيم", en: "Subdivision Planning", variant: "draft" },
  AUTHORITY_SUBMISSION: { ar: "تقديم للجهات", en: "Authority Submission", variant: "reserved" },
  INFRASTRUCTURE_PLANNING: { ar: "تخطيط البنية التحتية", en: "Infrastructure", variant: "reserved" },
  INVENTORY_STRUCTURING: { ar: "هيكلة المخزون", en: "Inventory", variant: "draft" },
  PRICING_PACKAGING: { ar: "التسعير", en: "Pricing", variant: "draft" },
  LAUNCH_READINESS: { ar: "جاهزية الإطلاق", en: "Launch Ready", variant: "reserved" },
  OFF_PLAN_LAUNCHED: { ar: "تم الإطلاق", en: "Launched", variant: "available" },
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  RESIDENTIAL: { ar: "سكني", en: "Residential" },
  COMMERCIAL: { ar: "تجاري", en: "Commercial" },
  MIXED_USE: { ar: "متعدد الاستخدامات", en: "Mixed Use" },
  VILLA_COMPOUND: { ar: "مجمع فلل", en: "Villa Compound" },
};

const buildingTypeLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  mixed: { ar: "متعدد", en: "Mixed" },
  villa: { ar: "فيلا", en: "Villa" },
  tower: { ar: "برج", en: "Tower" },
};

const docCategoryLabels: Record<string, { ar: string; en: string }> = {
  GENERAL: { ar: "عام", en: "General" },
  BLUEPRINT: { ar: "مخطط", en: "Blueprint" },
  LEGAL: { ar: "قانوني", en: "Legal" },
  CONTRACT: { ar: "عقد", en: "Contract" },
  MARKETING: { ar: "تسويق", en: "Marketing" },
  FINANCE: { ar: "مالي", en: "Finance" },
  GIS: { ar: "نظام معلومات جغرافية", en: "GIS" },
  CAD: { ar: "تصميم AutoCAD", en: "CAD" },
  PLANNING: { ar: "تخطيط", en: "Planning" },
  PERMIT: { ar: "تصريح", en: "Permit" },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "buildings" | "documents" | "maintenance" | "concepts" | "subdivision" | "approvals" | "infrastructure" | "inventory" | "pricing" | "launch" | "readiness" | "map" | "analytics" | "financials">("overview");
  const [maintenanceRequests, setMaintenanceRequests] = React.useState<any[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = React.useState(false);

  // Off-plan state
  const [conceptPlans, setConceptPlans] = React.useState<any[]>([]);
  const [subdivisionPlans, setSubdivisionPlans] = React.useState<any[]>([]);
  const [approvalSubmissions, setApprovalSubmissions] = React.useState<any[]>([]);
  const [showConceptModal, setShowConceptModal] = React.useState(false);
  const [showSubdivisionModal, setShowSubdivisionModal] = React.useState(false);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [selectedSubPlan, setSelectedSubPlan] = React.useState<any>(null);
  const [loadingOffPlan, setLoadingOffPlan] = React.useState(false);

  // Phase 3 state
  const [infraItems, setInfraItems] = React.useState<any[]>([]);
  const [infraScore, setInfraScore] = React.useState<any>(null);
  const [inventoryItems, setInventoryItems] = React.useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = React.useState<any>(null);
  const [pricingRules, setPricingRules] = React.useState<any[]>([]);
  const [pricingSummary, setPricingSummary] = React.useState<any>(null);
  const [launchWaves, setLaunchWaves] = React.useState<any[]>([]);
  const [showInfraModal, setShowInfraModal] = React.useState(false);
  const [showInventoryModal, setShowInventoryModal] = React.useState(false);
  const [showPricingModal, setShowPricingModal] = React.useState(false);
  const [showWaveModal, setShowWaveModal] = React.useState(false);
  const [selectedInvItems, setSelectedInvItems] = React.useState<Set<string>>(new Set());

  // Phase 4 state
  const [readinessChecklist, setReadinessChecklist] = React.useState<any[]>([]);
  const [loadingReadiness, setLoadingReadiness] = React.useState(false);
  const [mapInventory, setMapInventory] = React.useState<any[]>([]);
  const [loadingMap, setLoadingMap] = React.useState(false);
  const [analyticsData, setAnalyticsData] = React.useState<{ pricing: any; waves: any; sales: any } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(false);

  // Project financials (G10b)
  const [projectFinancials, setProjectFinancials] = React.useState<any>(null);
  const [loadingFinancials, setLoadingFinancials] = React.useState(false);

  // Linked planning workspace
  const [linkedWorkspace, setLinkedWorkspace] = React.useState<any>(null);

  // Building form state
  const [showBuildingForm, setShowBuildingForm] = React.useState(false);
  const [editingBuildingId, setEditingBuildingId] = React.useState<string | null>(null);
  const [buildingForm, setBuildingForm] = React.useState({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential" });
  const [savingBuilding, setSavingBuilding] = React.useState(false);

  // Document upload & filter
  const [uploadCategory, setUploadCategory] = React.useState("LEGAL");
  const [docFilterCategory, setDocFilterCategory] = React.useState("ALL");
  const [versionUploadDocId, setVersionUploadDocId] = React.useState<string | null>(null);

  React.useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [data, workspaces] = await Promise.all([
        getProjectDetail(id as string),
        getLinkedWorkspaces(id as string).catch(() => []),
      ]);
      setProject(data);
      setLinkedWorkspace(workspaces?.[0] || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSaveBuilding() {
    if (!buildingForm.name) return;
    setSavingBuilding(true);
    try {
      if (editingBuildingId) {
        await updateBuilding(editingBuildingId, {
          name: buildingForm.name,
          numberOfFloors: buildingForm.numberOfFloors ? parseInt(buildingForm.numberOfFloors) : undefined,
          buildingAreaSqm: buildingForm.buildingAreaSqm ? parseFloat(buildingForm.buildingAreaSqm) : undefined,
          buildingType: buildingForm.buildingType,
        });
      } else {
        await createBuilding({
          projectId: id as string,
          name: buildingForm.name,
          numberOfFloors: buildingForm.numberOfFloors ? parseInt(buildingForm.numberOfFloors) : undefined,
          buildingAreaSqm: buildingForm.buildingAreaSqm ? parseFloat(buildingForm.buildingAreaSqm) : undefined,
          buildingType: buildingForm.buildingType,
        });
      }
      setShowBuildingForm(false);
      setEditingBuildingId(null);
      setBuildingForm({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential" });
      await load();
    } catch (e) { console.error(e); }
    finally { setSavingBuilding(false); }
  }

  async function handleDeleteBuilding(buildingId: string) {
    try {
      await deleteBuilding(buildingId);
      await load();
    } catch (e) { console.error(e); }
  }

  async function handleUploadComplete(res: any) {
    for (const file of res) {
      await registerProjectDocument({
        projectId: id as string,
        name: file.name,
        url: file.url ?? file.ufsUrl,
        type: file.name.split(".").pop() || "unknown",
        size: file.size,
        category: uploadCategory as any,
      });
    }
    await load();
  }

  async function handleDeleteDoc(docId: string) {
    try {
      await deleteProjectDocument(docId);
      await load();
    } catch (e) { console.error(e); }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      // G7: Route status transitions through decision gates
      await requestStageTransition({
        projectId: id as string,
        toStage: newStatus,
        notes: `Requested transition to ${statusMap[newStatus]?.en || newStatus}`,
      });
      // The gate was auto-approved (or created as pending)
      await load();
    } catch (e: any) {
      // Fallback: if decision gate system fails (e.g. transition not in valid map),
      // fall back to direct update for legacy statuses
      if (e?.message?.includes("Invalid stage transition")) {
        try {
          await updateProject(id as string, { status: newStatus });
          await load();
        } catch (e2) { console.error(e2); }
      } else {
        console.error(e);
        alert(e?.message || "Status transition failed");
      }
    }

    // G8: If transitioning to HANDED_OVER, offer maintenance setup
    if (newStatus === "HANDED_OVER") {
      const doSetup = confirm(
        lang === "ar"
          ? "هل تريد إعداد خطط الصيانة الوقائية لجميع الوحدات؟"
          : "Set up preventive maintenance plans for all units?"
      );
      if (doSetup) {
        try {
          const result = await setupPostHandoverMaintenance(id as string);
          alert(
            lang === "ar"
              ? `تم إنشاء ${result.plansCreated} خطة صيانة لـ ${result.unitsProcessed} وحدة`
              : `Created ${result.plansCreated} maintenance plans for ${result.unitsProcessed} units`
          );
        } catch (e) { console.error(e); }
      }
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">لم يتم العثور على المشروع</div>;

  const status = statusMap[project.status] ?? { ar: project.status, en: project.status, variant: "draft" };
  const type = typeLabels[project.type] ?? { ar: project.type, en: project.type };
  const totalUnits = project.buildings?.reduce((sum: number, b: any) => sum + (b.units?.length ?? 0), 0) ?? 0;
  const inputClass = "w-full h-10 px-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  const maintenanceStatusLabels: Record<string, { ar: string; en: string; variant: string }> = {
    OPEN: { ar: "مفتوح", en: "Open", variant: "draft" },
    ASSIGNED: { ar: "معيّن", en: "Assigned", variant: "reserved" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", variant: "reserved" },
    ON_HOLD: { ar: "معلّق", en: "On Hold", variant: "maintenance" },
    RESOLVED: { ar: "تم الحل", en: "Resolved", variant: "available" },
    CLOSED: { ar: "مغلق", en: "Closed", variant: "sold" },
  };

  const maintenancePriorityLabels: Record<string, { ar: string; en: string; color: string }> = {
    LOW: { ar: "منخفض", en: "Low", color: "text-muted-foreground" },
    MEDIUM: { ar: "متوسط", en: "Medium", color: "text-primary" },
    HIGH: { ar: "عالي", en: "High", color: "text-amber-500" },
    URGENT: { ar: "عاجل", en: "Urgent", color: "text-red-600" },
  };

  async function loadMaintenance() {
    setLoadingMaintenance(true);
    try {
      const data = await getMaintenanceForProject(id as string);
      setMaintenanceRequests(data);
    } catch (e) { console.error(e); }
    finally { setLoadingMaintenance(false); }
  }

  async function loadConceptPlans() {
    setLoadingOffPlan(true);
    try {
      const data = await getConceptPlans(id as string);
      setConceptPlans(data);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadSubdivisionPlans() {
    setLoadingOffPlan(true);
    try {
      const data = await getSubdivisionPlans(id as string);
      setSubdivisionPlans(data);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadApprovals() {
    setLoadingOffPlan(true);
    try {
      const data = await getApprovalSubmissions(id as string);
      setApprovalSubmissions(data);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadInfrastructure() {
    setLoadingOffPlan(true);
    try {
      const [items, score] = await Promise.all([
        getInfrastructureItems(id as string),
        getOverallReadinessScore(id as string),
      ]);
      setInfraItems(items);
      setInfraScore(score);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadInventory() {
    setLoadingOffPlan(true);
    try {
      const [items, stats] = await Promise.all([
        getInventoryItems(id as string),
        getInventoryStats(id as string),
      ]);
      setInventoryItems(items);
      setInventoryStats(stats);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadPricing() {
    setLoadingOffPlan(true);
    try {
      const [rules, summary] = await Promise.all([
        getPricingRules(id as string),
        getPricingSummary(id as string),
      ]);
      setPricingRules(rules);
      setPricingSummary(summary);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadWaves() {
    setLoadingOffPlan(true);
    try {
      const data = await getLaunchWaves(id as string);
      setLaunchWaves(data);
    } catch (e) { console.error(e); }
    finally { setLoadingOffPlan(false); }
  }

  async function loadReadiness() {
    setLoadingReadiness(true);
    try {
      const data = await getLaunchReadinessChecklist(id as string);
      setReadinessChecklist(data);
    } catch (e) { console.error(e); }
    finally { setLoadingReadiness(false); }
  }

  async function loadMapInventory() {
    setLoadingMap(true);
    try {
      const items = await import("../../../actions/launch").then((m) => m.getMapInventory(id as string));
      setMapInventory(items);
    } catch (e) { console.error(e); }
    finally { setLoadingMap(false); }
  }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      const [pricing, waves, sales] = await Promise.all([
        getPricingAnalytics(id as string),
        getWavePerformance(id as string),
        getSalesTracking(id as string),
      ]);
      setAnalyticsData({ pricing, waves, sales });
    } catch (e) { console.error(e); }
    finally { setLoadingAnalytics(false); }
  }

  async function loadFinancials() {
    setLoadingFinancials(true);
    try {
      const data = await getProjectFinancials(id as string);
      setProjectFinancials(data);
    } catch (e) { console.error(e); }
    finally { setLoadingFinancials(false); }
  }

  function handleTabChange(tabId: typeof activeTab) {
    setActiveTab(tabId);
    if (tabId === "maintenance" && maintenanceRequests.length === 0) loadMaintenance();
    if (tabId === "concepts" && conceptPlans.length === 0) loadConceptPlans();
    if (tabId === "subdivision" && subdivisionPlans.length === 0) loadSubdivisionPlans();
    if (tabId === "approvals" && approvalSubmissions.length === 0) loadApprovals();
    if (tabId === "infrastructure" && infraItems.length === 0) loadInfrastructure();
    if (tabId === "inventory" && inventoryItems.length === 0) loadInventory();
    if (tabId === "pricing" && pricingRules.length === 0) loadPricing();
    if (tabId === "launch" && launchWaves.length === 0) loadWaves();
    if (tabId === "readiness" && readinessChecklist.length === 0) loadReadiness();
    if (tabId === "map" && mapInventory.length === 0) loadMapInventory();
    if (tabId === "analytics" && !analyticsData) loadAnalytics();
    if (tabId === "financials" && !projectFinancials) loadFinancials();
  }

  // Determine if project is in the off-plan lifecycle
  const offPlanStatuses = ["LAND_ACQUIRED", "CONCEPT_DESIGN", "SUBDIVISION_PLANNING", "AUTHORITY_SUBMISSION", "INFRASTRUCTURE_PLANNING", "INVENTORY_STRUCTURING", "PRICING_PACKAGING", "LAUNCH_READINESS", "OFF_PLAN_LAUNCHED"];
  const isOffPlan = offPlanStatuses.includes(project?.status);

  const tabs = [
    { id: "overview" as const, label: { ar: "نظرة عامة", en: "Overview" } },
    { id: "buildings" as const, label: { ar: "المباني", en: "Buildings" } },
    { id: "documents" as const, label: { ar: "الوثائق", en: "Documents" } },
    { id: "maintenance" as const, label: { ar: "الصيانة", en: "Maintenance" } },
    { id: "financials" as const, label: { ar: "المالية", en: "Financials" } },
    ...(isOffPlan ? [
      { id: "concepts" as const, label: { ar: "المخطط المبدئي", en: "Concepts" } },
      { id: "subdivision" as const, label: { ar: "التقسيم", en: "Subdivision" } },
      { id: "approvals" as const, label: { ar: "الموافقات", en: "Approvals" } },
      { id: "infrastructure" as const, label: { ar: "البنية التحتية", en: "Infrastructure" } },
      { id: "inventory" as const, label: { ar: "المخزون", en: "Inventory" } },
      { id: "pricing" as const, label: { ar: "التسعير", en: "Pricing" } },
      { id: "launch" as const, label: { ar: "الإطلاق", en: "Launch" } },
      { id: "readiness" as const, label: { ar: "جاهزية الإطلاق", en: "Readiness" } },
      { id: "map" as const, label: { ar: "خريطة المخزون", en: "Map" } },
      { id: "analytics" as const, label: { ar: "التحليلات", en: "Analytics" } },
    ] : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects")}>
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground truncate">{project.name}</h1>
            <Badge variant={status.variant as any} className="text-xs">{status[lang]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {type[lang]}
            {project.city || project.district ? ` • ${[project.district, project.city].filter(Boolean).join("، ")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={async () => {
              try {
                if (linkedWorkspace) {
                  router.push(`/dashboard/planning/${linkedWorkspace.id}`);
                } else {
                  const ws = await createWorkspaceFromProject(id as string);
                  setLinkedWorkspace(ws);
                  router.push(`/dashboard/planning/${ws.id}`);
                }
              } catch { /* permission denied — button hidden for non-planners */ }
            }}
          >
            <Compass className="h-3.5 w-3.5" />
            {linkedWorkspace
              ? (lang === "ar" ? "عرض التخطيط" : "View Planning")
              : (lang === "ar" ? "فتح في التخطيط" : "Open in Planning")}
          </Button>
          <Link href={`/dashboard/units?project=${id}`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <Building2 className="h-3.5 w-3.5" />
              {lang === "ar" ? "عرض الوحدات" : "View Units"}
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/governance`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              {lang === "ar" ? "الحوكمة" : "Governance"}
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/tree`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <LayoutGrid className="h-3.5 w-3.5" />
              {lang === "ar" ? "هيكل المشروع" : "Project Tree"}
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/site-logs`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <ClipboardList className="h-3.5 w-3.5" />
              {lang === "ar" ? "سجلات الموقع" : "Site Logs"}
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/wafi`}>
            <Button variant="success" size="sm" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              {lang === "ar" ? "امتثال وافي" : "Wafi Compliance"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Actions */}
      {project.status === "PLANNING" && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
            <Button size="sm" onClick={() => handleStatusChange("UNDER_CONSTRUCTION")} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {lang === "ar" ? "بدء الإنشاء" : "Start Construction"}
            </Button>
          </div>
        </Card>
      )}
      {project.status === "UNDER_CONSTRUCTION" && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
            <Button size="sm" onClick={() => handleStatusChange("READY")} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {lang === "ar" ? "جاهز للتسليم" : "Mark Ready"}
            </Button>
          </div>
        </Card>
      )}
      {project.status === "READY" && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
            <Button size="sm" onClick={() => handleStatusChange("HANDED_OVER")} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {lang === "ar" ? "تم التسليم" : "Mark Handed Over"}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label[lang]}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Lifecycle Stepper */}
          <ProjectLifecycleStepper currentStatus={project.status} lang={lang} />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: lang === "ar" ? "المساحة" : "Area", value: project.totalAreaSqm ? `${fmt(project.totalAreaSqm)} م²` : "—" },
              { label: lang === "ar" ? "رقم الصك" : "Deed #", value: project.deedNumber || "—" },
              { label: lang === "ar" ? "المباني" : "Buildings", value: `${project.buildings?.length ?? 0}` },
              { label: lang === "ar" ? "الوحدات" : "Units", value: `${totalUnits}` },
            ].map((item, i) => (
              <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.label}</span>
                <p className="text-lg font-bold text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Extra Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-md shadow-card border border-border p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {lang === "ar" ? "بيانات الأرض" : "Land Data"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label={lang === "ar" ? "رقم القطعة" : "Parcel #"} value={project.parcelNumber} />
                <InfoRow label={lang === "ar" ? "رقم المخطط" : "Plot #"} value={project.plotNumber} />
                <InfoRow label={lang === "ar" ? "رقم البلك" : "Block #"} value={project.blockNumber} />
                <InfoRow label={lang === "ar" ? "الاستخدام" : "Land Use"} value={project.landUse} />
                <InfoRow label={lang === "ar" ? "المنطقة" : "Region"} value={project.region} />
                <InfoRow label={lang === "ar" ? "الشارع" : "Street"} value={project.streetName} />
                {project.estimatedValueSar && (
                  <InfoRow label={lang === "ar" ? "القيمة التقديرية" : "Est. Value"} value={<SARAmount value={Number(project.estimatedValueSar)} size={12} />} />
                )}
                <InfoRow label={lang === "ar" ? "تاريخ الإنشاء" : "Created"} value={formatDualDate(project.createdAt, lang)} />
              </div>
              {project.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-card rounded-md shadow-card border border-border p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {lang === "ar" ? "الموقع" : "Location"}
              </h4>
              {project.latitude && project.longitude ? (
                <>
                  <MapPicker latitude={project.latitude} longitude={project.longitude} readonly height="220px" zoom={14} />
                  <p className="text-[10px] text-muted-foreground" dir="ltr">
                    {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center h-[220px] bg-muted/10 rounded-md text-muted-foreground text-sm">
                  <MapPin className="h-6 w-6 opacity-30 ml-2" />
                  {lang === "ar" ? "لم يتم تحديد الموقع" : "No location set"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Buildings Tab ─── */}
      {activeTab === "buildings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {project.buildings?.length ?? 0} {lang === "ar" ? "مبنى" : "buildings"} • {totalUnits} {lang === "ar" ? "وحدة" : "units"}
            </p>
            <div className="flex items-center gap-2">
              {subdivisionPlans.length > 0 && (project.buildings?.length ?? 0) === 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    try {
                      const plan = subdivisionPlans[0];
                      const result = await generateBuildingsFromPlots(id as string, plan.id);
                      alert(lang === "ar"
                        ? `تم إنشاء ${result.buildingsCreated} مبنى و ${result.unitsCreated} وحدة`
                        : `Created ${result.buildingsCreated} buildings and ${result.unitsCreated} units`);
                      await load();
                    } catch (e: any) {
                      console.error(e);
                      alert(e?.message || "Error generating buildings");
                    }
                  }}
                  style={{ display: "inline-flex" }}
                >
                  <Zap className="h-4 w-4" />
                  {lang === "ar" ? "إنشاء من المخطط" : "Generate from Plan"}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingBuildingId(null);
                  setBuildingForm({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential" });
                  setShowBuildingForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {lang === "ar" ? "إضافة مبنى" : "Add Building"}
              </Button>
            </div>
          </div>

          {/* Building Form */}
          {showBuildingForm && (
            <div className="border border-secondary/30 bg-secondary/5 rounded-md p-5 space-y-4">
              <h4 className="text-xs font-bold text-secondary">
                {editingBuildingId ? (lang === "ar" ? "تعديل المبنى" : "Edit Building") : (lang === "ar" ? "مبنى جديد" : "New Building")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "اسم المبنى *" : "Building Name *"}</label>
                  <input value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "نوع المبنى" : "Type"}</label>
                  <select value={buildingForm.buildingType} onChange={(e) => setBuildingForm({ ...buildingForm, buildingType: e.target.value })} className={inputClass}>
                    {Object.entries(buildingTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v[lang]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "عدد الأدوار" : "Floors"}</label>
                  <input type="number" value={buildingForm.numberOfFloors} onChange={(e) => setBuildingForm({ ...buildingForm, numberOfFloors: e.target.value })} className={inputClass} min="1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
                  <input type="number" value={buildingForm.buildingAreaSqm} onChange={(e) => setBuildingForm({ ...buildingForm, buildingAreaSqm: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" onClick={handleSaveBuilding} disabled={!buildingForm.name || savingBuilding}>
                  {savingBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {editingBuildingId ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إضافة" : "Add")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowBuildingForm(false); setEditingBuildingId(null); }}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          )}

          {/* Building Cards */}
          {(!project.buildings || project.buildings.length === 0) && !showBuildingForm && (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد مباني" : "No Buildings"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أضف أول مبنى للمشروع" : "Add the first building to this project"}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.buildings?.map((b: any) => (
              <div key={b.id} className="bg-card rounded-md shadow-card border border-border p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {buildingTypeLabels[b.buildingType]?.[lang] ?? b.buildingType ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBuildingId(b.id);
                        setBuildingForm({
                          name: b.name,
                          numberOfFloors: b.numberOfFloors?.toString() ?? "",
                          buildingAreaSqm: b.buildingAreaSqm?.toString() ?? "",
                          buildingType: b.buildingType ?? "residential",
                        });
                        setShowBuildingForm(true);
                      }}
                     
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteBuilding(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "أدوار" : "Floors"}</p>
                    <p className="font-bold text-foreground">{b.numberOfFloors ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "المساحة" : "Area"}</p>
                    <p className="font-bold text-foreground">{b.buildingAreaSqm ? `${fmt(b.buildingAreaSqm)} م²` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "وحدات" : "Units"}</p>
                    <p className="font-bold text-foreground">{b.units?.length ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Maintenance Tab ─── */}
      {activeTab === "maintenance" && (
        <div className="space-y-6">
          {/* KPI Summary */}
          {!loadingMaintenance && maintenanceRequests.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: lang === "ar" ? "مفتوحة" : "Open", value: maintenanceRequests.filter((m: any) => m.status === "OPEN").length, color: "text-amber-500" },
                { label: lang === "ar" ? "قيد التنفيذ" : "In Progress", value: maintenanceRequests.filter((m: any) => ["IN_PROGRESS", "ASSIGNED"].includes(m.status)).length, color: "text-primary" },
                { label: lang === "ar" ? "تم الحل" : "Resolved", value: maintenanceRequests.filter((m: any) => ["RESOLVED", "CLOSED"].includes(m.status)).length, color: "text-secondary" },
                { label: lang === "ar" ? "الإجمالي" : "Total", value: maintenanceRequests.length, color: "text-muted-foreground" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</span>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {maintenanceRequests.length} {lang === "ar" ? "طلب صيانة" : "maintenance requests"}
            </p>
            <Link href="/dashboard/maintenance">
              <Button variant="secondary" size="sm" className="gap-2">
                <Wrench className="h-3.5 w-3.5" />
                {lang === "ar" ? "إدارة الصيانة" : "Manage Maintenance"}
              </Button>
            </Link>
          </div>

          {loadingMaintenance ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد طلبات صيانة" : "No Maintenance Requests"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "لا توجد طلبات صيانة مرتبطة بهذا المشروع" : "No maintenance requests linked to this project"}</p>
            </div>
          ) : (
            <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "العنوان" : "Title"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الوحدة" : "Unit"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الأولوية" : "Priority"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "المُعيَّن" : "Assigned"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRequests.map((m: any) => {
                    const mStatus = maintenanceStatusLabels[m.status] ?? { ar: m.status, en: m.status, variant: "draft" };
                    const mPriority = maintenancePriorityLabels[m.priority] ?? { ar: m.priority, en: m.priority, color: "text-muted-foreground" };
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/maintenance/${m.id}`} className="font-medium text-foreground hover:text-secondary transition-colors">
                            {m.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.unit?.number} — {m.unit?.building?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${mPriority.color}`}>{mPriority[lang]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={mStatus.variant as any} className="text-[10px]">{mStatus[lang]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.assignedTo?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("en-SA")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Documents Tab ─── */}
      {activeTab === "documents" && (() => {
        const allDocs = project.documents || [];
        const filteredDocs = docFilterCategory === "ALL" ? allDocs : allDocs.filter((d: any) => d.category === docFilterCategory);
        return (
        <div className="space-y-6">
          {/* Toolbar: filter + upload */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredDocs.length} {lang === "ar" ? "وثيقة" : "documents"}
                {docFilterCategory !== "ALL" && ` (${docCategoryLabels[docFilterCategory]?.[lang]})`}
              </p>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select value={docFilterCategory} onChange={(e) => setDocFilterCategory(e.target.value)} className="border border-border rounded-md px-2 py-1 text-xs bg-card">
                  <option value="ALL">{lang === "ar" ? "الكل" : "All"}</option>
                  {Object.entries(docCategoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-xs bg-card">
                {Object.entries(docCategoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v[lang]}</option>
                ))}
              </select>
              <UploadButton
                endpoint="projectDocumentUploader"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => console.error(error.message)}
                appearance={{
                  button: "bg-secondary hover:bg-green-bright text-white text-xs font-bold gap-2 flex h-8 px-4 rounded-md",
                  allowedContent: "hidden",
                }}
                content={{
                  button: (
                    <div className="flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      {lang === "ar" ? "رفع وثيقة" : "Upload"}
                    </div>
                  ),
                }}
              />
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد وثائق" : "No Documents"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "ارفع وثائق بلدي والمستندات المطلوبة" : "Upload Balady documents and required files"}</p>
            </div>
          ) : (
            <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "الاسم" : "Name"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "التصنيف" : "Category"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "الإصدار" : "Version"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc: any) => (
                    <React.Fragment key={doc.id}>
                      <tr className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-secondary min-w-[16px]" />
                            <span className="font-medium text-foreground truncate max-w-[200px]">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{doc.type}</td>
                        <td className="px-4 py-3">
                          <Badge variant="draft" className="text-[10px]">{docCategoryLabels[doc.category]?.[lang] ?? doc.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                            style={{ display: "inline-flex" }}
                            onClick={() => setVersionUploadDocId(versionUploadDocId === doc.id ? null : doc.id)}
                          >
                            <span className="font-bold">v{doc.version || 1}</span>
                            {(doc.versions?.length > 0) && (
                              <History className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDualDate(doc.createdAt, lang)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                            <UploadButton
                              endpoint="projectDocumentUploader"
                              onClientUploadComplete={async (res: any) => {
                                if (res?.[0]) {
                                  await uploadDocumentVersion({
                                    documentId: doc.id,
                                    url: res[0].url ?? res[0].ufsUrl,
                                    size: res[0].size,
                                    changeNote: `v${(doc.version || 1) + 1}`,
                                  });
                                  await load();
                                }
                              }}
                              onUploadError={(error: Error) => console.error(error.message)}
                              appearance={{
                                button: "bg-transparent hover:bg-muted text-muted-foreground hover:text-primary h-7 w-7 p-0 rounded-md flex items-center justify-center",
                                allowedContent: "hidden",
                              }}
                              content={{
                                button: <Upload className="h-3.5 w-3.5" />,
                              }}
                            />
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteDoc(doc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {/* Version history expand */}
                      {versionUploadDocId === doc.id && doc.versions?.length > 0 && (
                        doc.versions.map((v: any) => (
                          <tr key={v.id} className="bg-muted/20 border-b border-border last:border-0">
                            <td className="px-4 py-2 ps-10" colSpan={2}>
                              <span className="text-xs text-muted-foreground">{v.changeNote || `v${v.versionNumber}`}</span>
                            </td>
                            <td className="px-4 py-2" colSpan={2}>
                              <span className="text-[10px] text-muted-foreground">v{v.versionNumber}</span>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground">{formatDualDate(v.createdAt, lang)}</td>
                            <td className="px-4 py-2">
                              <a href={v.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        );
      })()}

      {/* ─── Concept Plans Tab ─── */}
      {activeTab === "concepts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {conceptPlans.length} {lang === "ar" ? "مخطط مبدئي" : "concept plans"}
            </p>
            <Button size="sm" className="gap-2" onClick={() => setShowConceptModal(true)}>
              <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة مخطط" : "Add Concept"}
            </Button>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : conceptPlans.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد مخططات مبدئية" : "No Concept Plans"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أنشئ بدائل تصميمية لمقارنتها" : "Create design alternatives for comparison"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conceptPlans.map((cp: any) => {
                const statusColors: Record<string, string> = {
                  DRAFT: "bg-muted text-muted-foreground",
                  UNDER_REVIEW: "bg-amber-500/15 text-amber-700",
                  APPROVED: "bg-secondary/15 text-secondary",
                  REJECTED: "bg-destructive/15 text-destructive",
                };
                return (
                  <div key={cp.id} className={`bg-card rounded-md shadow-card border ${cp.isSelected ? "border-secondary border-2" : "border-border"} p-5`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {cp.isSelected && <Star className="h-4 w-4 text-secondary" />}
                        <span className="text-sm font-bold text-foreground">{cp.name}</span>
                        <Badge className={`text-[10px] ${statusColors[cp.status] ?? "bg-muted text-muted-foreground"}`}>
                          {cp.status === "DRAFT" ? (lang === "ar" ? "مسودة" : "Draft") :
                           cp.status === "UNDER_REVIEW" ? (lang === "ar" ? "مراجعة" : "Review") :
                           cp.status === "APPROVED" ? (lang === "ar" ? "معتمد" : "Approved") :
                           (lang === "ar" ? "مرفوض" : "Rejected")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {!cp.isSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-secondary text-xs"
                            onClick={async () => { await selectConceptPlan(cp.id); loadConceptPlans(); }}
                           
                          >
                            <Star className="h-3.5 w-3.5" />{lang === "ar" ? "اختيار" : "Select"}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={async () => { await deleteConceptPlan(cp.id); loadConceptPlans(); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {cp.description && <p className="text-xs text-muted-foreground mb-3">{cp.description}</p>}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "القطع" : "Plots"}</p>
                        <p className="font-bold text-foreground">{cp.totalPlots ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">GFA</p>
                        <p className="font-bold text-foreground">{cp.totalGfaSqm ? `${fmt(cp.totalGfaSqm)} م²` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">FAR</p>
                        <p className="font-bold text-foreground">{cp.farRatio ?? "—"}</p>
                      </div>
                    </div>
                    {cp.openSpacePct && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {lang === "ar" ? "المساحات المفتوحة:" : "Open Space:"} {cp.openSpacePct}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showConceptModal && (
            <ConceptPlanModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowConceptModal(false)}
              onSuccess={() => { setShowConceptModal(false); loadConceptPlans(); }}
            />
          )}
        </div>
      )}

      {/* ─── Subdivision Tab ─── */}
      {activeTab === "subdivision" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {subdivisionPlans.length} {lang === "ar" ? "مخطط تقسيم" : "subdivision plans"}
            </p>
            <Button size="sm" className="gap-2" onClick={() => setShowSubdivisionModal(true)}>
              <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة مخطط" : "Add Plan"}
            </Button>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : subdivisionPlans.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد مخططات تقسيم" : "No Subdivision Plans"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أنشئ مخطط تقسيم للأرض" : "Create a subdivision plan for the land"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subdivisionPlans.map((sp: any) => {
                const planStatusColors: Record<string, string> = {
                  DRAFT: "bg-muted text-muted-foreground",
                  UNDER_REVIEW: "bg-amber-500/15 text-amber-700",
                  APPROVED: "bg-secondary/15 text-secondary",
                  SUPERSEDED: "bg-neutral/15 text-muted-foreground",
                };
                return (
                  <div key={sp.id} className="bg-card rounded-md shadow-card border border-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{sp.name}</span>
                          <Badge className={`text-[10px] ${planStatusColors[sp.status] ?? "bg-muted text-muted-foreground"}`}>
                            v{sp.version} · {sp.status === "DRAFT" ? (lang === "ar" ? "مسودة" : "Draft") :
                             sp.status === "UNDER_REVIEW" ? (lang === "ar" ? "مراجعة" : "Review") :
                             sp.status === "APPROVED" ? (lang === "ar" ? "معتمد" : "Approved") :
                             (lang === "ar" ? "ملغى" : "Superseded")}
                          </Badge>
                        </div>
                        {sp.nameArabic && <p className="text-xs text-muted-foreground mt-0.5">{sp.nameArabic}</p>}
                      </div>
                      <Link href={`/dashboard/projects/${id}/subdivision/${sp.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs gap-1">
                          <Eye className="h-3.5 w-3.5" />{lang === "ar" ? "عرض" : "View"}
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "القطع" : "Plots"}</p>
                        <p className="font-bold text-foreground">{sp._count?.plots ?? sp.plotCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "البلكات" : "Blocks"}</p>
                        <p className="font-bold text-foreground">{sp._count?.blocks ?? sp.blockCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "الطرق" : "Roads"}</p>
                        <p className="font-bold text-foreground">{sp._count?.roads ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "المساحة" : "Area"}</p>
                        <p className="font-bold text-foreground">{sp.totalAreaSqm ? `${fmt(sp.totalAreaSqm)} م²` : "—"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showSubdivisionModal && (
            <SubdivisionPlanModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowSubdivisionModal(false)}
              onSuccess={() => { setShowSubdivisionModal(false); loadSubdivisionPlans(); }}
            />
          )}
        </div>
      )}

      {/* ─── Approvals Tab ─── */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {approvalSubmissions.length} {lang === "ar" ? "طلب موافقة" : "approval submissions"}
            </p>
            <Button size="sm" className="gap-2" onClick={() => setShowApprovalModal(true)}>
              <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "تقديم طلب" : "New Submission"}
            </Button>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : approvalSubmissions.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد طلبات موافقة" : "No Approvals"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "قدّم طلبات للجهات الحكومية" : "Submit applications to authorities"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalSubmissions.map((sub: any) => {
                const approvalStatusConfig: Record<string, { ar: string; en: string; color: string }> = {
                  DRAFT_APPROVAL: { ar: "مسودة", en: "Draft", color: "bg-muted text-muted-foreground" },
                  SUBMITTED: { ar: "مقدّم", en: "Submitted", color: "bg-info/15 text-info" },
                  UNDER_REVIEW_APPROVAL: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-500/15 text-amber-700" },
                  APPROVED_WITH_CONDITIONS: { ar: "موافق بشروط", en: "Conditional", color: "bg-amber-500/15 text-amber-700" },
                  APPROVED_FINAL: { ar: "موافق", en: "Approved", color: "bg-secondary/15 text-secondary" },
                  REJECTED_APPROVAL: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/15 text-destructive" },
                  RESUBMISSION_REQUIRED: { ar: "يحتاج إعادة تقديم", en: "Resubmission", color: "bg-warning/15 text-warning" },
                };
                const approvalTypeLabels: Record<string, { ar: string; en: string }> = {
                  SUBDIVISION_APPROVAL: { ar: "اعتماد تقسيم", en: "Subdivision" },
                  BUILDING_PERMIT: { ar: "رخصة بناء", en: "Building Permit" },
                  INFRASTRUCTURE_PERMIT: { ar: "رخصة بنية تحتية", en: "Infrastructure" },
                  ENVIRONMENTAL_CLEARANCE: { ar: "تصريح بيئي", en: "Environmental" },
                  UTILITY_CONNECTION: { ar: "ربط مرافق", en: "Utility" },
                  SALES_LICENSE: { ar: "رخصة بيع", en: "Sales License" },
                  OTHER_APPROVAL: { ar: "أخرى", en: "Other" },
                };
                const sc = (approvalStatusConfig[sub.status] ?? approvalStatusConfig.DRAFT_APPROVAL)!;
                const typeLabel = (approvalTypeLabels[sub.type] ?? { ar: sub.type, en: sub.type });
                return (
                  <div key={sub.id} className="bg-card rounded-md shadow-card border border-border p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">{sub.authority}</span>
                          <Badge className={`text-[10px] ${sc.color}`}>{sc[lang]}</Badge>
                          <Badge className="text-[10px] bg-muted text-muted-foreground">{typeLabel[lang]}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sub.referenceNumber && <span>#{sub.referenceNumber} · </span>}
                          {lang === "ar" ? "مراجعة" : "Rev"} {sub.revisionNumber}
                          {sub.submittedAt && <span> · {new Date(sub.submittedAt).toLocaleDateString("ar-SA")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.status === "DRAFT_APPROVAL" && (
                          <Button
                            size="sm"
                            className="text-xs gap-1"
                            onClick={async () => { await submitApproval(sub.id); loadApprovals(); }}
                           
                          >
                            <ShieldCheck className="h-3 w-3" />{lang === "ar" ? "تقديم" : "Submit"}
                          </Button>
                        )}
                        {sub.status === "DRAFT_APPROVAL" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={async () => { await deleteApprovalSubmission(sub.id); loadApprovals(); }}
                           
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>{sub._count?.comments ?? 0} {lang === "ar" ? "تعليق" : "comments"}</span>
                      <span>{sub._count?.conditions ?? 0} {lang === "ar" ? "شرط" : "conditions"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showApprovalModal && (
            <ApprovalSubmissionModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowApprovalModal(false)}
              onSuccess={() => { setShowApprovalModal(false); loadApprovals(); }}
            />
          )}
        </div>
      )}

      {/* ─── Infrastructure Tab ─── */}
      {activeTab === "infrastructure" && (
        <div className="space-y-6">
          {/* Readiness Score Summary */}
          {infraScore && infraScore.totalCategories > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: lang === "ar" ? "الجاهزية الكلية" : "Overall Score", value: `${infraScore.overallScore}%`, color: infraScore.overallScore >= 70 ? "text-secondary" : infraScore.overallScore >= 40 ? "text-amber-600" : "text-destructive" },
                { label: lang === "ar" ? "مكتملة" : "Completed", value: infraScore.completed, color: "text-secondary" },
                { label: lang === "ar" ? "قيد التنفيذ" : "In Progress", value: infraScore.inProgress, color: "text-primary" },
                { label: lang === "ar" ? "متأخرة" : "Delayed", value: infraScore.delayed, color: infraScore.delayed > 0 ? "text-destructive" : "text-muted-foreground" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</span>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {infraItems.length} {lang === "ar" ? "فئة بنية تحتية" : "infrastructure categories"}
            </p>
            <button
              onClick={() => setShowInfraModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-all"
             
            >
              <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة فئة" : "Add Category"}
            </button>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : infraItems.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <HardHat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد بنية تحتية" : "No Infrastructure"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أضف فئات البنية التحتية لتتبع الجاهزية" : "Add infrastructure categories to track readiness"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infraItems.map((item: any) => {
                const infraCategoryLabels: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
                  ELECTRICITY_INFRA: { ar: "الكهرباء", en: "Electricity", icon: <Zap className="h-[18px] w-[18px]" /> },
                  WATER_INFRA: { ar: "المياه", en: "Water", icon: <Droplets className="h-[18px] w-[18px]" /> },
                  SEWAGE_INFRA: { ar: "الصرف الصحي", en: "Sewage", icon: <Droplets className="h-[18px] w-[18px]" /> },
                  TELECOM_INFRA: { ar: "الاتصالات", en: "Telecom", icon: <Wifi className="h-[18px] w-[18px]" /> },
                  ROADS_INFRA: { ar: "الطرق", en: "Roads", icon: <Car className="h-[18px] w-[18px]" /> },
                  STORMWATER_INFRA: { ar: "تصريف الأمطار", en: "Stormwater", icon: <CloudRain className="h-[18px] w-[18px]" /> },
                  LANDSCAPING_INFRA: { ar: "التشجير", en: "Landscaping", icon: <TreePine className="h-[18px] w-[18px]" /> },
                  FENCING_INFRA: { ar: "التسوير", en: "Fencing", icon: <Fence className="h-[18px] w-[18px]" /> },
                  SIGNAGE_INFRA: { ar: "اللوحات", en: "Signage", icon: <Signpost className="h-[18px] w-[18px]" /> },
                  STREET_LIGHTING: { ar: "إنارة الشوارع", en: "Street Lighting", icon: <Lamp className="h-[18px] w-[18px]" /> },
                };
                const infraStatusConfig: Record<string, { ar: string; en: string; color: string; bgColor: string }> = {
                  NOT_STARTED: { ar: "لم تبدأ", en: "Not Started", color: "text-muted-foreground", bgColor: "bg-muted" },
                  DESIGN_PHASE: { ar: "مرحلة التصميم", en: "Design", color: "text-info", bgColor: "bg-info/15" },
                  TENDERING: { ar: "المناقصة", en: "Tendering", color: "text-purple-600", bgColor: "bg-purple-100" },
                  IN_PROGRESS_INFRA: { ar: "قيد التنفيذ", en: "In Progress", color: "text-primary", bgColor: "bg-primary/15" },
                  TESTING: { ar: "الاختبار", en: "Testing", color: "text-amber-600", bgColor: "bg-amber-100" },
                  COMPLETED_INFRA: { ar: "مكتمل", en: "Completed", color: "text-secondary", bgColor: "bg-secondary/15" },
                  DELAYED: { ar: "متأخر", en: "Delayed", color: "text-destructive", bgColor: "bg-destructive/15" },
                };
                const cat = (infraCategoryLabels[item.category] ?? { ar: item.category, en: item.category, icon: <HardHat className="h-[18px] w-[18px]" /> });
                const st = (infraStatusConfig[item.status] ?? infraStatusConfig.NOT_STARTED)!;
                const score = item.readinessScore ?? 0;
                return (
                  <div key={item.id} className="bg-card rounded-md shadow-card border border-border p-5 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {cat.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{cat[lang]}</p>
                          <Badge className={`text-[10px] ${st.bgColor} ${st.color}`}>{st[lang]}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status !== "COMPLETED_INFRA" && (
                          <button
                            onClick={async () => {
                              const nextStatus: Record<string, string> = {
                                NOT_STARTED: "DESIGN_PHASE",
                                DESIGN_PHASE: "TENDERING",
                                TENDERING: "IN_PROGRESS_INFRA",
                                IN_PROGRESS_INFRA: "TESTING",
                                TESTING: "COMPLETED_INFRA",
                                DELAYED: "IN_PROGRESS_INFRA",
                              };
                              const next = nextStatus[item.status];
                              if (next) {
                                await updateInfrastructureItem(item.id, {
                                  status: next,
                                  readinessScore: next === "COMPLETED_INFRA" ? 100 : Math.min((item.readinessScore ?? 0) + 20, 95),
                                  ...(next === "COMPLETED_INFRA" ? { completedDate: new Date().toISOString() } : {}),
                                });
                                loadInfrastructure();
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 active:bg-secondary/30 transition-all"
                           
                          >
                            <CheckCircle2 className="h-3 w-3" />{lang === "ar" ? "تقدّم" : "Advance"}
                          </button>
                        )}
                        <button
                          onClick={async () => { await deleteInfrastructureItem(item.id); loadInfrastructure(); }}
                          className="inline-flex items-center p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all"
                         
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{lang === "ar" ? "الجاهزية" : "Readiness"}</span>
                        <span className={`font-bold ${score >= 70 ? "text-secondary" : score >= 40 ? "text-amber-600" : "text-muted-foreground"}`}>{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 70 ? "bg-secondary" : score >= 40 ? "bg-amber-500" : "bg-neutral/40"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      {item.contractor && (
                        <div><span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "المقاول" : "Contractor"}</span><p className="text-foreground font-medium">{item.contractor}</p></div>
                      )}
                      {item.targetDate && (
                        <div><span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "التاريخ المستهدف" : "Target"}</span><p className="text-foreground font-medium">{new Date(item.targetDate).toLocaleDateString("en-SA")}</p></div>
                      )}
                      {item.estimatedCostSar && (
                        <div><span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "التكلفة التقديرية" : "Est. Cost"}</span><p className="text-foreground font-medium"><SARAmount value={Number(item.estimatedCostSar)} size={11} /></p></div>
                      )}
                      {item.wave && (
                        <div><span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "الموجة" : "Wave"}</span><p className="text-foreground font-medium">{item.wave}</p></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showInfraModal && (
            <InfrastructureModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowInfraModal(false)}
              onSuccess={() => { setShowInfraModal(false); loadInfrastructure(); }}
            />
          )}
        </div>
      )}

      {/* ─── Inventory Tab ─── */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Stats */}
          {inventoryStats && inventoryStats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: lang === "ar" ? "الإجمالي" : "Total", value: inventoryStats.total, color: "text-primary" },
                { label: lang === "ar" ? "متاح" : "Available", value: inventoryStats.available, color: "text-secondary" },
                { label: lang === "ar" ? "محجوز" : "Reserved", value: inventoryStats.reserved, color: "text-amber-600" },
                { label: lang === "ar" ? "مباع" : "Sold", value: inventoryStats.sold, color: "text-info" },
                { label: lang === "ar" ? "لم تُطلق" : "Unreleased", value: inventoryStats.unreleased, color: "text-muted-foreground" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</span>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">
              {inventoryItems.length} {lang === "ar" ? "عنصر مخزون" : "inventory items"}
            </p>
            <div className="flex items-center gap-2">
              {selectedInvItems.size > 0 && (
                <button
                  onClick={async () => {
                    await releaseInventory(Array.from(selectedInvItems));
                    setSelectedInvItems(new Set());
                    loadInventory();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 transition-all"
                 
                >
                  <Rocket className="h-3.5 w-3.5" />{lang === "ar" ? `إطلاق (${selectedInvItems.size})` : `Release (${selectedInvItems.size})`}
                </button>
              )}
              {subdivisionPlans.length > 0 && (
                <button
                  onClick={async () => {
                    const planId = subdivisionPlans[0]?.id;
                    if (planId) {
                      await generateInventoryFromPlots(id as string, planId);
                      loadInventory();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 active:bg-amber-500/40 transition-all"
                 
                >
                  <Package className="h-3.5 w-3.5" />{lang === "ar" ? "توليد من القطع" : "Generate from Plots"}
                </button>
              )}
              {/* G9: Convert sold inventory to units for handover */}
              {inventoryStats && inventoryStats.sold > 0 && ["READY", "HANDED_OVER"].includes(project?.status) && (
                <button
                  onClick={async () => {
                    try {
                      const result = await convertInventoryToUnits(id as string);
                      alert(lang === "ar"
                        ? `تم إنشاء ${result.unitsCreated} وحدة و ${result.contractsCreated} عقد`
                        : `Created ${result.unitsCreated} units and ${result.contractsCreated} contracts`);
                      await load();
                      loadInventory();
                    } catch (e: any) {
                      console.error(e);
                      alert(e?.message || "Conversion failed");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-all"
                >
                  <HardHat className="h-3.5 w-3.5" />{lang === "ar" ? "تحويل المباع إلى وحدات" : "Convert Sold to Units"}
                </button>
              )}
              <Link href={`/dashboard/projects/${id}/inventory/import`}>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 active:bg-amber-500/40 transition-all">
                  <Upload className="h-3.5 w-3.5" />{lang === "ar" ? "استيراد CSV" : "Import CSV"}
                </button>
              </Link>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة يدوياً" : "Add Item"}
              </button>
            </div>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : inventoryItems.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا يوجد مخزون" : "No Inventory"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أنشئ عناصر المخزون من مخطط التقسيم أو يدوياً" : "Generate inventory from subdivision plots or add manually"}</p>
            </div>
          ) : (
            <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-3 py-3 text-start w-8">
                      <input
                        type="checkbox"
                        checked={selectedInvItems.size === inventoryItems.filter((i: any) => i.status === "UNRELEASED").length && selectedInvItems.size > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvItems(new Set(inventoryItems.filter((i: any) => i.status === "UNRELEASED").map((i: any) => i.id)));
                          } else {
                            setSelectedInvItems(new Set());
                          }
                        }}
                        className="w-3.5 h-3.5 accent-secondary"
                      />
                    </th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الرقم" : "#"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "المساحة" : "Area"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "السعر" : "Price"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "المرحلة" : "Phase"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="px-3 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item: any) => {
                    const invStatusConfig: Record<string, { ar: string; en: string; color: string }> = {
                      UNRELEASED: { ar: "لم تُطلق", en: "Unreleased", color: "bg-muted text-muted-foreground" },
                      AVAILABLE_INV: { ar: "متاح", en: "Available", color: "bg-secondary/15 text-secondary" },
                      RESERVED_INV: { ar: "محجوز", en: "Reserved", color: "bg-amber-100 text-amber-700" },
                      SOLD_INV: { ar: "مباع", en: "Sold", color: "bg-info/15 text-info" },
                      HELD_INV: { ar: "محتجز", en: "Held", color: "bg-purple-100 text-purple-700" },
                      WITHDRAWN: { ar: "مسحوب", en: "Withdrawn", color: "bg-destructive/15 text-destructive" },
                    };
                    const productTypeLabels: Record<string, { ar: string; en: string }> = {
                      VILLA_PLOT: { ar: "قطعة فيلا", en: "Villa Plot" },
                      TOWNHOUSE_PLOT: { ar: "تاون هاوس", en: "Townhouse" },
                      DUPLEX_PLOT: { ar: "دوبلكس", en: "Duplex" },
                      APARTMENT_PLOT: { ar: "شقة", en: "Apartment" },
                      COMMERCIAL_LOT: { ar: "تجاري", en: "Commercial" },
                      MIXED_USE_LOT: { ar: "متعدد", en: "Mixed Use" },
                      RAW_LAND_PLOT: { ar: "أرض خام", en: "Raw Land" },
                    };
                    const ist = (invStatusConfig[item.status] ?? invStatusConfig.UNRELEASED)!;
                    const pt = (productTypeLabels[item.productType] ?? { ar: item.productType, en: item.productType });
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-3 py-3">
                          {item.status === "UNRELEASED" && (
                            <input
                              type="checkbox"
                              checked={selectedInvItems.has(item.id)}
                              onChange={(e) => {
                                const next = new Set(selectedInvItems);
                                if (e.target.checked) next.add(item.id); else next.delete(item.id);
                                setSelectedInvItems(next);
                              }}
                              className="w-3.5 h-3.5 accent-secondary"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground">{item.itemNumber}</td>
                        <td className="px-3 py-3 text-xs">{pt[lang]}</td>
                        <td className="px-3 py-3 text-xs">{item.areaSqm ? `${fmt(item.areaSqm)} م²` : "—"}</td>
                        <td className="px-3 py-3 text-xs">{item.finalPriceSar ? <SARAmount value={Number(item.finalPriceSar)} size={11} /> : item.basePriceSar ? <SARAmount value={Number(item.basePriceSar)} size={11} /> : "—"}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{item.releasePhase ?? "—"}</td>
                        <td className="px-3 py-3"><Badge className={`text-[10px] ${ist.color}`}>{ist[lang]}</Badge></td>
                        <td className="px-3 py-3">
                          {item.status === "UNRELEASED" && (
                            <button
                              onClick={async () => { await deleteInventoryItem(item.id); loadInventory(); }}
                              className="inline-flex items-center p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all"
                             
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showInventoryModal && (
            <InventoryModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowInventoryModal(false)}
              onSuccess={() => { setShowInventoryModal(false); loadInventory(); }}
            />
          )}
        </div>
      )}

      {/* ─── Pricing Tab ─── */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          {/* Pricing Summary */}
          {pricingSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: lang === "ar" ? "قواعد نشطة" : "Active Rules", value: pricingSummary.activeRules, color: "text-secondary" },
                { label: lang === "ar" ? "عناصر مسعّرة" : "Priced Items", value: pricingSummary.pricedItems, color: "text-primary" },
                { label: lang === "ar" ? "غير مسعّرة" : "Unpriced", value: pricingSummary.unpricedItems, color: pricingSummary.unpricedItems > 0 ? "text-amber-600" : "text-muted-foreground" },
                { label: lang === "ar" ? "متوسط سعر م²" : "Avg SAR/sqm", value: pricingSummary.avgPricePerSqm ? <SARAmount value={pricingSummary.avgPricePerSqm} size={14} /> : "—", color: "text-info" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</span>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">
              {pricingRules.length} {lang === "ar" ? "قاعدة تسعير" : "pricing rules"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await bulkCalculatePrices(id as string);
                  loadPricing();
                  loadInventory();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 active:bg-amber-500/40 transition-all"
               
              >
                <DollarSign className="h-3.5 w-3.5" />{lang === "ar" ? "حساب الأسعار" : "Calculate All"}
              </button>
              <Link href={`/dashboard/projects/${id}/pricing/versions`}>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 active:bg-amber-500/40 transition-all">
                  <History className="h-3.5 w-3.5" />{lang === "ar" ? "إصدارات الأسعار" : "Price Versions"}
                </button>
              </Link>
              <Link href={`/dashboard/projects/${id}/pricing/change-requests`}>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 active:bg-amber-500/40 transition-all">
                  <Filter className="h-3.5 w-3.5" />{lang === "ar" ? "طلبات تعديل الأسعار" : "Price Change Requests"}
                </button>
              </Link>
              <button
                onClick={() => setShowPricingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة قاعدة" : "Add Rule"}
              </button>
            </div>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : pricingRules.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد قواعد تسعير" : "No Pricing Rules"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أضف قواعد لحساب أسعار المخزون تلقائياً" : "Add rules to auto-calculate inventory prices"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pricingRules.map((rule: any) => {
                const ruleTypeLabels: Record<string, { ar: string; en: string; color: string }> = {
                  BASE_PRICE_PER_SQM: { ar: "سعر الأساس / م²", en: "Base Price/sqm", color: "bg-primary/15 text-primary" },
                  CORNER_PREMIUM: { ar: "علاوة الزاوية", en: "Corner Premium", color: "bg-amber-100 text-amber-700" },
                  PARK_FACING_PREMIUM: { ar: "علاوة إطلالة حديقة", en: "Park Facing", color: "bg-green-100 text-green-700" },
                  MAIN_ROAD_PREMIUM: { ar: "علاوة شارع رئيسي", en: "Main Road", color: "bg-blue-100 text-blue-700" },
                  PHASE_PREMIUM: { ar: "علاوة مرحلة", en: "Phase Premium", color: "bg-purple-100 text-purple-700" },
                  BLOCK_ADJUSTMENT: { ar: "تعديل بلك", en: "Block Adjustment", color: "bg-orange-100 text-orange-700" },
                  PRODUCT_TYPE_PREMIUM: { ar: "علاوة نوع منتج", en: "Product Type", color: "bg-cyan-100 text-cyan-700" },
                  CUSTOM_PRICING: { ar: "تسعير مخصص", en: "Custom", color: "bg-muted text-muted-foreground" },
                };
                const rt = (ruleTypeLabels[rule.type] ?? ruleTypeLabels.CUSTOM_PRICING)!;
                return (
                  <div key={rule.id} className={`bg-card rounded-md shadow-card border ${rule.isActive ? "border-border" : "border-border opacity-50"} p-5`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-foreground">{rule.name}</span>
                            <Badge className={`text-[10px] ${rt.color}`}>{rt[lang]}</Badge>
                            {!rule.isActive && <Badge className="text-[10px] bg-muted text-muted-foreground">{lang === "ar" ? "معطّل" : "Disabled"}</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {rule.factor && <span>{lang === "ar" ? "المعامل:" : "Factor:"} <strong className="text-foreground">{rule.type === "BASE_PRICE_PER_SQM" ? `${fmt(rule.factor)} SAR/م²` : `×${rule.factor}`}</strong></span>}
                            {rule.fixedAmountSar && <span>{lang === "ar" ? "مبلغ ثابت:" : "Fixed:"} <SARAmount value={Number(rule.fixedAmountSar)} size={11} /></span>}
                            <span>{lang === "ar" ? "الأولوية:" : "Priority:"} {rule.priority}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => { await togglePricingRule(rule.id); loadPricing(); }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                            rule.isActive
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200"
                              : "bg-secondary/10 text-secondary hover:bg-secondary/20 active:bg-secondary/30"
                          }`}
                         
                        >
                          <ToggleRight className="h-3 w-3" />{rule.isActive ? (lang === "ar" ? "تعطيل" : "Disable") : (lang === "ar" ? "تفعيل" : "Enable")}
                        </button>
                        <button
                          onClick={async () => { await deletePricingRule(rule.id); loadPricing(); }}
                          className="inline-flex items-center p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all"
                         
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showPricingModal && (
            <PricingRuleModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowPricingModal(false)}
              onSuccess={() => { setShowPricingModal(false); loadPricing(); }}
            />
          )}
        </div>
      )}

      {/* ─── Launch Waves Tab ─── */}
      {activeTab === "launch" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {launchWaves.length} {lang === "ar" ? "موجة إطلاق" : "launch waves"}
            </p>
            <button
              onClick={() => setShowWaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-all"
             
            >
              <Plus className="h-3.5 w-3.5" />{lang === "ar" ? "إضافة موجة" : "Add Wave"}
            </button>
          </div>

          {loadingOffPlan ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : launchWaves.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <Rocket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد موجات إطلاق" : "No Launch Waves"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أنشئ موجات لإطلاق المخزون على مراحل" : "Create waves to release inventory in phases"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {launchWaves.map((wave: any) => {
                const waveStatusConfig: Record<string, { ar: string; en: string; color: string; actionLabel?: { ar: string; en: string } }> = {
                  PLANNED: { ar: "مخطط", en: "Planned", color: "bg-muted text-muted-foreground", actionLabel: { ar: "تجهيز", en: "Ready" } },
                  READY_WAVE: { ar: "جاهز", en: "Ready", color: "bg-amber-100 text-amber-700", actionLabel: { ar: "إطلاق", en: "Launch" } },
                  LAUNCHED: { ar: "مُطلق", en: "Launched", color: "bg-secondary/15 text-secondary", actionLabel: { ar: "إغلاق", en: "Close" } },
                  CLOSED_WAVE: { ar: "مُغلق", en: "Closed", color: "bg-neutral/15 text-muted-foreground" },
                };
                const ws = (waveStatusConfig[wave.status] ?? waveStatusConfig.PLANNED)!;
                return (
                  <div key={wave.id} className="bg-card rounded-md shadow-card border border-border p-5 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{wave.waveNumber}</div>
                          <span className="text-sm font-bold text-foreground">{wave.name ?? `${lang === "ar" ? "الموجة" : "Wave"} ${wave.waveNumber}`}</span>
                          <Badge className={`text-[10px] ${ws.color}`}>{ws[lang]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {wave.plannedDate && <span>{lang === "ar" ? "التاريخ:" : "Date:"} {new Date(wave.plannedDate).toLocaleDateString("en-SA")}</span>}
                          {wave.inventoryCount && <span>{wave.inventoryCount} {lang === "ar" ? "عنصر" : "items"}</span>}
                          {wave.totalValueSar && <span><SARAmount value={Number(wave.totalValueSar)} size={11} /></span>}
                          {wave.launchedAt && <span>{lang === "ar" ? "أُطلق:" : "Launched:"} {new Date(wave.launchedAt).toLocaleDateString("en-SA")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {wave.status === "PLANNED" && (
                          <button
                            onClick={async () => { await updateLaunchWave(wave.id, { status: "READY_WAVE" }); loadWaves(); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200 transition-all"
                           
                          >
                            <CheckCircle2 className="h-3 w-3" />{lang === "ar" ? "تجهيز" : "Mark Ready"}
                          </button>
                        )}
                        {wave.status === "READY_WAVE" && (
                          <button
                            onClick={async () => { await launchWave(wave.id); loadWaves(); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-md bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 transition-all"
                           
                          >
                            <Play className="h-3 w-3" />{lang === "ar" ? "إطلاق" : "Launch"}
                          </button>
                        )}
                        {wave.status === "LAUNCHED" && (
                          <button
                            onClick={async () => { await closeWave(wave.id); loadWaves(); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-md bg-neutral/10 text-muted-foreground hover:bg-neutral/20 active:bg-neutral/30 transition-all"
                           
                          >
                            <Square className="h-3 w-3" />{lang === "ar" ? "إغلاق" : "Close"}
                          </button>
                        )}
                        {wave.status !== "LAUNCHED" && wave.status !== "CLOSED_WAVE" && (
                          <button
                            onClick={async () => { await deleteLaunchWave(wave.id); loadWaves(); }}
                            className="inline-flex items-center p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all"
                           
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {wave.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{wave.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {showWaveModal && (
            <LaunchWaveModal
              lang={lang}
              projectId={id as string}
              onClose={() => setShowWaveModal(false)}
              onSuccess={() => { setShowWaveModal(false); loadWaves(); }}
            />
          )}
        </div>
      )}

      {/* ─── Launch Readiness Tab ─── */}
      {activeTab === "readiness" && (
        <div className="space-y-6">
          {loadingReadiness ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : readinessChecklist.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد بيانات" : "No Data"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "لم يتم تحميل قائمة الجاهزية" : "Readiness checklist not loaded"}</p>
            </div>
          ) : (
            <>
              {/* Ready / Not Ready banner */}
              {(() => {
                const allPassed = readinessChecklist.every((item: any) => item.passed);
                return (
                  <div className={`rounded-md p-5 border ${allPassed ? "bg-secondary/10 border-secondary/30" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center gap-3">
                      {allPassed
                        ? <ShieldCheck className="h-7 w-7 text-secondary" />
                        : <XCircle className="h-7 w-7 text-amber-600" />
                      }
                      <div>
                        <p className={`text-lg font-bold ${allPassed ? "text-secondary" : "text-amber-700"}`}>
                          {allPassed
                            ? (lang === "ar" ? "المشروع جاهز للإطلاق" : "Project Ready for Launch")
                            : (lang === "ar" ? "المشروع غير جاهز للإطلاق" : "Project Not Ready for Launch")
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {readinessChecklist.filter((i: any) => i.passed).length}/{readinessChecklist.length} {lang === "ar" ? "متطلب مكتمل" : "prerequisites met"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Checklist */}
              <div className="space-y-3">
                {readinessChecklist.map((item: any) => (
                  <div key={item.id} className="bg-card rounded-md shadow-card border border-border p-4 flex items-center justify-between hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      {item.passed
                        ? <CheckCircle2 className="h-6 w-6 text-secondary" />
                        : <XCircle className="h-6 w-6 text-destructive" />
                      }
                      <div>
                        <p className="text-sm font-bold text-foreground">{lang === "ar" ? item.labelAr : item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? item.detailAr : item.detail}</p>
                      </div>
                    </div>
                    {!item.passed && item.fixTab && (
                      <button
                        onClick={() => handleTabChange(item.fixTab)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                       
                      >
                        {lang === "ar" ? "إصلاح" : "Fix"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Launch Map Tab ─── */}
      {activeTab === "map" && (
        <div className="space-y-6">
          {loadingMap ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : mapInventory.length === 0 ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا يوجد مخزون" : "No Inventory"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أنشئ عناصر مخزون أولاً" : "Create inventory items first"}</p>
            </div>
          ) : (
            <>
              {/* Status legend */}
              <div className="flex items-center gap-4 text-xs">
                {[
                  { label: lang === "ar" ? "متاح" : "Available", color: "bg-secondary" },
                  { label: lang === "ar" ? "محجوز" : "Reserved", color: "bg-amber-500" },
                  { label: lang === "ar" ? "مباع" : "Sold", color: "bg-info" },
                  { label: lang === "ar" ? "لم تُطلق" : "Unreleased", color: "bg-neutral/40" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${s.color}`} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Inventory grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mapInventory.map((item: any) => {
                  const statusColor: Record<string, string> = {
                    AVAILABLE_INV: "border-secondary bg-secondary/5",
                    RESERVED_INV: "border-amber-400 bg-amber-50",
                    SOLD_INV: "border-info bg-info/5",
                    HELD_INV: "border-purple-400 bg-purple-50",
                    UNRELEASED: "border-neutral/30 bg-muted/30",
                    WITHDRAWN: "border-destructive/30 bg-destructive/5",
                  };
                  const statusLabel: Record<string, { ar: string; en: string }> = {
                    AVAILABLE_INV: { ar: "متاح", en: "Available" },
                    RESERVED_INV: { ar: "محجوز", en: "Reserved" },
                    SOLD_INV: { ar: "مباع", en: "Sold" },
                    HELD_INV: { ar: "محتجز", en: "Held" },
                    UNRELEASED: { ar: "لم تُطلق", en: "Unreleased" },
                    WITHDRAWN: { ar: "مسحوب", en: "Withdrawn" },
                  };
                  const sc = statusColor[item.status] ?? statusColor.UNRELEASED;
                  const sl = (statusLabel[item.status] ?? statusLabel.UNRELEASED)!;
                  return (
                    <div key={item.id} className={`rounded-md border-2 p-3 ${sc} transition-all hover:shadow-lg`}>
                      <p className="text-xs font-bold text-foreground">{item.itemNumber}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.areaSqm ? `${Number(item.areaSqm).toLocaleString()} م²` : "—"}</p>
                      {item.finalPriceSar || item.basePriceSar ? (
                        <p className="text-xs font-bold mt-1"><SARAmount value={Number(item.finalPriceSar ?? item.basePriceSar)} size={10} /></p>
                      ) : null}
                      <p className="text-[10px] font-bold mt-1">{sl[lang]}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Analytics Tab ─── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !analyticsData ? (
            <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد بيانات" : "No Data"}</h3>
            </div>
          ) : (
            <>
              {/* KPI Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: lang === "ar" ? "إجمالي القيمة" : "Total Value", value: analyticsData.pricing?.overall?.totalValue ? <SARAmount value={analyticsData.pricing.overall.totalValue} size={14} /> : "—", color: "text-primary" },
                  { label: lang === "ar" ? "متوسط سعر م²" : "Avg SAR/sqm", value: analyticsData.pricing?.overall?.avgPricePerSqm?.toLocaleString() ?? "—", color: "text-secondary" },
                  { label: lang === "ar" ? "عناصر المخزون" : "Inventory Items", value: analyticsData.pricing?.overall?.itemCount ?? 0, color: "text-info" },
                  {
                    label: lang === "ar" ? "معدل التحويل" : "Conversion Rate",
                    value: analyticsData.waves?.length > 0
                      ? `${Math.round(analyticsData.waves.reduce((s: number, w: any) => s + w.conversionRate, 0) / analyticsData.waves.length)}%`
                      : "—",
                    color: "text-amber-500",
                  },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-md border border-border bg-card shadow-card p-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</span>
                    <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Wave Performance Table */}
              {analyticsData.waves?.length > 0 && (
                <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">{lang === "ar" ? "أداء الموجات" : "Wave Performance"}</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الموجة" : "Wave"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "متاح" : "Available"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "محجوز" : "Reserved"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "مباع" : "Sold"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "التحويل" : "Conv."}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.waves.map((wave: any) => (
                        <tr key={wave.waveNumber} className="border-b border-border last:border-0 hover:bg-muted/10">
                          <td className="px-4 py-3 font-bold text-foreground">{lang === "ar" ? wave.nameArabic ?? wave.name : wave.name}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] ${wave.status === "LAUNCHED" ? "bg-secondary/15 text-secondary" : wave.status === "PLANNED" ? "bg-muted text-muted-foreground" : "bg-info/15 text-info"}`}>{wave.status}</Badge>
                          </td>
                          <td className="px-4 py-3">{wave.total}</td>
                          <td className="px-4 py-3 text-secondary font-medium">{wave.released - wave.reserved - wave.sold}</td>
                          <td className="px-4 py-3 text-amber-600 font-medium">{wave.reserved}</td>
                          <td className="px-4 py-3 text-info font-medium">{wave.sold}</td>
                          <td className="px-4 py-3 font-bold">{wave.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pricing by Product Type */}
              {analyticsData.pricing?.byProductType?.length > 0 && (
                <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">{lang === "ar" ? "التسعير حسب النوع" : "Pricing by Product Type"}</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "العدد" : "Count"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "متوسط / م²" : "Avg/sqm"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "أقل" : "Min"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "أعلى" : "Max"}</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "إجمالي القيمة" : "Total Value"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.pricing.byProductType.map((pt: any) => (
                        <tr key={pt.type} className="border-b border-border last:border-0 hover:bg-muted/10">
                          <td className="px-4 py-3 font-bold text-foreground">{pt.type.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3">{pt.count}</td>
                          <td className="px-4 py-3"><SARAmount value={pt.avgPricePerSqm} size={11} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground"><SARAmount value={pt.minPricePerSqm} size={10} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground"><SARAmount value={pt.maxPricePerSqm} size={10} /></td>
                          <td className="px-4 py-3 font-bold"><SARAmount value={pt.totalValue} size={11} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Financials Tab (G10b) ─── */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          {loadingFinancials ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !projectFinancials ? (
            <p className="text-center text-muted-foreground py-12">{lang === "ar" ? "لا توجد بيانات مالية" : "No financial data"}</p>
          ) : (
            <>
              {/* P&L Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "إجمالي التكاليف" : "Total Costs"}</span>
                  <p className="text-lg font-bold text-destructive mt-1"><SARAmount value={projectFinancials.totalCosts} size={14} /></p>
                </div>
                <div className="rounded-md border border-border bg-card shadow-card p-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                  <p className="text-lg font-bold text-secondary mt-1"><SARAmount value={projectFinancials.totalRevenue} size={14} /></p>
                </div>
                <div className={`bg-card rounded-md shadow-card border border-border p-4 ${projectFinancials.netPL >= 0 ? "border-secondary/30" : "border-destructive/30"}`}>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "صافي الربح/الخسارة" : "Net P&L"}</span>
                  <p className={`text-lg font-bold mt-1 ${projectFinancials.netPL >= 0 ? "text-secondary" : "text-destructive"}`}>
                    <SARAmount value={projectFinancials.netPL} size={14} />
                  </p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-card rounded-md shadow-card border border-border p-5">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4">{lang === "ar" ? "تفصيل التكاليف" : "Cost Breakdown"}</h3>
                <div className="space-y-3">
                  {[
                    { label: lang === "ar" ? "تكلفة الأرض" : "Land Cost", value: projectFinancials.landCost },
                    { label: lang === "ar" ? "تكلفة التطوير" : "Development Cost", value: projectFinancials.developmentCost },
                    { label: lang === "ar" ? "تكاليف الصيانة" : "Maintenance Costs", value: projectFinancials.maintenanceCosts },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-bold text-foreground"><SARAmount value={item.value} size={11} /></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-card rounded-md shadow-card border border-border p-5">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4">{lang === "ar" ? "تفصيل الإيرادات" : "Revenue Breakdown"}</h3>
                <div className="space-y-3">
                  {[
                    { label: lang === "ar" ? "إيرادات المبيعات" : "Sale Revenue", value: projectFinancials.saleRevenue },
                    { label: lang === "ar" ? "دخل الإيجارات" : "Rental Income", value: projectFinancials.rentalIncome },
                    { label: lang === "ar" ? "مبيعات ما قبل البناء" : "Off-Plan Sold", value: projectFinancials.offPlanSoldValue },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-bold text-secondary"><SARAmount value={item.value} size={11} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Concept Plan Modal ─────────────────────────────────────────────────── */
function ConceptPlanModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", description: "", totalPlots: "", totalGfaSqm: "", farRatio: "", openSpacePct: "",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createConceptPlan({
        projectId,
        name: form.name,
        description: form.description || undefined,
        totalPlots: form.totalPlots ? parseInt(form.totalPlots) : undefined,
        totalGfaSqm: form.totalGfaSqm ? parseFloat(form.totalGfaSqm) : undefined,
        farRatio: form.farRatio ? parseFloat(form.farRatio) : undefined,
        openSpacePct: form.openSpacePct ? parseFloat(form.openSpacePct) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "مخطط مبدئي جديد" : "New Concept Plan"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "اسم المخطط *" : "Plan Name *"}</label>
            <input required value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الوصف" : "Description"}</label>
            <textarea value={form.description} onChange={set("description")} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "عدد القطع" : "Total Plots"}</label>
              <input type="number" value={form.totalPlots} onChange={set("totalPlots")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "GFA (م²)" : "GFA (sqm)"}</label>
              <input type="number" value={form.totalGfaSqm} onChange={set("totalGfaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "نسبة FAR" : "FAR Ratio"}</label>
              <input type="number" step="0.01" value={form.farRatio} onChange={set("farRatio")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المساحات المفتوحة %" : "Open Space %"}</label>
              <input type="number" step="0.1" value={form.openSpacePct} onChange={set("openSpacePct")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Subdivision Plan Modal ─────────────────────────────────────────────── */
function SubdivisionPlanModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", nameArabic: "", totalAreaSqm: "", developableAreaSqm: "", numberOfPhases: "",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createSubdivisionPlan({
        projectId,
        name: form.name,
        nameArabic: form.nameArabic || undefined,
        totalAreaSqm: form.totalAreaSqm ? parseFloat(form.totalAreaSqm) : undefined,
        developableAreaSqm: form.developableAreaSqm ? parseFloat(form.developableAreaSqm) : undefined,
        numberOfPhases: form.numberOfPhases ? parseInt(form.numberOfPhases) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "مخطط تقسيم جديد" : "New Subdivision Plan"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (إنجليزي) *" : "Name *"}</label>
              <input required value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</label>
              <input value={form.nameArabic} onChange={set("nameArabic")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المساحة الكلية (م²)" : "Total Area"}</label>
              <input type="number" value={form.totalAreaSqm} onChange={set("totalAreaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "القابلة للتطوير (م²)" : "Developable"}</label>
              <input type="number" value={form.developableAreaSqm} onChange={set("developableAreaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المراحل" : "Phases"}</label>
              <input type="number" value={form.numberOfPhases} onChange={set("numberOfPhases")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Approval Submission Modal ──────────────────────────────────────────── */
function ApprovalSubmissionModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    authority: "", authorityArabic: "", type: "SUBDIVISION_APPROVAL", referenceNumber: "",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  const approvalTypes = [
    { value: "SUBDIVISION_APPROVAL", label: { ar: "اعتماد تقسيم", en: "Subdivision Approval" } },
    { value: "BUILDING_PERMIT", label: { ar: "رخصة بناء", en: "Building Permit" } },
    { value: "INFRASTRUCTURE_PERMIT", label: { ar: "رخصة بنية تحتية", en: "Infrastructure Permit" } },
    { value: "ENVIRONMENTAL_CLEARANCE", label: { ar: "تصريح بيئي", en: "Environmental Clearance" } },
    { value: "UTILITY_CONNECTION", label: { ar: "ربط مرافق", en: "Utility Connection" } },
    { value: "SALES_LICENSE", label: { ar: "رخصة بيع", en: "Sales License" } },
    { value: "OTHER_APPROVAL", label: { ar: "أخرى", en: "Other" } },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createApprovalSubmission({
        projectId,
        authority: form.authority,
        authorityArabic: form.authorityArabic || undefined,
        type: form.type,
        referenceNumber: form.referenceNumber || undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "طلب موافقة جديد" : "New Approval Submission"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الجهة (إنجليزي) *" : "Authority *"}</label>
              <input required value={form.authority} onChange={set("authority")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. Balady" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الجهة (عربي)" : "Authority (Arabic)"}</label>
              <input value={form.authorityArabic} onChange={set("authorityArabic")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="مثال: أمانة الرياض" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "نوع الطلب" : "Submission Type"}</label>
            <select value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
              {approvalTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label[lang]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الرقم المرجعي" : "Reference Number"}</label>
            <input value={form.referenceNumber} onChange={set("referenceNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Infrastructure Modal ──────────────────────────────────────────────── */
function InfrastructureModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    category: "ELECTRICITY_INFRA", contractor: "", estimatedCostSar: "", targetDate: "", notes: "", wave: "",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  const categories = [
    { value: "ELECTRICITY_INFRA", label: { ar: "الكهرباء", en: "Electricity" } },
    { value: "WATER_INFRA", label: { ar: "المياه", en: "Water" } },
    { value: "SEWAGE_INFRA", label: { ar: "الصرف الصحي", en: "Sewage" } },
    { value: "TELECOM_INFRA", label: { ar: "الاتصالات", en: "Telecom" } },
    { value: "ROADS_INFRA", label: { ar: "الطرق", en: "Roads" } },
    { value: "STORMWATER_INFRA", label: { ar: "تصريف الأمطار", en: "Stormwater" } },
    { value: "LANDSCAPING_INFRA", label: { ar: "التشجير", en: "Landscaping" } },
    { value: "FENCING_INFRA", label: { ar: "التسوير", en: "Fencing" } },
    { value: "SIGNAGE_INFRA", label: { ar: "اللوحات", en: "Signage" } },
    { value: "STREET_LIGHTING", label: { ar: "إنارة الشوارع", en: "Street Lighting" } },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createInfrastructureItem({
        projectId,
        category: form.category,
        contractor: form.contractor || undefined,
        estimatedCostSar: form.estimatedCostSar ? parseFloat(form.estimatedCostSar) : undefined,
        targetDate: form.targetDate || undefined,
        notes: form.notes || undefined,
        wave: form.wave ? parseInt(form.wave) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "إضافة بنية تحتية" : "Add Infrastructure"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الفئة *" : "Category *"}</label>
            <select required value={form.category} onChange={set("category")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label[lang]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المقاول" : "Contractor"}</label>
              <input value={form.contractor} onChange={set("contractor")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "التكلفة التقديرية (ر.س)" : "Est. Cost (SAR)"}</label>
              <input type="number" value={form.estimatedCostSar} onChange={set("estimatedCostSar")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "التاريخ المستهدف" : "Target Date"}</label>
              <input type="date" value={form.targetDate} onChange={set("targetDate")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الموجة" : "Wave"}</label>
              <input type="number" value={form.wave} onChange={set("wave")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Inventory Modal ──────────────────────────────────────────────────── */
function InventoryModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    itemNumber: "", productType: "VILLA_PLOT", productLabel: "", productLabelArabic: "",
    areaSqm: "", basePriceSar: "", releasePhase: "", channel: "DIRECT",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  const productTypes = [
    { value: "VILLA_PLOT", label: { ar: "قطعة فيلا", en: "Villa Plot" } },
    { value: "TOWNHOUSE_PLOT", label: { ar: "تاون هاوس", en: "Townhouse" } },
    { value: "DUPLEX_PLOT", label: { ar: "دوبلكس", en: "Duplex" } },
    { value: "APARTMENT_PLOT", label: { ar: "شقة", en: "Apartment" } },
    { value: "COMMERCIAL_LOT", label: { ar: "تجاري", en: "Commercial" } },
    { value: "MIXED_USE_LOT", label: { ar: "متعدد", en: "Mixed Use" } },
    { value: "RAW_LAND_PLOT", label: { ar: "أرض خام", en: "Raw Land" } },
  ];

  const channels = [
    { value: "DIRECT", label: { ar: "مباشر", en: "Direct" } },
    { value: "BROKER", label: { ar: "وسيط", en: "Broker" } },
    { value: "ONLINE", label: { ar: "إلكتروني", en: "Online" } },
    { value: "AUCTION", label: { ar: "مزاد", en: "Auction" } },
    { value: "VIP", label: { ar: "كبار العملاء", en: "VIP" } },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createInventoryItem({
        projectId,
        itemNumber: form.itemNumber,
        productType: form.productType,
        productLabel: form.productLabel || undefined,
        productLabelArabic: form.productLabelArabic || undefined,
        areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : undefined,
        basePriceSar: form.basePriceSar ? parseFloat(form.basePriceSar) : undefined,
        releasePhase: form.releasePhase ? parseInt(form.releasePhase) : undefined,
        channel: form.channel || undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "إضافة عنصر مخزون" : "Add Inventory Item"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "رقم العنصر *" : "Item Number *"}</label>
              <input required value={form.itemNumber} onChange={set("itemNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="INV-001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "نوع المنتج *" : "Product Type *"}</label>
              <select required value={form.productType} onChange={set("productType")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                {productTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label[lang]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (إنجليزي)" : "Label"}</label>
              <input value={form.productLabel} onChange={set("productLabel")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (عربي)" : "Label (Arabic)"}</label>
              <input value={form.productLabelArabic} onChange={set("productLabelArabic")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
              <input type="number" value={form.areaSqm} onChange={set("areaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "السعر الأساسي (ر.س)" : "Base Price (SAR)"}</label>
              <input type="number" value={form.basePriceSar} onChange={set("basePriceSar")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المرحلة" : "Phase"}</label>
              <input type="number" value={form.releasePhase} onChange={set("releasePhase")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "قناة البيع" : "Channel"}</label>
            <select value={form.channel} onChange={set("channel")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
              {channels.map((c) => (
                <option key={c.value} value={c.value}>{c.label[lang]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Pricing Rule Modal ───────────────────────────────────────────────── */
function PricingRuleModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", nameArabic: "", type: "BASE_PRICE_PER_SQM", factor: "", fixedAmountSar: "", priority: "0",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  const ruleTypes = [
    { value: "BASE_PRICE_PER_SQM", label: { ar: "سعر الأساس / م²", en: "Base Price/sqm" } },
    { value: "CORNER_PREMIUM", label: { ar: "علاوة الزاوية", en: "Corner Premium" } },
    { value: "PARK_FACING_PREMIUM", label: { ar: "علاوة إطلالة حديقة", en: "Park Facing" } },
    { value: "MAIN_ROAD_PREMIUM", label: { ar: "علاوة شارع رئيسي", en: "Main Road" } },
    { value: "PHASE_PREMIUM", label: { ar: "علاوة مرحلة", en: "Phase Premium" } },
    { value: "BLOCK_ADJUSTMENT", label: { ar: "تعديل بلك", en: "Block Adjustment" } },
    { value: "PRODUCT_TYPE_PREMIUM", label: { ar: "علاوة نوع منتج", en: "Product Type" } },
    { value: "CUSTOM_PRICING", label: { ar: "تسعير مخصص", en: "Custom" } },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPricingRule({
        projectId,
        name: form.name,
        nameArabic: form.nameArabic || undefined,
        type: form.type,
        factor: form.factor ? parseFloat(form.factor) : undefined,
        fixedAmountSar: form.fixedAmountSar ? parseFloat(form.fixedAmountSar) : undefined,
        priority: form.priority ? parseInt(form.priority) : 0,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "إضافة قاعدة تسعير" : "Add Pricing Rule"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (إنجليزي) *" : "Name *"}</label>
              <input required value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</label>
              <input value={form.nameArabic} onChange={set("nameArabic")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "نوع القاعدة *" : "Rule Type *"}</label>
            <select required value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
              {ruleTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label[lang]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المعامل" : "Factor"}</label>
              <input type="number" step="0.01" value={form.factor} onChange={set("factor")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder={form.type === "BASE_PRICE_PER_SQM" ? "3500" : "1.15"} />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "مبلغ ثابت (ر.س)" : "Fixed (SAR)"}</label>
              <input type="number" value={form.fixedAmountSar} onChange={set("fixedAmountSar")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الأولوية" : "Priority"}</label>
              <input type="number" value={form.priority} onChange={set("priority")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Launch Wave Modal ────────────────────────────────────────────────── */
function LaunchWaveModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", nameArabic: "", plannedDate: "", inventoryCount: "", notes: "",
  });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createLaunchWave({
        projectId,
        name: form.name || undefined,
        nameArabic: form.nameArabic || undefined,
        plannedDate: form.plannedDate || undefined,
        inventoryCount: form.inventoryCount ? parseInt(form.inventoryCount) : undefined,
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "إضافة موجة إطلاق" : "Add Launch Wave"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (إنجليزي)" : "Name"}</label>
              <input value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="Wave 1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</label>
              <input value={form.nameArabic} onChange={set("nameArabic")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="الموجة الأولى" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "التاريخ المخطط" : "Planned Date"}</label>
              <input type="date" value={form.plannedDate} onChange={set("plannedDate")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "عدد العناصر" : "Inventory Count"}</label>
              <input type="number" value={form.inventoryCount} onChange={set("inventoryCount")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold">{label}</p>
      <p className="text-sm text-foreground font-medium">{value || "—"}</p>
    </div>
  );
}
