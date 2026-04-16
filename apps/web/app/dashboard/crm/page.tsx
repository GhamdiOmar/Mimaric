"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  Users,
  Plus,
  Loader2,
  X,
  Search,
  Trash2,
  Eye,
  FileDown,
  UserPlus,
  TrendingUp,
  Star,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
} from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Card,
  PageIntro,
  FilterBar,
  KPICard,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomerStatus,
} from "../../actions/customers";
import { usePermissions } from "../../../hooks/usePermissions";

// ─── Customer status config ───────────────────────────────────────────────────

const customerStatuses = [
  {
    key: "NEW",
    label: { ar: "جديد", en: "New Lead" },
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  {
    key: "INTERESTED",
    label: { ar: "مهتم", en: "Interested" },
    color: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800",
    dotColor: "bg-violet-500",
  },
  {
    key: "QUALIFIED",
    label: { ar: "مؤهل", en: "Qualified" },
    color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    key: "VIEWING",
    label: { ar: "معاينة", en: "Viewing" },
    color: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800",
    dotColor: "bg-orange-500",
  },
  {
    key: "RESERVED",
    label: { ar: "محجوز", en: "Reserved" },
    color: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800",
    dotColor: "bg-green-500",
  },
];

const sourceLabels: Record<string, { ar: string; en: string }> = {
  REFERRAL: { ar: "إحالة", en: "Referral" },
  WALK_IN: { ar: "زيارة مباشرة", en: "Walk-in" },
  ONLINE: { ar: "إنترنت", en: "Online" },
  EXHIBITION: { ar: "معرض", en: "Exhibition" },
  COLD_CALL: { ar: "اتصال بارد", en: "Cold Call" },
  SOCIAL_MEDIA: { ar: "وسائل التواصل", en: "Social Media" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_STATUS_CONFIG = customerStatuses[0] ?? {
  key: "NEW",
  label: { ar: "جديد", en: "New Lead" },
  color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
  dotColor: "bg-blue-500",
};

function getStatusConfig(key: string) {
  return customerStatuses.find((s) => s.key === key) ?? DEFAULT_STATUS_CONFIG;
}

function maskPhone(phone: string) {
  if (!phone || phone === "•••••••••••") return "•••••••••••";
  return phone.slice(0, 3) + "•••" + phone.slice(-3);
}

// ─── Customer Profile Drawer ──────────────────────────────────────────────────

function CustomerDrawer({
  customer,
  onClose,
  lang,
}: {
  customer: any;
  onClose: () => void;
  lang: "ar" | "en";
}) {
  const statusCfg = getStatusConfig(customer.status);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 bottom-0 z-[100] w-full max-w-md bg-card border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300",
          lang === "ar" ? "left-0 border-e" : "right-0 border-s"
        )}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {customer.name}
              </h2>
              {customer.nameArabic && customer.nameArabic !== customer.name && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customer.nameArabic}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                statusCfg.color
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dotColor)} />
              {statusCfg.label[lang]}
            </span>
            {customer.source && sourceLabels[customer.source] && (
              <span className="text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1">
                {(sourceLabels[customer.source] as { ar: string; en: string })[lang]}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {lang === "ar" ? "معلومات التواصل" : "Contact Information"}
            </h3>
            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {customer.phone}
                  </span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {customer.email}
                  </span>
                </div>
              )}
              {customer.nationality && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {customer.nationality}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Details (if present) */}
          {(customer.gender || customer.dateOfBirth || customer.maritalStatus) && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {lang === "ar" ? "البيانات الشخصية" : "Personal Details"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {customer.gender && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {lang === "ar" ? "الجنس" : "Gender"}
                    </p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {customer.gender === "MALE"
                        ? lang === "ar"
                          ? "ذكر"
                          : "Male"
                        : lang === "ar"
                          ? "أنثى"
                          : "Female"}
                    </p>
                  </div>
                )}
                {customer.maritalStatus && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {lang === "ar" ? "الحالة الاجتماعية" : "Marital Status"}
                    </p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {customer.maritalStatus}
                    </p>
                  </div>
                )}
                {customer.dateOfBirth && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50 col-span-2">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                    </p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(customer.dateOfBirth).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : "en-SA"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline — Placeholder */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              {lang === "ar" ? "سجل النشاط" : "Activity Timeline"}
            </h3>
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 flex flex-col items-center justify-center text-center gap-2">
              <Clock className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs font-semibold text-muted-foreground">
                {lang === "ar"
                  ? "سجل النشاط قادم قريباً"
                  : "Activity log coming soon"}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {lang === "ar"
                  ? "سيتم هنا عرض جميع التفاعلات والأحداث المرتبطة بهذا العميل"
                  : "All interactions and events for this contact will appear here"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="secondary"
            style={{ display: "inline-flex" }}
            className="w-full"
            onClick={onClose}
          >
            {lang === "ar" ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  customer,
  lang,
  showPii,
  onDragStart,
  onViewProfile,
  onDelete,
  canDelete,
}: {
  customer: any;
  lang: "ar" | "en";
  showPii: boolean;
  onDragStart: (e: React.DragEvent, customerId: string) => void;
  onViewProfile: (customer: any) => void;
  onDelete: (customer: any) => void;
  canDelete: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, customer.id)}
      className="group bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary/20 hover:shadow-sm transition-all"
    >
      {/* Name + actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {customer.name}
          </p>
          {customer.nameArabic && customer.nameArabic !== customer.name && (
            <p className="text-[11px] text-muted-foreground truncate">
              {customer.nameArabic}
            </p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewProfile(customer)}
            className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            title={lang === "ar" ? "عرض الملف" : "View Profile"}
          >
            <Eye className="h-3 w-3" />
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(customer)}
              className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              title={lang === "ar" ? "حذف" : "Delete"}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1.5">
        {customer.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">
              {showPii ? customer.phone : maskPhone(customer.phone)}
            </span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {showPii
                ? customer.email
                : customer.email.replace(/(.{2}).*(@.*)/, "$1•••$2")}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        {customer.source && sourceLabels[customer.source] && (
          <span className="text-[10px] text-muted-foreground">
            {(sourceLabels[customer.source] as { ar: string; en: string })[lang]}
          </span>
        )}
        <button
          onClick={() => onViewProfile(customer)}
          className="ms-auto flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline underline-offset-2 transition-colors"
        >
          {lang === "ar" ? "عرض الملف" : "View Profile"}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const { lang } = useLanguage();
  const { can } = usePermissions();

  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [showPii, setShowPii] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Add modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    nationalId: "",
    nameArabic: "",
    source: "",
    status: "NEW",
    personType: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    maritalStatus: "",
  });

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Profile drawer
  const [drawerCustomer, setDrawerCustomer] = React.useState<any>(null);

  // Drag state (for Kanban)
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = React.useState<string | null>(null);

  const canWrite = can("crm:write") || can("customers:write");
  const canDelete = can("crm:delete") || can("customers:delete");
  const canExport = can("crm:export") || can("customers:export");
  const hasPiiAccess = can("customers:read_pii");

  // ─── Load ───────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err: any) {
      setError(
        lang === "ar"
          ? "تعذّر تحميل بيانات العملاء. يرجى المحاولة مجدداً."
          : "Failed to load CRM data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ─── Filtered ───────────────────────────────────────────────────────────────

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.nameArabic?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  // ─── KPIs ───────────────────────────────────────────────────────────────────

  const kpis = React.useMemo(
    () => ({
      total: customers.length,
      newLeads: customers.filter((c) => c.status === "NEW").length,
      qualified: customers.filter(
        (c) => c.status === "QUALIFIED" || c.status === "VIEWING"
      ).length,
      reserved: customers.filter((c) => c.status === "RESERVED").length,
    }),
    [customers]
  );

  // ─── Kanban drag ────────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, customerId: string) {
    setDraggingId(customerId);
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(status: string) {
    if (!draggingId || draggingId === null) return;
    const prev = customers;
    setCustomers((c) =>
      c.map((cust) =>
        cust.id === draggingId ? { ...cust, status } : cust
      )
    );
    setDraggingId(null);
    setDragOverStatus(null);
    try {
      await updateCustomerStatus(draggingId, status);
    } catch {
      setCustomers(prev);
      setError(
        lang === "ar"
          ? "فشل تحديث حالة العميل. يرجى المحاولة مجدداً."
          : "Failed to update status. Please try again."
      );
    }
  }

  // ─── Add Customer ────────────────────────────────────────────────────────────

  async function handleAddCustomer() {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setError(
        lang === "ar"
          ? "الاسم والهاتف حقلان مطلوبان."
          : "Name and phone are required."
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        nationalId: newCustomer.nationalId || undefined,
        nameArabic: newCustomer.nameArabic || undefined,
        source: newCustomer.source || undefined,
        status: newCustomer.status || undefined,
        personType: (newCustomer.personType as any) || undefined,
        gender: (newCustomer.gender as any) || undefined,
        dateOfBirth: newCustomer.dateOfBirth || undefined,
        nationality: newCustomer.nationality || undefined,
        maritalStatus: newCustomer.maritalStatus || undefined,
      });
      setCustomers((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        nationalId: "",
        nameArabic: "",
        source: "",
        status: "NEW",
        personType: "",
        gender: "",
        dateOfBirth: "",
        nationality: "",
        maritalStatus: "",
      });
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === "ar"
            ? "فشل إنشاء العميل. يرجى المحاولة مجدداً."
            : "Failed to create contact. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  function openDelete(customer: any) {
    setDeleteTarget(customer);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === "ar"
            ? "فشل حذف العميل. يرجى المحاولة مجدداً."
            : "Failed to delete contact. Please try again.")
      );
    } finally {
      setDeleting(false);
    }
  }

  // ─── Export (CSV) ────────────────────────────────────────────────────────────

  function handleExport() {
    const rows = [
      ["Name", "Phone", "Email", "Status", "Source"],
      ...filteredCustomers.map((c) => [
        c.name,
        showPii ? c.phone : maskPhone(c.phone),
        showPii ? (c.email ?? "") : "",
        c.status,
        c.source ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ── Header ── */}
      <PageIntro
        title={lang === "ar" ? "إدارة العملاء" : "CRM"}
        description={
          lang === "ar"
            ? "تتبع العملاء المحتملين وإدارة خط أنابيب المبيعات"
            : "Track leads and manage your sales pipeline"
        }
        actions={
          <>
            {hasPiiAccess && (
              <button
                onClick={() => setShowPii((v) => !v)}
                className={cn(
                  "h-8 px-3 rounded-lg border text-xs font-medium transition-colors",
                  showPii
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                )}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Eye className="h-3.5 w-3.5" />
                {showPii
                  ? lang === "ar"
                    ? "إخفاء البيانات الحساسة"
                    : "Hide PII"
                  : lang === "ar"
                    ? "عرض البيانات الحساسة"
                    : "Show PII"}
              </button>
            )}
            {canExport && (
              <Button
                variant="outline"
                size="sm"
                style={{ display: "inline-flex" }}
                className="gap-2"
                onClick={handleExport}
              >
                <FileDown className="h-3.5 w-3.5" />
                {lang === "ar" ? "تصدير" : "Export"}
              </Button>
            )}
            {canWrite && (
              <Button
                variant="primary"
                size="sm"
                style={{ display: "inline-flex" }}
                className="gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {lang === "ar" ? "إضافة عميل / عقار" : "Add Lead / Client"}
              </Button>
            )}
          </>
        }
      />

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي جهات الاتصال" : "Total Contacts"}
          value={kpis.total}
          subtitle={
            lang === "ar"
              ? "جميع العملاء المسجلين في المنصة"
              : "All registered contacts"
          }
          icon={<Users className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "عملاء جدد" : "New Leads"}
          value={kpis.newLeads}
          subtitle={
            lang === "ar"
              ? "عملاء محتملون في المرحلة الأولى"
              : "Prospects in the first stage"
          }
          icon={<UserPlus className="h-[18px] w-[18px]" />}
          accentColor="info"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "مؤهّلون / معاينة" : "Qualified / Viewing"}
          value={kpis.qualified}
          subtitle={
            lang === "ar"
              ? "عملاء في مراحل متقدمة من العملية"
              : "Contacts in advanced pipeline stages"
          }
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          accentColor="warning"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "محجوزون" : "Reserved"}
          value={kpis.reserved}
          subtitle={
            lang === "ar"
              ? "عملاء أتمّوا عملية الحجز"
              : "Contacts who completed reservation"
          }
          icon={<Star className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
      </div>

      {/* ── Toolbar ── */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={cn(
                "px-3.5 py-2 rounded-full text-sm font-medium border transition-colors",
                !statusFilter
                  ? "border-primary/30 bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              )}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "الكل" : "All"} {customers.length}
            </button>
            {customerStatuses.map((s) => {
              const count = customers.filter((c) => c.status === s.key).length;
              return (
                <button
                  key={s.key}
                  onClick={() =>
                    setStatusFilter(statusFilter === s.key ? "" : s.key)
                  }
                  className={cn(
                    "px-3.5 py-2 rounded-full text-sm font-medium border transition-colors",
                    statusFilter === s.key
                      ? "border-primary/30 bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                  style={{ display: "inline-flex" }}
                >
                  {s.label[lang]} {count}
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-2 rounded-full text-sm border transition-colors",
                viewMode === "kanban"
                  ? "border-primary/30 bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/30"
              )}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "كانبان" : "Kanban"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 rounded-full text-sm border transition-colors",
                viewMode === "list"
                  ? "border-primary/30 bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/30"
              )}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "قائمة" : "List"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === "ar"
                ? "ابحث بالاسم أو رقم الهاتف..."
                : "Search by name or phone..."
            }
            className="w-full h-10 bg-background border border-input rounded-xl ps-10 pe-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </Card>

      {/* ── Kanban Board ── */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {customerStatuses.map((status) => {
            const colCustomers = filteredCustomers.filter(
              (c) => c.status === status.key
            );
            const isDragOver = dragOverStatus === status.key;

            return (
              <div
                key={status.key}
                className={cn(
                  "flex flex-col gap-3 min-h-[400px] rounded-xl p-3 transition-colors",
                  isDragOver
                    ? "bg-primary/5 ring-2 ring-primary/20"
                    : "bg-muted/20"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(status.key);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => handleDrop(status.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        status.dotColor
                      )}
                    />
                    <span className="text-xs font-bold text-foreground">
                      {status.label[lang]}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                    {colCustomers.length}
                  </span>
                </div>

                {/* Cards */}
                {colCustomers.map((c) => (
                  <KanbanCard
                    key={c.id}
                    customer={c}
                    lang={lang}
                    showPii={showPii}
                    onDragStart={handleDragStart}
                    onViewProfile={setDrawerCustomer}
                    onDelete={openDelete}
                    canDelete={canDelete}
                  />
                ))}

                {/* Add shortcut */}
                {canWrite && (
                  <button
                    onClick={() => {
                      setNewCustomer((prev) => ({
                        ...prev,
                        status: status.key,
                      }));
                      setShowAddModal(true);
                    }}
                    className="mt-auto flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-xs font-medium"
                    style={{ display: "inline-flex", width: "100%" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {lang === "ar" ? "إضافة" : "Add"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الاسم" : "Name"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الهاتف" : "Phone"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "البريد" : "Email"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "المصدر" : "Source"}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((c) => {
                  const statusCfg = getStatusConfig(c.status);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {c.name}
                          </p>
                          {c.nameArabic && c.nameArabic !== c.name && (
                            <p className="text-xs text-muted-foreground">
                              {c.nameArabic}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {showPii ? c.phone : maskPhone(c.phone)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                        {c.email
                          ? showPii
                            ? c.email
                            : c.email.replace(/(.{2}).*(@.*)/, "$1•••$2")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            statusCfg.color
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              statusCfg.dotColor
                            )}
                          />
                          {statusCfg.label[lang]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {c.source && sourceLabels[c.source]
                          ? (sourceLabels[c.source] as { ar: string; en: string })[lang]
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDrawerCustomer(c)}
                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => openDelete(c)}
                              className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {filteredCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {lang === "ar" ? "لا توجد نتائج" : "No contacts found"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "حاول تعديل خيارات البحث أو الفلتر، أو أضف عميلاً جديداً."
                    : "Try adjusting your search or filter, or add a new contact."}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Profile Drawer ── */}
      {drawerCustomer && (
        <CustomerDrawer
          customer={drawerCustomer}
          onClose={() => setDrawerCustomer(null)}
          lang={lang}
        />
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {lang === "ar"
                  ? "إضافة عميل / عقار جديد"
                  : "Add Lead / Client"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Required fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                  </label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    placeholder={lang === "ar" ? "الاسم بالكامل" : "Full name"}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "الاسم بالعربية" : "Arabic Name"}
                  </label>
                  <Input
                    value={newCustomer.nameArabic}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        nameArabic: e.target.value,
                      })
                    }
                    placeholder="الاسم بالعربية"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "رقم الجوال *" : "Phone *"}
                  </label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    placeholder="+966 5x xxx xxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "رقم الهوية" : "National ID"}
                  </label>
                  <Input
                    value={newCustomer.nationalId}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        nationalId: e.target.value,
                      })
                    }
                    placeholder="10x xxx xxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "المصدر" : "Source"}
                  </label>
                  <select
                    value={newCustomer.source}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, source: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">
                      {lang === "ar" ? "اختر المصدر" : "Select source"}
                    </option>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label[lang]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </label>
                  <select
                    value={newCustomer.status}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, status: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {customerStatuses.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Absher fields */}
              <details className="group">
                <summary className="cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2 py-1">
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                  {lang === "ar"
                    ? "بيانات إضافية (أبشر)"
                    : "Additional Details (Absher)"}
                </summary>
                <div className="pt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      {lang === "ar" ? "نوع الشخص" : "Person Type"}
                    </label>
                    <select
                      value={newCustomer.personType}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          personType: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">—</option>
                      <option value="INDIVIDUAL">
                        {lang === "ar" ? "فرد" : "Individual"}
                      </option>
                      <option value="COMPANY">
                        {lang === "ar" ? "شركة" : "Company"}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      {lang === "ar" ? "الجنس" : "Gender"}
                    </label>
                    <select
                      value={newCustomer.gender}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          gender: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">—</option>
                      <option value="MALE">
                        {lang === "ar" ? "ذكر" : "Male"}
                      </option>
                      <option value="FEMALE">
                        {lang === "ar" ? "أنثى" : "Female"}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      {lang === "ar" ? "الجنسية" : "Nationality"}
                    </label>
                    <Input
                      value={newCustomer.nationality}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          nationality: e.target.value,
                        })
                      }
                      placeholder={lang === "ar" ? "سعودي" : "Saudi"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      {lang === "ar" ? "الحالة الاجتماعية" : "Marital Status"}
                    </label>
                    <select
                      value={newCustomer.maritalStatus}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          maritalStatus: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">—</option>
                      <option value="SINGLE">
                        {lang === "ar" ? "أعزب" : "Single"}
                      </option>
                      <option value="MARRIED">
                        {lang === "ar" ? "متزوج" : "Married"}
                      </option>
                      <option value="DIVORCED">
                        {lang === "ar" ? "مطلق" : "Divorced"}
                      </option>
                      <option value="WIDOWED">
                        {lang === "ar" ? "أرمل" : "Widowed"}
                      </option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                    </label>
                    <Input
                      type="date"
                      value={newCustomer.dateOfBirth}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </details>

              {/* Inline error in modal */}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <Button
                variant="secondary"
                style={{ display: "inline-flex" }}
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                }}
                disabled={saving}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={saving}
                style={{ display: "inline-flex" }}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {lang === "ar" ? "حفظ جهة الاتصال" : "Save Contact"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              style={{ display: "inline-flex" }}
              onClick={() => {
                setShowDeleteDialog(false);
                setError(null);
              }}
              disabled={deleting}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="danger"
              style={{ display: "inline-flex" }}
              className="gap-2"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "ar" ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
