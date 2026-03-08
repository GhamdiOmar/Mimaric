"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Spinner,
  Buildings,
  MapPin,
  Plus,
  PencilSimple,
  Trash,
  FileText,
  CloudArrowUp,
  ClipboardText,
  Eye,
  DownloadSimple,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button, Badge, SARAmount } from "@repo/ui";
import {
  getProjectDetail,
  updateProject,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  registerProjectDocument,
  deleteProjectDocument,
} from "../../../actions/projects";
import { getMaintenanceForProject } from "../../../actions/maintenance";
import { Wrench } from "@phosphor-icons/react";
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
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lang] = React.useState<"ar" | "en">("ar");
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "buildings" | "documents" | "maintenance">("overview");
  const [maintenanceRequests, setMaintenanceRequests] = React.useState<any[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = React.useState(false);

  // Building form state
  const [showBuildingForm, setShowBuildingForm] = React.useState(false);
  const [editingBuildingId, setEditingBuildingId] = React.useState<string | null>(null);
  const [buildingForm, setBuildingForm] = React.useState({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential" });
  const [savingBuilding, setSavingBuilding] = React.useState(false);

  // Document upload
  const [uploadCategory, setUploadCategory] = React.useState("LEGAL");

  React.useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await getProjectDetail(id as string);
      setProject(data);
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
      await updateProject(id as string, { status: newStatus });
      await load();
    } catch (e) { console.error(e); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>;
  if (!project) return <div className="text-center py-20 text-neutral">لم يتم العثور على المشروع</div>;

  const status = statusMap[project.status] ?? { ar: project.status, en: project.status, variant: "draft" };
  const type = typeLabels[project.type] ?? { ar: project.type, en: project.type };
  const totalUnits = project.buildings?.reduce((sum: number, b: any) => sum + (b.units?.length ?? 0), 0) ?? 0;
  const inputClass = "w-full h-10 px-3 bg-white border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  const maintenanceStatusLabels: Record<string, { ar: string; en: string; variant: string }> = {
    OPEN: { ar: "مفتوح", en: "Open", variant: "draft" },
    ASSIGNED: { ar: "معيّن", en: "Assigned", variant: "reserved" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", variant: "reserved" },
    ON_HOLD: { ar: "معلّق", en: "On Hold", variant: "maintenance" },
    RESOLVED: { ar: "تم الحل", en: "Resolved", variant: "available" },
    CLOSED: { ar: "مغلق", en: "Closed", variant: "sold" },
  };

  const maintenancePriorityLabels: Record<string, { ar: string; en: string; color: string }> = {
    LOW: { ar: "منخفض", en: "Low", color: "text-neutral" },
    MEDIUM: { ar: "متوسط", en: "Medium", color: "text-primary" },
    HIGH: { ar: "عالي", en: "High", color: "text-accent" },
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

  function handleTabChange(tabId: typeof activeTab) {
    setActiveTab(tabId);
    if (tabId === "maintenance" && maintenanceRequests.length === 0) {
      loadMaintenance();
    }
  }

  const tabs = [
    { id: "overview" as const, label: { ar: "نظرة عامة", en: "Overview" } },
    { id: "buildings" as const, label: { ar: "المباني", en: "Buildings" } },
    { id: "documents" as const, label: { ar: "الوثائق", en: "Documents" } },
    { id: "maintenance" as const, label: { ar: "الصيانة", en: "Maintenance" } },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects")} style={{ display: "inline-flex" }}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
            <Badge variant={status.variant as any} className="text-xs">{status[lang]}</Badge>
          </div>
          <p className="text-sm text-neutral mt-0.5">
            {type[lang]}
            {project.city || project.district ? ` • ${[project.district, project.city].filter(Boolean).join("، ")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/units?project=${id}`}>
            <Button variant="secondary" size="sm" className="gap-2" style={{ display: "inline-flex" }}>
              <Buildings size={14} />
              {lang === "ar" ? "عرض الوحدات" : "View Units"}
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/site-logs`}>
            <Button variant="secondary" size="sm" className="gap-2" style={{ display: "inline-flex" }}>
              <ClipboardText size={14} />
              {lang === "ar" ? "سجلات الموقع" : "Site Logs"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Actions */}
      {project.status === "PLANNING" && (
        <div className="flex items-center gap-3 bg-white rounded-md shadow-card border border-border p-4">
          <span className="text-xs text-neutral flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
          <Button size="sm" onClick={() => handleStatusChange("UNDER_CONSTRUCTION")} style={{ display: "inline-flex" }} className="gap-2">
            <CheckCircle size={14} />
            {lang === "ar" ? "بدء الإنشاء" : "Start Construction"}
          </Button>
        </div>
      )}
      {project.status === "UNDER_CONSTRUCTION" && (
        <div className="flex items-center gap-3 bg-white rounded-md shadow-card border border-border p-4">
          <span className="text-xs text-neutral flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
          <Button size="sm" onClick={() => handleStatusChange("READY")} style={{ display: "inline-flex" }} className="gap-2">
            <CheckCircle size={14} />
            {lang === "ar" ? "جاهز للتسليم" : "Mark Ready"}
          </Button>
        </div>
      )}
      {project.status === "READY" && (
        <div className="flex items-center gap-3 bg-white rounded-md shadow-card border border-border p-4">
          <span className="text-xs text-neutral flex-1">{lang === "ar" ? "تحويل حالة المشروع:" : "Transition project status:"}</span>
          <Button size="sm" onClick={() => handleStatusChange("HANDED_OVER")} style={{ display: "inline-flex" }} className="gap-2">
            <CheckCircle size={14} />
            {lang === "ar" ? "تم التسليم" : "Mark Handed Over"}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-neutral hover:text-primary"
            }`}
          >
            {tab.label[lang]}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: lang === "ar" ? "المساحة" : "Area", value: project.totalAreaSqm ? `${fmt(project.totalAreaSqm)} م²` : "—" },
              { label: lang === "ar" ? "رقم الصك" : "Deed #", value: project.deedNumber || "—" },
              { label: lang === "ar" ? "المباني" : "Buildings", value: `${project.buildings?.length ?? 0}` },
              { label: lang === "ar" ? "الوحدات" : "Units", value: `${totalUnits}` },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-md shadow-card border border-border p-4">
                <span className="text-[10px] font-bold uppercase text-neutral">{item.label}</span>
                <p className="text-lg font-bold text-primary mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Extra Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-md shadow-card border border-border p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral">
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
                  <p className="text-xs text-neutral">{project.description}</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-white rounded-md shadow-card border border-border p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral flex items-center gap-2">
                <MapPin size={14} />
                {lang === "ar" ? "الموقع" : "Location"}
              </h4>
              {project.latitude && project.longitude ? (
                <>
                  <MapPicker latitude={project.latitude} longitude={project.longitude} readonly height="220px" zoom={14} />
                  <p className="text-[10px] text-neutral" dir="ltr">
                    {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center h-[220px] bg-muted/10 rounded-md text-neutral text-sm">
                  <MapPin size={24} className="opacity-30 ml-2" />
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
            <p className="text-sm text-neutral">
              {project.buildings?.length ?? 0} {lang === "ar" ? "مبنى" : "buildings"} • {totalUnits} {lang === "ar" ? "وحدة" : "units"}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditingBuildingId(null);
                setBuildingForm({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential" });
                setShowBuildingForm(true);
              }}
              style={{ display: "inline-flex" }}
            >
              <Plus size={16} />
              {lang === "ar" ? "إضافة مبنى" : "Add Building"}
            </Button>
          </div>

          {/* Building Form */}
          {showBuildingForm && (
            <div className="border border-secondary/30 bg-secondary/5 rounded-md p-5 space-y-4">
              <h4 className="text-xs font-bold text-secondary">
                {editingBuildingId ? (lang === "ar" ? "تعديل المبنى" : "Edit Building") : (lang === "ar" ? "مبنى جديد" : "New Building")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "اسم المبنى *" : "Building Name *"}</label>
                  <input value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "نوع المبنى" : "Type"}</label>
                  <select value={buildingForm.buildingType} onChange={(e) => setBuildingForm({ ...buildingForm, buildingType: e.target.value })} className={inputClass}>
                    {Object.entries(buildingTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v[lang]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "عدد الأدوار" : "Floors"}</label>
                  <input type="number" value={buildingForm.numberOfFloors} onChange={(e) => setBuildingForm({ ...buildingForm, numberOfFloors: e.target.value })} className={inputClass} min="1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
                  <input type="number" value={buildingForm.buildingAreaSqm} onChange={(e) => setBuildingForm({ ...buildingForm, buildingAreaSqm: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" onClick={handleSaveBuilding} disabled={!buildingForm.name || savingBuilding} style={{ display: "inline-flex" }}>
                  {savingBuilding ? <Spinner size={14} className="animate-spin" /> : null}
                  {editingBuildingId ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إضافة" : "Add")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowBuildingForm(false); setEditingBuildingId(null); }} style={{ display: "inline-flex" }}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          )}

          {/* Building Cards */}
          {(!project.buildings || project.buildings.length === 0) && !showBuildingForm && (
            <div className="bg-white rounded-md shadow-card border border-border p-12 text-center">
              <Buildings size={48} className="text-neutral/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد مباني" : "No Buildings"}</h3>
              <p className="text-sm text-neutral mt-1">{lang === "ar" ? "أضف أول مبنى للمشروع" : "Add the first building to this project"}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.buildings?.map((b: any) => (
              <div key={b.id} className="bg-white rounded-md shadow-card border border-border p-5 hover:shadow-raised transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Buildings size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{b.name}</p>
                      <p className="text-[10px] text-neutral">
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
                      style={{ display: "inline-flex" }}
                    >
                      <PencilSimple size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteBuilding(b.id)} style={{ display: "inline-flex" }}>
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-neutral uppercase font-bold">{lang === "ar" ? "أدوار" : "Floors"}</p>
                    <p className="font-bold text-primary">{b.numberOfFloors ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral uppercase font-bold">{lang === "ar" ? "المساحة" : "Area"}</p>
                    <p className="font-bold text-primary">{b.buildingAreaSqm ? `${fmt(b.buildingAreaSqm)} م²` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral uppercase font-bold">{lang === "ar" ? "وحدات" : "Units"}</p>
                    <p className="font-bold text-primary">{b.units?.length ?? 0}</p>
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
                { label: lang === "ar" ? "مفتوحة" : "Open", value: maintenanceRequests.filter((m: any) => m.status === "OPEN").length, color: "text-accent" },
                { label: lang === "ar" ? "قيد التنفيذ" : "In Progress", value: maintenanceRequests.filter((m: any) => ["IN_PROGRESS", "ASSIGNED"].includes(m.status)).length, color: "text-primary" },
                { label: lang === "ar" ? "تم الحل" : "Resolved", value: maintenanceRequests.filter((m: any) => ["RESOLVED", "CLOSED"].includes(m.status)).length, color: "text-secondary" },
                { label: lang === "ar" ? "الإجمالي" : "Total", value: maintenanceRequests.length, color: "text-neutral" },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-md shadow-card border border-border p-4">
                  <span className="text-[10px] font-bold uppercase text-neutral">{kpi.label}</span>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral">
              {maintenanceRequests.length} {lang === "ar" ? "طلب صيانة" : "maintenance requests"}
            </p>
            <Link href="/dashboard/maintenance">
              <Button variant="secondary" size="sm" className="gap-2" style={{ display: "inline-flex" }}>
                <Wrench size={14} />
                {lang === "ar" ? "إدارة الصيانة" : "Manage Maintenance"}
              </Button>
            </Link>
          </div>

          {loadingMaintenance ? (
            <div className="flex justify-center py-12">
              <Spinner className="animate-spin text-primary" size={24} />
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="bg-white rounded-md shadow-card border border-border p-12 text-center">
              <Wrench size={48} className="text-neutral/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد طلبات صيانة" : "No Maintenance Requests"}</h3>
              <p className="text-sm text-neutral mt-1">{lang === "ar" ? "لا توجد طلبات صيانة مرتبطة بهذا المشروع" : "No maintenance requests linked to this project"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "العنوان" : "Title"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "الوحدة" : "Unit"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "الأولوية" : "Priority"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "المُعيَّن" : "Assigned"}</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRequests.map((m: any) => {
                    const mStatus = maintenanceStatusLabels[m.status] ?? { ar: m.status, en: m.status, variant: "draft" };
                    const mPriority = maintenancePriorityLabels[m.priority] ?? { ar: m.priority, en: m.priority, color: "text-neutral" };
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/maintenance/${m.id}`} className="font-medium text-primary hover:text-secondary transition-colors">
                            {m.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral">{m.unit?.number} — {m.unit?.building?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${mPriority.color}`}>{mPriority[lang]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={mStatus.variant as any} className="text-[10px]">{mStatus[lang]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral">{m.assignedTo?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-neutral">{new Date(m.createdAt).toLocaleDateString("en-SA")}</td>
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
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral">
              {project.documents?.length ?? 0} {lang === "ar" ? "وثيقة" : "documents"}
            </p>
            <div className="flex items-center gap-3">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-xs bg-white">
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
                      <CloudArrowUp size={14} weight="fill" />
                      {lang === "ar" ? "رفع وثيقة" : "Upload"}
                    </div>
                  ),
                }}
              />
            </div>
          </div>

          {(!project.documents || project.documents.length === 0) ? (
            <div className="bg-white rounded-md shadow-card border border-border p-12 text-center">
              <FileText size={48} className="text-neutral/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد وثائق" : "No Documents"}</h3>
              <p className="text-sm text-neutral mt-1">{lang === "ar" ? "ارفع وثائق بلدي والمستندات المطلوبة" : "Upload Balady documents and required files"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "الاسم" : "Name"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "النوع" : "Type"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "التصنيف" : "Category"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.documents.map((doc: any) => (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-secondary min-w-[16px]" />
                          <span className="font-medium text-primary truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral text-xs uppercase">{doc.type}</td>
                      <td className="px-4 py-3">
                        <Badge variant="draft" className="text-[10px]">{docCategoryLabels[doc.category]?.[lang] ?? doc.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral">{formatDualDate(doc.createdAt, lang)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" style={{ display: "inline-flex" }}>
                              <DownloadSimple size={14} />
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteDoc(doc.id)} style={{ display: "inline-flex" }}>
                            <Trash size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] text-neutral uppercase font-bold">{label}</p>
      <p className="text-sm text-primary font-medium">{value || "—"}</p>
    </div>
  );
}
