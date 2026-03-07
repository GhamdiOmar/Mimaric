"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Spinner,
  CheckCircle,
  Clock,
  Warning,
  PencilSimple,
  UserCircle,
  Buildings,
  CalendarBlank,
  CurrencyCircleDollar,
  X,
} from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import { RiyalIcon } from "@repo/ui";
import {
  getMaintenanceRequest,
  updateMaintenanceRequest,
  getAssignableUsers,
} from "../../../actions/maintenance";
import { formatDualDate } from "../../../../lib/hijri";

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 2 }).format(n);

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

const statusLabels: Record<string, { ar: string; en: string; variant: string }> = {
  OPEN: { ar: "مفتوح", en: "Open", variant: "draft" },
  ASSIGNED: { ar: "معيّن", en: "Assigned", variant: "reserved" },
  IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", variant: "reserved" },
  ON_HOLD: { ar: "معلّق", en: "On Hold", variant: "maintenance" },
  RESOLVED: { ar: "تم الحل", en: "Resolved", variant: "available" },
  CLOSED: { ar: "مغلق", en: "Closed", variant: "sold" },
};

const priorityLabels: Record<string, { ar: string; en: string; color: string }> = {
  LOW: { ar: "منخفض", en: "Low", color: "text-neutral" },
  MEDIUM: { ar: "متوسط", en: "Medium", color: "text-primary" },
  HIGH: { ar: "عالي", en: "High", color: "text-accent" },
  URGENT: { ar: "عاجل", en: "Urgent", color: "text-red-600" },
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "OPEN"],
  IN_PROGRESS: ["ON_HOLD", "RESOLVED"],
  ON_HOLD: ["IN_PROGRESS", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["OPEN"],
};

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lang] = React.useState<"ar" | "en">("ar");
  const [request, setRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);

  // Inline edit states
  const [editingCost, setEditingCost] = React.useState(false);
  const [actualCost, setActualCost] = React.useState("");
  const [laborHours, setLaborHours] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [showAssign, setShowAssign] = React.useState(false);

  React.useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [data, usersData] = await Promise.all([
        getMaintenanceRequest(id as string),
        getAssignableUsers(),
      ]);
      setRequest(data);
      setUsers(usersData);
      setActualCost(data.actualCost?.toString() ?? "");
      setLaborHours(data.laborHours?.toString() ?? "");
      setNotes(data.notes ?? "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    try {
      await updateMaintenanceRequest(id as string, { status: newStatus });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(userId: string) {
    setSaving(true);
    try {
      await updateMaintenanceRequest(id as string, { assignedToId: userId || null });
      setShowAssign(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCost() {
    setSaving(true);
    try {
      await updateMaintenanceRequest(id as string, {
        actualCost: actualCost ? parseFloat(actualCost) : null,
        laborHours: laborHours ? parseFloat(laborHours) : null,
        notes: notes || null,
      });
      setEditingCost(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!request) {
    return <div className="text-center py-20 text-neutral">{lang === "ar" ? "لم يتم العثور على الطلب" : "Request not found"}</div>;
  }

  const status = statusLabels[request.status] ?? { ar: request.status, en: request.status, variant: "draft" };
  const priority = priorityLabels[request.priority] ?? { ar: request.priority, en: request.priority, color: "text-neutral" };
  const cat = categoryLabels[request.category] ?? { ar: request.category, en: request.category };
  const validTransitions = VALID_TRANSITIONS[request.status] ?? [];
  const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && !["RESOLVED", "CLOSED"].includes(request.status);
  const inputClass = "w-full h-9 px-3 bg-white border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/maintenance")} style={{ display: "inline-flex" }}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-primary">{request.title}</h1>
            <Badge variant={status.variant as any} className="text-xs">{status[lang]}</Badge>
            <span className={`text-xs font-bold ${priority.color}`}>{priority[lang]}</span>
            {request.isPreventive && (
              <Badge variant="available" className="text-[10px]">{lang === "ar" ? "وقائي" : "Preventive"}</Badge>
            )}
            {isOverdue && (
              <Badge variant="overdue" className="text-[10px] gap-1">
                <Warning size={10} />
                {lang === "ar" ? "متأخر" : "Overdue"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-neutral mt-1">
            {cat[lang]} • {request.unit?.number} — {request.unit?.building?.name}
            {request.unit?.building?.project?.name && ` (${request.unit.building.project.name})`}
          </p>
        </div>
      </div>

      {/* Status Workflow Buttons */}
      {validTransitions.length > 0 && (
        <div className="bg-white rounded-md shadow-card border border-border p-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-neutral">{lang === "ar" ? "تحويل الحالة:" : "Transition status:"}</span>
          {validTransitions.map((nextStatus: string) => {
            const nextLabel = statusLabels[nextStatus] ?? { ar: nextStatus, en: nextStatus };
            return (
              <Button
                key={nextStatus}
                size="sm"
                variant={nextStatus === "RESOLVED" ? "primary" : "secondary"}
                className="gap-2"
                onClick={() => handleStatusChange(nextStatus)}
                disabled={saving}
                style={{ display: "inline-flex" }}
              >
                {saving ? <Spinner size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                {nextLabel[lang]}
              </Button>
            );
          })}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details Card */}
        <div className="bg-white rounded-md shadow-card border border-border p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral">
            {lang === "ar" ? "تفاصيل الطلب" : "Request Details"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label={lang === "ar" ? "التصنيف" : "Category"} value={cat[lang]} />
            <InfoRow label={lang === "ar" ? "الأولوية" : "Priority"} value={<span className={priority.color}>{priority[lang]}</span>} />
            <InfoRow label={lang === "ar" ? "الوحدة" : "Unit"} value={`${request.unit?.number} — ${request.unit?.building?.name}`} />
            <InfoRow label={lang === "ar" ? "المبنى" : "Building"} value={request.unit?.building?.name} />
            <InfoRow label={lang === "ar" ? "تاريخ الإنشاء" : "Created"} value={formatDualDate(request.createdAt, lang)} />
            <InfoRow
              label={lang === "ar" ? "تاريخ الاستحقاق" : "Due Date"}
              value={
                request.dueDate ? (
                  <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                    {formatDualDate(request.dueDate, lang)}
                  </span>
                ) : "—"
              }
            />
            {request.scheduledDate && (
              <InfoRow label={lang === "ar" ? "تاريخ مجدول" : "Scheduled"} value={formatDualDate(request.scheduledDate, lang)} />
            )}
            {request.completedAt && (
              <InfoRow label={lang === "ar" ? "تاريخ الإنجاز" : "Completed"} value={formatDualDate(request.completedAt, lang)} />
            )}
          </div>
          {request.description && (
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] font-bold uppercase text-neutral mb-1">{lang === "ar" ? "الوصف" : "Description"}</p>
              <p className="text-sm text-primary">{request.description}</p>
            </div>
          )}
        </div>

        {/* Assignment & Cost Card */}
        <div className="space-y-6">
          {/* Assigned To */}
          <div className="bg-white rounded-md shadow-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral flex items-center gap-2">
                <UserCircle size={14} />
                {lang === "ar" ? "المُعيَّن" : "Assigned To"}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowAssign(!showAssign)} style={{ display: "inline-flex" }}>
                <PencilSimple size={14} />
              </Button>
            </div>
            {request.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{request.assignedTo.name}</p>
                  <p className="text-[10px] text-neutral">{request.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral">{lang === "ar" ? "لم يتم التعيين بعد" : "Not assigned"}</p>
            )}
            {showAssign && (
              <div className="pt-3 border-t border-border space-y-2">
                <select
                  onChange={(e) => handleAssign(e.target.value)}
                  className={inputClass}
                  defaultValue=""
                >
                  <option value="">{lang === "ar" ? "— بدون تعيين —" : "— Unassigned —"}</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cost Section */}
          <div className="bg-white rounded-md shadow-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral flex items-center gap-2">
                <CurrencyCircleDollar size={14} />
                {lang === "ar" ? "التكاليف" : "Costs"}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setEditingCost(!editingCost)} style={{ display: "inline-flex" }}>
                <PencilSimple size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow
                label={lang === "ar" ? "التكلفة التقديرية" : "Estimated"}
                value={
                  request.estimatedCost ? (
                    <span className="flex items-center gap-1"><RiyalIcon size={12} />{fmt(Number(request.estimatedCost))}</span>
                  ) : "—"
                }
              />
              <InfoRow
                label={lang === "ar" ? "التكلفة الفعلية" : "Actual"}
                value={
                  request.actualCost ? (
                    <span className="flex items-center gap-1"><RiyalIcon size={12} />{fmt(Number(request.actualCost))}</span>
                  ) : "—"
                }
              />
              <InfoRow
                label={lang === "ar" ? "ساعات العمل" : "Labor Hours"}
                value={request.laborHours ? `${request.laborHours} ${lang === "ar" ? "ساعة" : "hrs"}` : "—"}
              />
            </div>
            {editingCost && (
              <div className="pt-3 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral">{lang === "ar" ? "التكلفة الفعلية" : "Actual Cost"}</label>
                    <input type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} className={inputClass} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral">{lang === "ar" ? "ساعات العمل" : "Labor Hours"}</label>
                    <input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} className={inputClass} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} h-16 py-2`} />
                </div>
                <Button size="sm" onClick={handleSaveCost} disabled={saving} className="gap-2" style={{ display: "inline-flex" }}>
                  {saving && <Spinner size={12} className="animate-spin" />}
                  {lang === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {request.notes && !editingCost && (
        <div className="bg-white rounded-md shadow-card border border-border p-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral mb-2">
            {lang === "ar" ? "ملاحظات" : "Notes"}
          </h4>
          <p className="text-sm text-primary whitespace-pre-wrap">{request.notes}</p>
        </div>
      )}

      {/* Preventive Plan Link */}
      {request.preventivePlan && (
        <div className="bg-secondary/5 border border-secondary/20 rounded-md p-4 flex items-center gap-3">
          <CalendarBlank size={20} className="text-secondary" />
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">{request.preventivePlan.title}</p>
            <p className="text-[10px] text-neutral">{lang === "ar" ? "هذا الطلب جزء من خطة صيانة وقائية" : "This request is part of a preventive plan"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] text-neutral uppercase font-bold">{label}</p>
      <p className="text-sm text-primary font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}
