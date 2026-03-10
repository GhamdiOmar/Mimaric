"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Spinner, CheckCircle, Circle, MapPin, ArrowRight,
  Warning, ShieldCheck, Scales, Plus, Trash, PencilSimple,
  ClockCountdown, SealCheck, XCircle, Timer, CaretDown,
} from "@phosphor-icons/react";
import { Button, Badge, SARAmount } from "@repo/ui";
import { getLandDetail, updateLandStatus, getDueDiligence, updateDueDiligenceItems } from "../../../actions/land";
import { getConstraints, createConstraint, updateConstraint, deleteConstraint, getConstraintStats } from "../../../actions/constraints";
import { getFeasibilityAssessments, createFeasibilityAssessment, updateFeasibilityAssessment, getSuitabilityScore } from "../../../actions/feasibility";
import { getDecisionGates, requestStageTransition, resolveDecisionGate, getStageHistory } from "../../../actions/decision-gates";
import MapPicker from "../../../../components/MapPicker";

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const STEPS = [
  { status: "LAND_IDENTIFIED", label: { ar: "تم التحديد", en: "Identified" } },
  { status: "LAND_UNDER_REVIEW", label: { ar: "قيد المراجعة", en: "Under Review" } },
  { status: "LAND_ACQUIRED", label: { ar: "تم الاستحواذ", en: "Acquired" } },
];

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  LEGAL: { ar: "قانوني", en: "Legal" },
  ZONING: { ar: "تنظيم عمراني", en: "Zoning" },
  VALUATION: { ar: "تقييم", en: "Valuation" },
  ENVIRONMENTAL: { ar: "بيئي", en: "Environmental" },
  UTILITY: { ar: "مرافق", en: "Utility" },
};

const MAIN_TABS = [
  { key: "duediligence", label: { ar: "الفحص النافي للجهالة", en: "Due Diligence" } },
  { key: "constraints", label: { ar: "القيود", en: "Constraints" } },
  { key: "feasibility", label: { ar: "تقييمات الجدوى", en: "Feasibility" } },
  { key: "gates", label: { ar: "بوابات القرار", en: "Decision Gates" } },
];

const CONSTRAINT_TYPES: Record<string, { ar: string; en: string }> = {
  ZONING: { ar: "تنظيم عمراني", en: "Zoning" },
  TOPOGRAPHY: { ar: "طبوغرافيا", en: "Topography" },
  FLOOD_ZONE: { ar: "منطقة فيضان", en: "Flood Zone" },
  UTILITY_ACCESS: { ar: "وصول المرافق", en: "Utility Access" },
  ENVIRONMENTAL: { ar: "بيئي", en: "Environmental" },
  ROAD_ACCESS: { ar: "وصول طرق", en: "Road Access" },
  SETBACK: { ar: "ارتداد", en: "Setback" },
  HEIGHT_LIMIT: { ar: "حد الارتفاع", en: "Height Limit" },
  HERITAGE: { ar: "تراث", en: "Heritage" },
  OTHER: { ar: "أخرى", en: "Other" },
};

const SEVERITY_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  LOW: { ar: "منخفض", en: "Low", color: "bg-secondary/15 text-secondary border-secondary/30" },
  MEDIUM: { ar: "متوسط", en: "Medium", color: "bg-accent/15 text-amber-700 border-accent/30" },
  HIGH: { ar: "عالي", en: "High", color: "bg-warning/15 text-warning border-warning/30" },
  BLOCKER: { ar: "مانع", en: "Blocker", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const CONSTRAINT_STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  IDENTIFIED: { ar: "محدد", en: "Identified", color: "bg-info/15 text-info border-info/30" },
  UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under Review", color: "bg-accent/15 text-amber-700 border-accent/30" },
  MITIGATED: { ar: "تم التخفيف", en: "Mitigated", color: "bg-secondary/15 text-secondary border-secondary/30" },
  ACCEPTED: { ar: "مقبول", en: "Accepted", color: "bg-primary/15 text-primary border-primary/30" },
  REJECTED: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const FEASIBILITY_TYPES: Record<string, { ar: string; en: string; icon: string }> = {
  LEGAL: { ar: "قانوني", en: "Legal", icon: "⚖️" },
  COMMERCIAL: { ar: "تجاري", en: "Commercial", icon: "📊" },
  TECHNICAL: { ar: "فني", en: "Technical", icon: "🔧" },
  ENVIRONMENTAL_FEASIBILITY: { ar: "بيئي", en: "Environmental", icon: "🌿" },
  FINANCIAL: { ar: "مالي", en: "Financial", icon: "💰" },
};

const RECOMMENDATION_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  GO: { ar: "مضي قدماً", en: "Go", color: "bg-secondary/15 text-secondary border-secondary/30" },
  NO_GO: { ar: "عدم المضي", en: "No Go", color: "bg-destructive/15 text-destructive border-destructive/30" },
  CONDITIONAL: { ar: "مشروط", en: "Conditional", color: "bg-accent/15 text-amber-700 border-accent/30" },
};

