"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  CalendarCheck,
  Play,
  Pause,
  Pencil,
  Trash2,
  Zap,
} from "lucide-react";
import { Button, Badge, SARAmount, ResponsiveDialog } from "@repo/ui";
import {
  getPreventivePlans,
  createPreventivePlan,
  updatePreventivePlan,
  togglePreventivePlan,
  deletePreventivePlan,
  generateWorkOrdersFromPlans,
} from "../../../actions/preventive-maintenance";
import { getAssignableUsers, getUnitsForMaintenance } from "../../../actions/maintenance";

const categoryLabels: Record<string, { ar: string; en: string }> = {
  HVAC: { ar: "تكييف", en: "HVAC" },
  PLUMBING: { ar: "سباكة", en: "Plumbing" },
  ELECTRICAL: { ar: "كهرباء", en: "Electrical" },
  STRUCTURAL: { ar: "إنشائي", en: "Structural" },
  FIRE_SAFETY: { ar: "سلامة حريق", en: "Fire Safety" },
  ELEVATOR: { ar: "مصاعد", en: "Elevator" },
  CLEANING: { ar: "نظافة", en: "Cleaning" },
  LANDSCAPING: { ar: "تنسيق حدائق", en: "Landscaping" },
  PEST_CONTROL: { ar: "مكافحة آفات", en: "Pest Control" },
  GENERAL: { ar: "عام", en: "General" },
};

const priorityLabels: Record<string, { ar: string; en: string }> = {
  LOW: { ar: "منخفض", en: "Low" },
  MEDIUM: { ar: "متوسط", en: "Medium" },
  HIGH: { ar: "عالي", en: "High" },
  URGENT: { ar: "عاجل", en: "Urgent" },
};

const recurrenceLabels: Record<string, { ar: string; en: string }> = {
  DAILY: { ar: "يومي", en: "Daily" },
  WEEKLY: { ar: "أسبوعي", en: "Weekly" },
  BIWEEKLY: { ar: "كل أسبوعين", en: "Biweekly" },
  MONTHLY: { ar: "شهري", en: "Monthly" },
  QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
  SEMI_ANNUAL: { ar: "نصف سنوي", en: "Semi-Annual" },
  ANNUAL: { ar: "سنوي", en: "Annual" },
};

