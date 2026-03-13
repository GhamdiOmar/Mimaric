"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  CheckCircle,
  Warning,
  Plus,
  Spinner,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Eye,
  CalendarCheck,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
import {
  getMaintenanceRequests,
  getMaintenanceStats,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getAssignableUsers,
  getUnitsForMaintenance,
} from "../../actions/maintenance";
import Link from "next/link";

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

export default function MaintenancePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [requests, setRequests] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("");

  // Modal
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    unitId: "",
    assignedToId: "",
    scheduledDate: "",
    estimatedCost: "",
    notes: "",
  });

  React.useEffect(() => {
    load();
    loadRefs();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (filterCategory) filters.category = filterCategory;
      if (search) filters.search = search;

      const [data, statsData] = await Promise.all([
        getMaintenanceRequests(filters),
        getMaintenanceStats(),
      ]);
      setRequests(data);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    try {
      const [u, un] = await Promise.all([getAssignableUsers(), getUnitsForMaintenance()]);
      setUsers(u);
      setUnits(un);
    } catch (e) {
      console.error(e);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterPriority, filterCategory]);

  function openCreate() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      category: "GENERAL",
      priority: "MEDIUM",
      unitId: units[0]?.id ?? "",
      assignedToId: "",
      scheduledDate: "",
      estimatedCost: "",
      notes: "",
    });
    setShowModal(true);
  }

  function openEdit(req: any) {
    setEditingId(req.id);
    setForm({
      title: req.title,
      description: req.description ?? "",
      category: req.category ?? "GENERAL",
      priority: req.priority ?? "MEDIUM",
      unitId: req.unitId ?? "",
      assignedToId: req.assignedToId ?? "",
      scheduledDate: req.scheduledDate ? new Date(req.scheduledDate).toISOString().slice(0, 10) ?? "" : "",
      estimatedCost: req.estimatedCost?.toString() ?? "",
      notes: req.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.unitId) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateMaintenanceRequest(editingId, {
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          priority: form.priority,
          assignedToId: form.assignedToId || null,
          scheduledDate: form.scheduledDate || null,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
          notes: form.notes || null,
        });
      } else {
        await createMaintenanceRequest({
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          priority: form.priority,
          unitId: form.unitId,
          assignedToId: form.assignedToId || undefined,
          scheduledDate: form.scheduledDate || undefined,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
          notes: form.notes || undefined,
        });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const msg = lang === "ar"
      ? "هل أنت متأكد من حذف طلب الصيانة هذا؟"
      : "Are you sure you want to delete this request?";
    if (!confirm(msg)) return;
    try {
      await deleteMaintenanceRequest(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const inputClass = "w-full h-10 px-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "طلبات الصيانة" : "Maintenance Requests"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "متابعة وإدارة طلبات الصيانة وتوزيع المهام." : "Track and manage maintenance requests."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/maintenance/preventive">
            <Button variant="secondary" size="sm" className="gap-2">
              <CalendarCheck size={16} />
              {lang === "ar" ? "الصيانة الوقائية" : "Preventive Plans"}
            </Button>
          </Link>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} />
            {lang === "ar" ? "طلب صيانة جديد" : "New Request"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: lang === "ar" ? "مفتوحة" : "Open", value: stats?.open ?? "—", icon: Warning, color: "text-accent" },
          { label: lang === "ar" ? "معيّنة" : "Assigned", value: stats?.assigned ?? "—", icon: UserCircle, color: "text-blue-600" },
          { label: lang === "ar" ? "قيد التنفيذ" : "In Progress", value: stats?.inProgress ?? "—", icon: Clock, color: "text-primary" },
          { label: lang === "ar" ? "متأخرة" : "Overdue", value: stats?.overdue ?? "—", icon: Warning, color: "text-red-600" },
          { label: lang === "ar" ? "مكتملة هذا الشهر" : "Completed (Month)", value: stats?.completedThisMonth ?? "—", icon: CheckCircle, color: "text-secondary" },
        ].map((kpi, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{kpi.label}</span>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
          </Card>
        ))}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالعنوان..." : "Search by title..."}
            className="w-full h-9 pr-10 pl-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 px-3 border border-border rounded-md text-xs bg-card">
          <option value="">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v[lang]}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="h-9 px-3 border border-border rounded-md text-xs bg-card">
          <option value="">{lang === "ar" ? "كل الأولويات" : "All Priorities"}</option>
          {Object.entries(priorityLabels).map(([k, v]) => (
            <option key={k} value={k}>{v[lang]}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-9 px-3 border border-border rounded-md text-xs bg-card">
          <option value="">{lang === "ar" ? "كل التصنيفات" : "All Categories"}</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v[lang]}</option>
          ))}
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral">
            <Wrench size={48} className="mb-4 text-muted" />
            <p className="text-sm font-primary">{lang === "ar" ? "لا توجد طلبات صيانة" : "No maintenance requests"}</p>
          </div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "ar" ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{lang === "ar" ? "الوحدة" : "Unit"}</TableHead>
                  <TableHead>{lang === "ar" ? "التصنيف" : "Category"}</TableHead>
                  <TableHead>{lang === "ar" ? "الأولوية" : "Priority"}</TableHead>
                  <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{lang === "ar" ? "المُعيَّن" : "Assigned"}</TableHead>
                  <TableHead>{lang === "ar" ? "الاستحقاق" : "Due"}</TableHead>
                  <TableHead>{lang === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r: any) => {
                  const status = statusLabels[r.status] ?? { ar: r.status, en: r.status, variant: "draft" };
                  const priority = priorityLabels[r.priority] ?? { ar: r.priority, en: r.priority, color: "text-neutral" };
                  const cat = categoryLabels[r.category] ?? { ar: r.category, en: r.category };
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !["RESOLVED", "CLOSED"].includes(r.status);

                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/dashboard/maintenance/${r.id}`} className="text-sm font-bold text-primary hover:text-secondary transition-colors">
                          {r.title}
                          {r.isPreventive && <span className="text-[9px] text-secondary mr-1">[وقائي]</span>}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-primary">
                        {r.unit?.number ?? "—"} — {r.unit?.building?.name ?? ""}
                      </TableCell>
                      <TableCell className="text-xs text-neutral">{cat[lang]}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${priority.color}`}>{priority[lang]}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant as any} className="text-[10px]">{status[lang]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral">{r.assignedTo?.name ?? "—"}</TableCell>
                      <TableCell>
                        {r.dueDate ? (
                          <span className={`text-xs ${isOverdue ? "text-red-600 font-bold" : "text-neutral"}`}>
                            {new Date(r.dueDate).toLocaleDateString("en-SA")}
                            {isOverdue && <Warning size={12} className="inline mr-1" />}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/maintenance/${r.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                            <PencilSimple size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(r.id)}>
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Modal — using shared Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (lang === "ar" ? "تعديل طلب الصيانة" : "Edit Request")
                : (lang === "ar" ? "طلب صيانة جديد" : "New Request")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral">{lang === "ar" ? "العنوان *" : "Title *"}</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder={lang === "ar" ? "مثال: تسريب ماء في الحمام" : "e.g. Water leak in bathroom"} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الوصف" : "Description"}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-20 py-2`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "التصنيف" : "Category"}</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الأولوية" : "Priority"}</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                  {Object.entries(priorityLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
            </div>

            {!editingId && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الوحدة *" : "Unit *"}</label>
                <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className={inputClass}>
                  <option value="">{lang === "ar" ? "اختر الوحدة" : "Select Unit"}</option>
                  {units.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.number} — {u.building?.name} ({u.building?.project?.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral">{lang === "ar" ? "تعيين إلى" : "Assign To"}</label>
              <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className={inputClass}>
                <option value="">{lang === "ar" ? "— بدون تعيين —" : "— Unassigned —"}</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "تاريخ مجدول" : "Scheduled Date"}</label>
                <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "التكلفة التقديرية" : "Est. Cost"}</label>
                <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} className={inputClass} placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} h-16 py-2`} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} disabled={saving}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.title || (!editingId && !form.unitId)} loading={saving}>
              {editingId ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