const GATE_DECISION_CONFIG: Record<string, { ar: string; en: string; color: string; icon: any }> = {
  PENDING: { ar: "في الانتظار", en: "Pending", color: "bg-accent/15 text-amber-700 border-accent/30", icon: ClockCountdown },
  APPROVED: { ar: "موافق", en: "Approved", color: "bg-secondary/15 text-secondary border-secondary/30", icon: SealCheck },
  REJECTED: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
  DEFERRED: { ar: "مؤجل", en: "Deferred", color: "bg-info/15 text-info border-info/30", icon: Timer },
};

const STAGE_LABELS: Record<string, { ar: string; en: string }> = {
  LAND_IDENTIFIED: { ar: "تم التحديد", en: "Identified" },
  LAND_UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under Review" },
  LAND_ACQUIRED: { ar: "تم الاستحواذ", en: "Acquired" },
  CONCEPT_DESIGN: { ar: "التصميم المبدئي", en: "Concept Design" },
  SUBDIVISION_PLANNING: { ar: "تخطيط التقسيم", en: "Subdivision" },
  AUTHORITY_SUBMISSION: { ar: "تقديم للجهات", en: "Authority Submission" },
  INFRASTRUCTURE_PLANNING: { ar: "تخطيط البنية التحتية", en: "Infrastructure" },
  INVENTORY_STRUCTURING: { ar: "هيكلة المخزون", en: "Inventory" },
  PRICING_PACKAGING: { ar: "التسعير", en: "Pricing" },
  LAUNCH_READINESS: { ar: "جاهزية الإطلاق", en: "Launch Ready" },
  OFF_PLAN_LAUNCHED: { ar: "تم الإطلاق", en: "Launched" },
  PLANNING: { ar: "التخطيط", en: "Planning" },
};

