"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Loader2,
  Search,
  Pencil,
  Trash2,
  Eye,
  CalendarCheck,
  UserCircle,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Card,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageIntro,
  FilterBar,
  StatusBadge,
} from "@repo/ui";
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

const statusLabels: Record<string, { ar: string; en: string }> = {
  OPEN: { ar: "مفتوح", en: "Open" },
  ASSIGNED: { ar: "معيّن", en: "Assigned" },
  IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress" },
  ON_HOLD: { ar: "معلّق", en: "On Hold" },
  RESOLVED: { ar: "تم الحل", en: "Resolved" },
  CLOSED: { ar: "مغلق", en: "Closed" },
};

const priorityLabels: Record<string, { ar: string; en: string; color: string }> = {
  LOW: { ar: "منخفض", en: "Low", color: "text-muted-foreground" },
  MEDIUM: { ar: "متوسط", en: "Medium", color: "text-primary" },
  HIGH: { ar: "عالي", en: "High", color: "text-amber-600" },
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

  // Build status filter tabs for FilterBar
  const statusFilterOptions = [
    { label: lang === "ar" ? "الكل" : "All", value: "" },
    ...Object.entries(statusLabels).map(([k, v]) => ({
      label: v[lang],
      value: k,
    })),
  ];

  const inputClass =
    "w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <PageIntro
        title={lang === "ar" ? "الصيانة" : "Maintenance"}
        description={
          lang === "ar"
            ? "تتبع طلبات الصيانة وإدارة الأولويات وقياس مستوى الخدمة"
            : "Track maintenance requests, manage priorities, and measure SLA performance"
        }
        actions={
          <>
            <Button size="sm" className="gap-2" onClick={openCreate} style={{ display: "inline-flex" }}>
              <Plus className="h-4 w-4" />
              {lang === "ar" ? "طلب جديد" : "New Request"}
            </Button>
            <Link href="/dashboard/maintenance/preventive">
              <Button variant="outline" size="sm" className="gap-2" style={{ display: "inline-flex" }}>
                <CalendarCheck className="h-4 w-4" />
                {lang === "ar" ? "الصيانة الوقائية" : "Preventive Plans"}
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          label={lang === "ar" ? "مفتوحة" : "Open"}
          value={stats?.open ?? "\u2014"}
          subtitle={lang === "ar" ? "طلبات بانتظار التعيين" : "Awaiting assignment"}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="warning"
          loading={loading}
          compact
        />
        <KPICard
          label={lang === "ar" ? "معيّنة" : "Assigned"}
          value={stats?.assigned ?? "\u2014"}
          subtitle={lang === "ar" ? "تم تعيين فني" : "Technician assigned"}
          icon={<UserCircle className="h-5 w-5" />}
          accentColor="info"
          loading={loading}
          compact
        />
        <KPICard
          label={lang === "ar" ? "قيد التنفيذ" : "In Progress"}
          value={stats?.inProgress ?? "\u2014"}
          subtitle={lang === "ar" ? "جارٍ العمل عليها" : "Work underway"}
          icon={<Clock className="h-5 w-5" />}
          accentColor="primary"
          loading={loading}
          compact
        />
        <KPICard
          label={lang === "ar" ? "متأخرة" : "Overdue"}
          value={stats?.overdue ?? "\u2014"}
          subtitle={lang === "ar" ? "تجاوزت الموعد المحدد" : "Past due date"}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="destructive"
          loading={loading}
          compact
        />
        <KPICard
          label={lang === "ar" ? "مكتملة هذا الشهر" : "Completed (Month)"}
          value={stats?.completedThisMonth ?? "\u2014"}
          subtitle={lang === "ar" ? "تم الحل هذا الشهر" : "Resolved this month"}
          icon={<CheckCircle className="h-5 w-5" />}
          accentColor="success"
          loading={loading}
          compact
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={statusFilterOptions}
        activeFilter={filterStatus}
        onFilterChange={(v) => setFilterStatus(v)}
        searchPlaceholder={lang === "ar" ? "بحث بالعنوان..." : "Search by title..."}
        searchValue={search}
        onSearchChange={setSearch}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">{lang === "ar" ? "كل الأولويات" : "All Priorities"}</option>
              {Object.entries(priorityLabels).map(([k, v]) => (
                <option key={k} value={k}>{v[lang]}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">{lang === "ar" ? "كل التصنيفات" : "All Categories"}</option>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v[lang]}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Wrench className="h-12 w-12 mb-4" />
            <p className="text-sm">{lang === "ar" ? "لا توجد طلبات صيانة" : "No maintenance requests"}</p>
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
                const priority = priorityLabels[r.priority] ?? { ar: r.priority, en: r.priority, color: "text-muted-foreground" };
                const cat = categoryLabels[r.category] ?? { ar: r.category, en: r.category };
                const statusLabel = statusLabels[r.status] ?? { ar: r.status, en: r.status };
                const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !["RESOLVED", "CLOSED"].includes(r.status);

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/maintenance/${r.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {r.title}
                        {r.isPreventive && (
                          <span className="text-[9px] text-emerald-600 mr-1">[{lang === "ar" ? "وقائي" : "Preventive"}]</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {r.unit?.number ?? "\u2014"} \u2014 {r.unit?.building?.name ?? ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cat[lang]}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold ${priority.color}`}>{priority[lang]}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        entityType="maintenance"
                        status={r.status}
                        label={statusLabel[lang]}
                        className="text-[10px]"
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.assignedTo?.name ?? "\u2014"}</TableCell>
                    <TableCell>
                      {r.dueDate ? (
                        <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {new Date(r.dueDate).toLocaleDateString("en-SA")}
                          {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/maintenance/${r.id}`}>
                          <Button variant="ghost" size="sm" style={{ display: "inline-flex" }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} style={{ display: "inline-flex" }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(r.id)}
                          style={{ display: "inline-flex" }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create/Edit Modal */}
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
              <label className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "العنوان *" : "Title *"}
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                placeholder={lang === "ar" ? "مثال: تسريب ماء في الحمام" : "e.g. Water leak in bathroom"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "الوصف" : "Description"}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} h-20 py-2`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "التصنيف" : "Category"}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الأولوية" : "Priority"}
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={inputClass}
                >
                  {Object.entries(priorityLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
            </div>

            {!editingId && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الوحدة *" : "Unit *"}
                </label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  className={inputClass}
                >
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
              <label className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "تعيين إلى" : "Assign To"}
              </label>
              <select
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                className={inputClass}
              >
                <option value="">{lang === "ar" ? "— بدون تعيين —" : "— Unassigned —"}</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "تاريخ مجدول" : "Scheduled Date"}
                </label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "التكلفة التقديرية" : "Est. Cost"}
                </label>
                <input
                  type="number"
                  value={form.estimatedCost}
                  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={`${inputClass} h-16 py-2`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} disabled={saving} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !form.title || (!editingId && !form.unitId)}
              loading={saving}
              style={{ display: "inline-flex" }}
            >
              {editingId ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
