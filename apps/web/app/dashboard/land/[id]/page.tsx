"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Spinner, CheckCircle, Circle, MapPin, ArrowRight } from "@phosphor-icons/react";
import { Button, Badge, SARAmount } from "@repo/ui";
import { getLandDetail, updateLandStatus, getDueDiligence, updateDueDiligenceItems, updateLandFields } from "../../../actions/land";
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

export default function LandDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lang] = React.useState<"ar" | "en">("ar");
  const [land, setLand] = React.useState<any>(null);
  const [checklists, setChecklists] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("LEGAL");

  React.useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [detail, dd] = await Promise.all([
        getLandDetail(id as string),
        getDueDiligence(id as string),
      ]);
      setLand(detail);
      setChecklists(dd);
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

  if (loading) return <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>;
  if (!land) return <div className="text-center py-20 text-neutral">لم يتم العثور على الأرض</div>;

  const currentStepIdx = STEPS.findIndex((s) => s.status === land.status);
  const allDDComplete = checklists.length > 0 && checklists.every((c) => c.completedAt);
  const activeChecklist = checklists.find((c) => c.category === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/land")} style={{ display: "inline-flex" }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">{land.name}</h1>
          <p className="text-sm text-neutral mt-0.5">{[land.city, land.district, land.region].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      {/* Acquisition Workflow Stepper */}
      <div className="bg-white rounded-md shadow-card border border-border p-6">
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
            <Button size="sm" className="gap-2" onClick={() => handleStatusTransition("LAND_UNDER_REVIEW")} disabled={saving} style={{ display: "inline-flex" }}>
              <ArrowRight size={14} />{lang === "ar" ? "بدء المراجعة" : "Start Review"}
            </Button>
          )}
          {land.status === "LAND_UNDER_REVIEW" && (
            <Button size="sm" className="gap-2" onClick={() => handleStatusTransition("LAND_ACQUIRED")} disabled={saving || !allDDComplete} style={{ display: "inline-flex" }}>
              {saving ? <Spinner size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {lang === "ar" ? "تأكيد الاستحواذ" : "Mark Acquired"}
            </Button>
          )}
          {land.status === "LAND_UNDER_REVIEW" && !allDDComplete && (
            <span className="text-xs text-neutral">{lang === "ar" ? "أكمل جميع قوائم الفحص أولاً" : "Complete all checklists first"}</span>
          )}
          {land.status === "LAND_ACQUIRED" && (
            <Button size="sm" variant="secondary" className="gap-2" onClick={handleConvertToProject} disabled={saving} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "تحويل إلى مشروع" : "Convert to Project"}
            </Button>
          )}
        </div>
      </div>

      {/* Land Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === "ar" ? "رقم الصك" : "Deed #", value: land.deedNumber || "—" },
          { label: lang === "ar" ? "المساحة" : "Area", value: land.totalAreaSqm ? `${fmt(land.totalAreaSqm)} م²` : "—" },
          { label: lang === "ar" ? "المالك" : "Owner", value: land.landOwner || "—" },
          { label: lang === "ar" ? "القيمة التقديرية" : "Est. Value", value: land.estimatedValueSar ? <SARAmount value={Number(land.estimatedValueSar)} size={14} /> : "—" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-md shadow-card border border-border p-4">
            <span className="text-[10px] font-bold uppercase text-neutral">{item.label}</span>
            <p className="text-lg font-bold text-primary mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Location Map */}
      <div className="bg-white rounded-md shadow-card border border-border p-6">
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

      {/* Due Diligence Checklists */}
      <div className="bg-white rounded-md shadow-card border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "قوائم الفحص النافي للجهالة" : "Due Diligence Checklists"}</h3>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {Object.keys(CATEGORY_LABELS).map((cat) => {
            const cl = checklists.find((c) => c.category === cat);
            const items = cl?.items ?? [];
            const done = items.filter((i: any) => i.checked).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === cat ? "border-primary text-primary" : "border-transparent text-neutral hover:text-primary"}`}
              >
                {CATEGORY_LABELS[cat]?.[lang] ?? cat}
                <span className="mr-1 text-[10px] text-neutral">({done}/{items.length})</span>
              </button>
            );
          })}
        </div>

        {/* Checklist Items */}
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
    </div>
  );
}