export default function LandDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [land, setLand] = React.useState<any>(null);
  const [checklists, setChecklists] = React.useState<any[]>([]);
  const [constraints, setConstraints] = React.useState<any[]>([]);
  const [constraintStats, setConstraintStats] = React.useState<any>(null);
  const [assessments, setAssessments] = React.useState<any[]>([]);
  const [suitabilityScore, setSuitabilityScore] = React.useState<number | null>(null);
  const [gates, setGates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("duediligence");
  const [ddTab, setDdTab] = React.useState("LEGAL");
  const [showConstraintModal, setShowConstraintModal] = React.useState(false);
  const [showFeasibilityModal, setShowFeasibilityModal] = React.useState(false);
  const [showGateModal, setShowGateModal] = React.useState(false);

  React.useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [detail, dd, cons, stats, feasi, score, gateList] = await Promise.all([
        getLandDetail(id as string),
        getDueDiligence(id as string),
        getConstraints(id as string),
        getConstraintStats(id as string),
        getFeasibilityAssessments(id as string),
        getSuitabilityScore(id as string),
        getStageHistory(id as string),
      ]);
      setLand(detail);
      setChecklists(dd);
      setConstraints(cons);
      setConstraintStats(stats);
      setAssessments(feasi);
      setSuitabilityScore(score);
      setGates(gateList);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleStatusTransition(newStatus: string) {
    setSaving(true);
    try {
      await updateLandStatus(id as string, newStatus);
      await load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleToggleItem(checklistId: string, itemIdx: number) {
    const cl = checklists.find((c) => c.id === checklistId);
    if (!cl) return;
    const items = [...cl.items];
    items[itemIdx] = { ...items[itemIdx], checked: !items[itemIdx].checked };
    await updateDueDiligenceItems(checklistId, items);
    setChecklists((prev) => prev.map((c) => c.id === checklistId ? { ...c, items } : c));
  }

  async function handleConvertToProject() {
    setSaving(true);
    try {
      await updateLandStatus(id as string, "PLANNING");
      router.push(`/dashboard/projects/${id}`);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDeleteConstraint(constraintId: string) {
    try {
      await deleteConstraint(constraintId);
      await load();
    } catch (e) { console.error(e); }
  }

  async function handleResolveGate(gateId: string, decision: "APPROVED" | "REJECTED" | "DEFERRED") {
    setSaving(true);
    try {
      await resolveDecisionGate(gateId, { decision });
      await load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>;
  if (!land) return <div className="text-center py-20 text-neutral">لم يتم العثور على الأرض</div>;

  const currentStepIdx = STEPS.findIndex((s) => s.status === land.status);
  const allDDComplete = checklists.length > 0 && checklists.every((c) => c.completedAt);
  const activeChecklist = checklists.find((c) => c.category === ddTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/land")}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{land.name}</h1>
          <p className="text-sm text-neutral mt-0.5">{[land.city, land.district, land.region].filter(Boolean).join(", ")}</p>
        </div>
        {suitabilityScore !== null && (
          <div className="text-center">
            <div className={`text-2xl font-black ${suitabilityScore >= 70 ? "text-secondary" : suitabilityScore >= 40 ? "text-amber-600" : "text-destructive"}`}>
              {suitabilityScore}%
            </div>
            <span className="text-[10px] font-bold text-neutral uppercase">{lang === "ar" ? "درجة الملاءمة" : "Suitability"}</span>
          </div>
        )}
      </div>

      {/* Acquisition Workflow Stepper */}
      <div className="bg-card rounded-md shadow-card border border-border p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-6">{lang === "ar" ? "مسار الاستحواذ" : "Acquisition Workflow"}</h3>
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${idx <= currentStepIdx ? "bg-secondary" : "bg-muted text-neutral"}`}>
                  {idx < currentStepIdx ? <CheckCircle size={24} weight="fill" /> : <span className="font-bold">{idx + 1}</span>}
                </div>
                <span className={`text-xs font-bold ${idx <= currentStepIdx ? "text-secondary" : "text-neutral"}`}>{step.label[lang]}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${idx < currentStepIdx ? "bg-secondary" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {land.status === "LAND_IDENTIFIED" && (
            <Button size="sm" className="gap-2" onClick={() => handleStatusTransition("LAND_UNDER_REVIEW")} disabled={saving}>
              <ArrowRight size={14} />{lang === "ar" ? "بدء المراجعة" : "Start Review"}
            </Button>
          )}
          {land.status === "LAND_UNDER_REVIEW" && (
            <Button size="sm" className="gap-2" onClick={() => handleStatusTransition("LAND_ACQUIRED")} disabled={saving || !allDDComplete}>
              {saving ? <Spinner size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {lang === "ar" ? "تأكيد الاستحواذ" : "Mark Acquired"}
            </Button>
          )}
          {land.status === "LAND_UNDER_REVIEW" && !allDDComplete && (
            <span className="text-xs text-neutral">{lang === "ar" ? "أكمل جميع قوائم الفحص أولاً" : "Complete all checklists first"}</span>
          )}
          {land.status === "LAND_ACQUIRED" && (
            <Button size="sm" variant="secondary" className="gap-2" onClick={handleConvertToProject} disabled={saving}>
              {lang === "ar" ? "تحويل إلى مشروع" : "Convert to Project"}
            </Button>
          )}
        </div>
      </div>

      {/* Land Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: lang === "ar" ? "رقم الصك" : "Deed #", value: land.deedNumber || "—" },
          { label: lang === "ar" ? "المساحة" : "Area", value: land.totalAreaSqm ? `${fmt(land.totalAreaSqm)} م²` : "—" },
          { label: lang === "ar" ? "المالك" : "Owner", value: land.landOwner || "—" },
          { label: lang === "ar" ? "القيمة التقديرية" : "Est. Value", value: land.estimatedValueSar ? <SARAmount value={Number(land.estimatedValueSar)} size={14} /> : "—" },
          {
            label: lang === "ar" ? "القيود" : "Constraints",
            value: constraintStats ? (
              <span className="flex items-center gap-1">
                {constraintStats.total}
                {constraintStats.blockers > 0 && <span className="text-destructive text-xs">({constraintStats.blockers} {lang === "ar" ? "مانع" : "blocker"})</span>}
              </span>
            ) : "0",
          },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-md shadow-card border border-border p-4">
            <span className="text-[10px] font-bold uppercase text-neutral">{item.label}</span>
            <p className="text-lg font-bold text-primary mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Location Map */}
      <div className="bg-card rounded-md shadow-card border border-border p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">
          {lang === "ar" ? "الموقع على الخريطة" : "Location on Map"}
        </h3>
        {land.latitude && land.longitude ? (
          <div>
            <MapPicker latitude={land.latitude} longitude={land.longitude} readonly height="250px" zoom={14} />
            <p className="text-[10px] text-neutral mt-2" dir="ltr">
              {land.latitude.toFixed(6)}, {land.longitude.toFixed(6)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral">
            <MapPin size={32} className="mb-2 opacity-30" />
            <p className="text-sm">{lang === "ar" ? "لم يتم تحديد الموقع بعد" : "No location set"}</p>
          </div>
        )}
      </div>

      {/* Main Section Tabs */}
      <div className="bg-card rounded-md shadow-card border border-border">
        <div className="flex border-b border-border overflow-x-auto">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                mainTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral hover:text-primary"
              }`}
            >
              {tab.label[lang]}
              {tab.key === "constraints" && constraintStats?.total > 0 && (
                <span className="mr-2 text-[10px] bg-muted rounded-full px-1.5 py-0.5">{constraintStats.total}</span>
              )}
              {tab.key === "feasibility" && assessments.length > 0 && (
                <span className="mr-2 text-[10px] bg-muted rounded-full px-1.5 py-0.5">{assessments.length}</span>
              )}
              {tab.key === "gates" && gates.length > 0 && (
                <span className="mr-2 text-[10px] bg-muted rounded-full px-1.5 py-0.5">{gates.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Due Diligence Tab */}
        {mainTab === "duediligence" && (
          <div>
            <div className="flex border-b border-border overflow-x-auto">
              {Object.keys(CATEGORY_LABELS).map((cat) => {
                const cl = checklists.find((c) => c.category === cat);
                const items = cl?.items ?? [];
                const done = items.filter((i: any) => i.checked).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setDdTab(cat)}
                    className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${ddTab === cat ? "border-primary text-primary" : "border-transparent text-neutral hover:text-primary"}`}
                  >
                    {CATEGORY_LABELS[cat]?.[lang] ?? cat}
                    <span className="mr-1 text-[10px] text-neutral">({done}/{items.length})</span>
                  </button>
                );
              })}
            </div>
            <div className="p-6 space-y-3">
              {activeChecklist?.items.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleToggleItem(activeChecklist.id, idx)}
                  className="flex items-center gap-3 w-full text-start p-3 rounded-md hover:bg-muted/20 transition-colors"
                >
                  {item.checked ? (
                    <CheckCircle size={20} weight="fill" className="text-secondary min-w-[20px]" />
                  ) : (
                    <Circle size={20} className="text-neutral min-w-[20px]" />
                  )}
                  <span className={`text-sm ${item.checked ? "text-neutral line-through" : "text-primary font-medium"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
              {activeChecklist && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${(activeChecklist.items.filter((i: any) => i.checked).length / activeChecklist.items.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral">
                      {activeChecklist.items.filter((i: any) => i.checked).length}/{activeChecklist.items.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Constraints Tab */}
        {mainTab === "constraints" && (
          <div className="p-6">
            {/* Constraint Stats */}
            {constraintStats && constraintStats.total > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: lang === "ar" ? "الإجمالي" : "Total", value: constraintStats.total, color: "text-primary" },
                  { label: lang === "ar" ? "مانع" : "Blockers", value: constraintStats.blockers, color: "text-destructive" },
                  { label: lang === "ar" ? "عالي" : "High", value: constraintStats.high, color: "text-warning" },
                  { label: lang === "ar" ? "تم التخفيف" : "Mitigated", value: constraintStats.mitigated, color: "text-secondary" },
                  { label: lang === "ar" ? "غير محلول" : "Unresolved", value: constraintStats.unresolved, color: "text-amber-600" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 bg-muted/20 rounded-md">
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] font-bold text-neutral uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "سجل القيود" : "Constraint Records"}</h4>
              <Button size="sm" className="gap-1 text-xs" onClick={() => setShowConstraintModal(true)}>
                <Plus size={14} />{lang === "ar" ? "إضافة قيد" : "Add Constraint"}
              </Button>
            </div>

            {constraints.length === 0 ? (
              <div className="text-center py-12 text-neutral">
                <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{lang === "ar" ? "لا توجد قيود مسجلة" : "No constraints recorded"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {constraints.map((c: any) => {
                  const typeLabel = CONSTRAINT_TYPES[c.type]?.[lang] ?? c.type;
                  const sevConfig = (SEVERITY_CONFIG[c.severity] ?? SEVERITY_CONFIG["MEDIUM"])!;
                  const statusConf = (CONSTRAINT_STATUS_CONFIG[c.status] ?? CONSTRAINT_STATUS_CONFIG["IDENTIFIED"])!;
                  return (
                    <div key={c.id} className="border border-border rounded-md p-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-primary">{c.label}</span>
                            <Badge className={`text-[10px] border ${sevConfig.color}`}>{sevConfig[lang]}</Badge>
                            <Badge className={`text-[10px] border ${statusConf.color}`}>{statusConf[lang]}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral">
                            <span>{typeLabel}</span>
                            {c.source && <><span>·</span><span>{c.source}</span></>}
                          </div>
                          {c.description && <p className="text-xs text-neutral mt-2">{c.description}</p>}
                          {c.mitigationPlan && (
                            <p className="text-xs text-secondary mt-1">
                              <span className="font-bold">{lang === "ar" ? "خطة التخفيف:" : "Mitigation:"}</span> {c.mitigationPlan}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleDeleteConstraint(c.id)} className="text-neutral hover:text-destructive transition-colors p-1">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Feasibility Tab */}
        {mainTab === "feasibility" && (
          <div className="p-6">
            {/* Suitability Score */}
            {suitabilityScore !== null && (
              <div className="mb-6 p-4 bg-muted/20 rounded-md flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-black ${suitabilityScore >= 70 ? "text-secondary" : suitabilityScore >= 40 ? "text-amber-600" : "text-destructive"}`}>
                    {suitabilityScore}%
                  </div>
                  <div className="text-[10px] font-bold text-neutral uppercase">{lang === "ar" ? "درجة الملاءمة الكلية" : "Overall Suitability"}</div>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${suitabilityScore >= 70 ? "bg-secondary" : suitabilityScore >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                      style={{ width: `${suitabilityScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral mt-1">
                    {lang === "ar"
                      ? "قانوني 25% · تجاري 25% · فني 20% · بيئي 15% · مالي 15%"
                      : "Legal 25% · Commercial 25% · Technical 20% · Environmental 15% · Financial 15%"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "تقييمات الجدوى" : "Feasibility Assessments"}</h4>
              <Button size="sm" className="gap-1 text-xs" onClick={() => setShowFeasibilityModal(true)}>
                <Plus size={14} />{lang === "ar" ? "إضافة تقييم" : "Add Assessment"}
              </Button>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-12 text-neutral">
                <Scales size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{lang === "ar" ? "لا توجد تقييمات جدوى" : "No feasibility assessments"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessments.map((a: any) => {
                  const typeConfig = FEASIBILITY_TYPES[a.type] ?? { ar: a.type, en: a.type, icon: "📋" };
                  const recConfig = a.recommendation ? RECOMMENDATION_CONFIG[a.recommendation] : null;
                  return (
                    <div key={a.id} className="border border-border rounded-md p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeConfig.icon}</span>
                          <span className="text-sm font-bold text-primary">{typeConfig[lang]}</span>
                        </div>
                        {a.score !== null && (
                          <div className={`text-xl font-black ${a.score >= 70 ? "text-secondary" : a.score >= 40 ? "text-amber-600" : "text-destructive"}`}>
                            {a.score}
                          </div>
                        )}
                      </div>
                      {recConfig && (
                        <Badge className={`text-[10px] border mb-2 ${recConfig.color}`}>{recConfig[lang]}</Badge>
                      )}
                      {a.score !== null && (
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${a.score >= 70 ? "bg-secondary" : a.score >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                            style={{ width: `${a.score}%` }}
                          />
                        </div>
                      )}
                      {a.notes && <p className="text-xs text-neutral mt-1">{a.notes}</p>}
                      <div className="text-[10px] text-neutral mt-2">
                        {a.assessedAt ? new Date(a.assessedAt).toLocaleDateString("ar-SA") : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Decision Gates Tab */}
        {mainTab === "gates" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "سجل بوابات القرار" : "Decision Gate History"}</h4>
              <Button size="sm" className="gap-1 text-xs" onClick={() => setShowGateModal(true)}>
                <Plus size={14} />{lang === "ar" ? "طلب انتقال" : "Request Transition"}
              </Button>
            </div>

            {gates.length === 0 ? (
              <div className="text-center py-12 text-neutral">
                <SealCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{lang === "ar" ? "لا توجد بوابات قرار" : "No decision gates"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gates.map((g: any) => {
                  const decConfig = (GATE_DECISION_CONFIG[g.decision] ?? GATE_DECISION_CONFIG["PENDING"])!;
                  const DecIcon = decConfig.icon;
                  const fromLabel = STAGE_LABELS[g.fromStage]?.[lang] ?? g.fromStage;
                  const toLabel = STAGE_LABELS[g.toStage]?.[lang] ?? g.toStage;
                  return (
                    <div key={g.id} className="border border-border rounded-md p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <DecIcon size={18} weight="fill" className={decConfig.color.includes("secondary") ? "text-secondary" : decConfig.color.includes("destructive") ? "text-destructive" : "text-amber-600"} />
                            <span className="text-sm font-bold text-primary">
                              {fromLabel} → {toLabel}
                            </span>
                            <Badge className={`text-[10px] border ${decConfig.color}`}>{decConfig[lang]}</Badge>
                          </div>
                          {g.notes && <p className="text-xs text-neutral">{g.notes}</p>}
                          <div className="text-[10px] text-neutral mt-1">
                            {g.createdAt ? new Date(g.createdAt).toLocaleDateString("ar-SA") : ""}
                            {g.decidedAt && ` · ${lang === "ar" ? "تم القرار" : "Decided"}: ${new Date(g.decidedAt).toLocaleDateString("ar-SA")}`}
                          </div>
                        </div>
                        {g.decision === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs h-7 gap-1"
                              onClick={() => handleResolveGate(g.id, "APPROVED")}
                              disabled={saving}
                             
                            >
                              <SealCheck size={12} />{lang === "ar" ? "موافقة" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-7 gap-1"
                              onClick={() => handleResolveGate(g.id, "REJECTED")}
                              disabled={saving}
                             
                            >
                              <XCircle size={12} />{lang === "ar" ? "رفض" : "Reject"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Constraint Modal */}
      {showConstraintModal && (
        <AddConstraintModal
          lang={lang}
          projectId={id as string}
          onClose={() => setShowConstraintModal(false)}
          onSuccess={() => { setShowConstraintModal(false); load(); }}
        />
      )}

      {/* Add Feasibility Modal */}
      {showFeasibilityModal && (
        <AddFeasibilityModal
          lang={lang}
          projectId={id as string}
          onClose={() => setShowFeasibilityModal(false)}
          onSuccess={() => { setShowFeasibilityModal(false); load(); }}
        />
      )}

      {/* Request Gate Transition Modal */}
      {showGateModal && (
        <RequestGateModal
          lang={lang}
          projectId={id as string}
          currentStatus={land.status}
          onClose={() => setShowGateModal(false)}
          onSuccess={() => { setShowGateModal(false); load(); }}
        />
      )}
    </div>
  );
}

/* ─── Add Constraint Modal ─────────────────────────────────────────────── */
function AddConstraintModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    type: "ZONING",
    label: "",
    severity: "MEDIUM",
    description: "",
    source: "",
    mitigationPlan: "",
  });

  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createConstraint({ projectId, ...form });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "إضافة قيد جديد" : "Add New Constraint"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                {Object.entries(CONSTRAINT_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val[lang]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الخطورة" : "Severity"}</label>
              <select value={form.severity} onChange={set("severity")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                {Object.entries(SEVERITY_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val[lang]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الوصف المختصر *" : "Label *"}</label>
            <input required value={form.label} onChange={set("label")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "التفاصيل" : "Description"}</label>
            <textarea value={form.description} onChange={set("description")} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المصدر" : "Source"}</label>
            <input value={form.source} onChange={set("source")} className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder={lang === "ar" ? "مثال: أمانة الرياض" : "e.g. Municipality"} />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "خطة التخفيف" : "Mitigation Plan"}</label>
            <textarea value={form.mitigationPlan} onChange={set("mitigationPlan")} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Spinner size={14} className="animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Add Feasibility Assessment Modal ─────────────────────────────────── */
function AddFeasibilityModal({ lang, projectId, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    type: "LEGAL",
    score: "",
    recommendation: "",
    notes: "",
  });

  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createFeasibilityAssessment({
        projectId,
        type: form.type,
        score: form.score ? parseInt(form.score) : undefined,
        recommendation: form.recommendation || undefined,
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "إضافة تقييم جدوى" : "Add Feasibility Assessment"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "نوع التقييم *" : "Assessment Type *"}</label>
            <select value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
              {Object.entries(FEASIBILITY_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val[lang]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الدرجة (0-100)" : "Score (0-100)"}</label>
              <input type="number" min="0" max="100" value={form.score} onChange={set("score")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "التوصية" : "Recommendation"}</label>
              <select value={form.recommendation} onChange={set("recommendation")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                <option value="">—</option>
                {Object.entries(RECOMMENDATION_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val[lang]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Spinner size={14} className="animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Request Gate Transition Modal ─────────────────────────────────────── */
function RequestGateModal({ lang, projectId, currentStatus, onClose, onSuccess }: {
  lang: "ar" | "en"; projectId: string; currentStatus: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const VALID_TRANSITIONS: Record<string, string> = {
    LAND_IDENTIFIED: "LAND_UNDER_REVIEW",
    LAND_UNDER_REVIEW: "LAND_ACQUIRED",
    LAND_ACQUIRED: "CONCEPT_DESIGN",
    CONCEPT_DESIGN: "SUBDIVISION_PLANNING",
    SUBDIVISION_PLANNING: "AUTHORITY_SUBMISSION",
    AUTHORITY_SUBMISSION: "INFRASTRUCTURE_PLANNING",
    INFRASTRUCTURE_PLANNING: "INVENTORY_STRUCTURING",
    INVENTORY_STRUCTURING: "PRICING_PACKAGING",
    PRICING_PACKAGING: "LAUNCH_READINESS",
    LAUNCH_READINESS: "OFF_PLAN_LAUNCHED",
  };

  const nextStage = VALID_TRANSITIONS[currentStatus];
  const nextLabel = nextStage ? (STAGE_LABELS[nextStage]?.[lang] ?? nextStage) : null;
  const currentLabel = STAGE_LABELS[currentStatus]?.[lang] ?? currentStatus;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nextStage) return;
    setSaving(true);
    try {
      await requestStageTransition({ projectId, toStage: nextStage, notes: notes || undefined });
      onSuccess();
    } catch (err) { console.error(err); alert(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "طلب انتقال مرحلة" : "Request Stage Transition"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {nextStage ? (
            <>
              <div className="bg-muted/20 rounded-md p-4 text-center">
                <div className="flex items-center justify-center gap-3 text-sm font-bold text-primary">
                  <span>{currentLabel}</span>
                  <ArrowRight size={16} className="text-neutral" />
                  <span className="text-secondary">{nextLabel}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? <Spinner size={14} className="animate-spin" /> : null}
                  {lang === "ar" ? "إرسال الطلب" : "Submit Request"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-neutral">
              <p className="text-sm">{lang === "ar" ? "لا يوجد انتقال متاح من هذه المرحلة" : "No transition available from this stage"}</p>
              <Button type="button" variant="secondary" size="sm" onClick={onClose} className="mt-4">{lang === "ar" ? "إغلاق" : "Close"}</Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