export default function PreventiveMaintenancePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  // Modal
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    recurrenceType: "MONTHLY",
    recurrenceInterval: "1",
    startDate: "",
    endDate: "",
    unitId: "",
    assignToId: "",
    estimatedCost: "",
    estimatedHours: "",
  });

  React.useEffect(() => {
    load();
    loadRefs();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getPreventivePlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    try {
      const [u, un] = await Promise.all([
        getAssignableUsers(),
        getUnitsForMaintenance(),
      ]);
      setUsers(u);
      setUnits(un);
    } catch (e) {
      console.error(e);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      category: "GENERAL",
      priority: "MEDIUM",
      recurrenceType: "MONTHLY",
      recurrenceInterval: "1",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      unitId: "",
      assignToId: "",
      estimatedCost: "",
      estimatedHours: "",
    });
    setShowModal(true);
  }

  function openEdit(plan: any) {
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      description: plan.description ?? "",
      category: plan.category ?? "GENERAL",
      priority: plan.priority ?? "MEDIUM",
      recurrenceType: plan.recurrenceType ?? "MONTHLY",
      recurrenceInterval: plan.recurrenceInterval?.toString() ?? "1",
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().slice(0, 10) : "",
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().slice(0, 10) : "",
      unitId: plan.unitId ?? "",
      assignToId: plan.assignToId ?? "",
      estimatedCost: plan.estimatedCost?.toString() ?? "",
      estimatedHours: plan.estimatedHours?.toString() ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.startDate) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        priority: form.priority,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: parseInt(form.recurrenceInterval) || 1,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        unitId: form.unitId || undefined,
        assignToId: form.assignToId || undefined,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
      };

      if (editingId) {
        await updatePreventivePlan(editingId, payload);
      } else {
        await createPreventivePlan(payload as any);
      }
      setShowModal(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(planId: string) {
    try {
      await togglePreventivePlan(planId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(planId: string) {
    const msg = lang === "ar"
      ? "هل أنت متأكد من حذف هذه الخطة؟"
      : "Are you sure you want to delete this plan?";
    if (!confirm(msg)) return;
    try {
      await deletePreventivePlan(planId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleGenerate() {
    const msg = lang === "ar"
      ? "سيتم إنشاء طلبات صيانة لجميع الخطط المستحقة. متابعة؟"
      : "This will create maintenance requests for all due plans. Continue?";
    if (!confirm(msg)) return;
    setGenerating(true);
    try {
      const result = await generateWorkOrdersFromPlans();
      alert(
        lang === "ar"
          ? `تم إنشاء ${result.created} طلب صيانة من ${result.total} خطة مستحقة.`
          : `Created ${result.created} work orders from ${result.total} due plans.`
      );
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  const inputClass = "w-full h-10 px-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/maintenance")}>
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "خطط الصيانة الوقائية" : "Preventive Maintenance Plans"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === "ar" ? "جدولة الصيانة الدورية للمباني والوحدات" : "Schedule recurring maintenance for buildings and units"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="gap-2" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-4 w-4" />}
            {lang === "ar" ? "تشغيل الآن" : "Run Now"}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {lang === "ar" ? "خطة جديدة" : "New Plan"}
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد خطط وقائية" : "No Preventive Plans"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "أضف أول خطة صيانة وقائية" : "Add your first preventive plan"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any) => {
            const cat = categoryLabels[plan.category] ?? { ar: plan.category, en: plan.category };
            const rec = recurrenceLabels[plan.recurrenceType] ?? { ar: plan.recurrenceType, en: plan.recurrenceType };
            const pri = priorityLabels[plan.priority] ?? { ar: plan.priority, en: plan.priority };
            const isDue = plan.nextRunDate && new Date(plan.nextRunDate) <= new Date();

            return (
              <div
                key={plan.id}
                className={`bg-card rounded-md shadow-card border p-5 transition-all ${
                  plan.isActive ? "border-border hover:shadow-lg" : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary">{plan.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{plan.description || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(plan.id)}>
                      {plan.isActive ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-secondary" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="draft" className="text-[9px]">{cat[lang]}</Badge>
                  <Badge variant={plan.isActive ? "available" : "maintenance"} className="text-[9px]">
                    {plan.isActive ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "متوقف" : "Paused")}
                  </Badge>
                  {isDue && plan.isActive && (
                    <Badge variant="overdue" className="text-[9px]">{lang === "ar" ? "مستحق" : "Due"}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "التكرار" : "Frequency"}</span>
                    <p className="font-medium text-primary">
                      {plan.recurrenceInterval > 1 ? `${lang === "ar" ? "كل" : "Every"} ${plan.recurrenceInterval} ` : ""}
                      {rec[lang]}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "الأولوية" : "Priority"}</span>
                    <p className="font-medium text-primary">{pri[lang]}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "التشغيل التالي" : "Next Run"}</span>
                    <p className={`font-medium ${isDue && plan.isActive ? "text-red-600" : "text-primary"}`}>
                      {plan.nextRunDate ? new Date(plan.nextRunDate).toLocaleDateString("en-SA") : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "أوامر عمل" : "Work Orders"}</span>
                    <p className="font-medium text-primary">{plan._count?.workOrders ?? 0}</p>
                  </div>
                  {plan.estimatedCost != null && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{lang === "ar" ? "التكلفة" : "Est. Cost"}</span>
                      <p className="font-medium text-primary"><SARAmount value={plan.estimatedCost} size={10} /></p>
                    </div>
                  )}
                </div>

                {(plan.unit || plan.building) && (
                  <div className="mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
                    {plan.unit && <span>{plan.unit.number} — {plan.unit.building?.name}</span>}
                    {plan.building && !plan.unit && <span>{plan.building.name}</span>}
                    {plan.assignTo && <span className="mr-2">• {plan.assignTo.name}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal — using shared ResponsiveDialog */}
      <ResponsiveDialog
        open={showModal}
        onOpenChange={setShowModal}
        title={
          editingId
            ? (lang === "ar" ? "تعديل خطة وقائية" : "Edit Plan")
            : (lang === "ar" ? "خطة وقائية جديدة" : "New Preventive Plan")
        }
        contentClassName="sm:max-w-[640px]"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} disabled={saving}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="preventive-plan-form" size="sm" disabled={saving || !form.title || !form.startDate} loading={saving}>
              {editingId ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إنشاء" : "Create")}
            </Button>
          </div>
        }
      >
        <form
          id="preventive-plan-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4 py-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "العنوان *" : "Title *"}</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder={lang === "ar" ? "مثال: فحص التكييف الشهري" : "e.g. Monthly HVAC Inspection"} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "الوصف" : "Description"}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-16 py-2`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "التصنيف" : "Category"}</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v[lang]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "الأولوية" : "Priority"}</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v[lang]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "التكرار" : "Recurrence"}</label>
              <select value={form.recurrenceType} onChange={(e) => setForm({ ...form, recurrenceType: e.target.value })} className={inputClass}>
                {Object.entries(recurrenceLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v[lang]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "فترة التكرار" : "Interval"}</label>
              <input type="number" min="1" value={form.recurrenceInterval} onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "تاريخ البدء *" : "Start Date *"}</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "تاريخ الانتهاء" : "End Date"}</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "الوحدة" : "Unit"}</label>
            <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className={inputClass}>
              <option value="">{lang === "ar" ? "— الكل —" : "— All —"}</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>{u.number}{u.buildingName ? ` — ${u.buildingName}` : ""}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "تعيين إلى" : "Default Assignee"}</label>
            <select value={form.assignToId} onChange={(e) => setForm({ ...form, assignToId: e.target.value })} className={inputClass}>
              <option value="">{lang === "ar" ? "— بدون —" : "— None —"}</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "التكلفة التقديرية" : "Est. Cost"}</label>
              <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} className={inputClass} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "الساعات التقديرية" : "Est. Hours"}</label>
              <input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} className={inputClass} placeholder="0" />
            </div>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
