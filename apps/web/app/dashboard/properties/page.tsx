"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  Building2,
  Plus,
  Loader2,
  X,
  Search,
  Trash2,
  Eye,
  FileDown,
  CheckCircle2,
  KeyRound,
  Wrench,
  Filter,
  MoreVertical,
  Pencil,
  BedDouble,
  Bath,
  Maximize2,
} from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Card,
  PageIntro,
  KPICard,
  SARAmount,
  StatusBadge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  getUnitsWithBuildings,
  createUnit,
  deleteUnit,
} from "../../actions/units";
import { KsaCitySelect } from "../../../components/ksa-city-select";
import { usePermissions } from "../../../hooks/usePermissions";

// ─── Static config ────────────────────────────────────────────────────────────

const unitTypeLabels: Record<string, { ar: string; en: string }> = {
  APARTMENT: { ar: "شقة", en: "Apartment" },
  VILLA: { ar: "فيلا", en: "Villa" },
  OFFICE: { ar: "مكتب", en: "Office" },
  RETAIL: { ar: "محل تجاري", en: "Retail" },
  WAREHOUSE: { ar: "مستودع", en: "Warehouse" },
  PARKING: { ar: "موقف", en: "Parking" },
};

const unitStatusConfig: Record<
  string,
  { label: { ar: string; en: string }; color: string; dot: string }
> = {
  AVAILABLE: {
    label: { ar: "متاح", en: "Available" },
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
  RESERVED: {
    label: { ar: "محجوز", en: "Reserved" },
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  SOLD: {
    label: { ar: "مباع", en: "Sold" },
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  RENTED: {
    label: { ar: "مؤجر", en: "Rented" },
    color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  MAINTENANCE: {
    label: { ar: "صيانة", en: "Maintenance" },
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
};

const statusFilterOptions = [
  { key: "", label: { ar: "الكل", en: "All" } },
  { key: "AVAILABLE", label: { ar: "متاح", en: "Available" } },
  { key: "RESERVED", label: { ar: "محجوز", en: "Reserved" } },
  { key: "SOLD", label: { ar: "مباع", en: "Sold" } },
  { key: "RENTED", label: { ar: "مؤجر", en: "Rented" } },
  { key: "MAINTENANCE", label: { ar: "صيانة", en: "Maintenance" } },
];

function getStatusCfg(status: string) {
  return unitStatusConfig[status] ?? unitStatusConfig["AVAILABLE"]!;
}

// ─── Property Detail Drawer ───────────────────────────────────────────────────

function PropertyDrawer({
  unit,
  onClose,
  lang,
}: {
  unit: any;
  onClose: () => void;
  lang: "ar" | "en";
}) {
  const statusCfg = getStatusCfg(unit.status);
  const typeLbl = unitTypeLabels[unit.type] ?? { ar: unit.type, en: unit.type };

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
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
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {lang === "ar" ? "وحدة" : "Unit"} {unit.number}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unit.buildingName || unit.building?.name || "—"}
                {unit.city ? ` · ${unit.city}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status + Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                statusCfg.color
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label[lang]}
            </span>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1 font-medium">
              {typeLbl[lang]}
            </span>
          </div>

          {/* Core specs */}
          <div className="grid grid-cols-2 gap-3">
            {unit.area && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" />
                  {lang === "ar" ? "المساحة" : "Area"}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {unit.area} {lang === "ar" ? "م²" : "m²"}
                </p>
              </div>
            )}
            {unit.floor != null && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {lang === "ar" ? "الطابق" : "Floor"}
                </p>
                <p className="text-sm font-bold text-foreground">{unit.floor}</p>
              </div>
            )}
            {unit.bedrooms != null && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  {lang === "ar" ? "غرف النوم" : "Bedrooms"}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {unit.bedrooms}
                </p>
              </div>
            )}
            {unit.bathrooms != null && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {lang === "ar" ? "دورات المياه" : "Bathrooms"}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {unit.bathrooms}
                </p>
              </div>
            )}
          </div>

          {/* Location */}
          {(unit.city || unit.district || unit.addressLine) && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {lang === "ar" ? "الموقع" : "Location"}
              </h3>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1 text-sm">
                {unit.addressLine && (
                  <p className="text-foreground">{unit.addressLine}</p>
                )}
                {(unit.district || unit.city) && (
                  <p className="text-muted-foreground text-xs">
                    {[unit.district, unit.city].filter(Boolean).join("، ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {(unit.price || unit.markupPrice || unit.rentalPrice) && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {lang === "ar" ? "التسعير" : "Pricing"}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {unit.price && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {lang === "ar" ? "سعر التكلفة" : "Cost Price"}
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      <SARAmount value={Number(unit.price)} size={12} />
                    </span>
                  </div>
                )}
                {unit.markupPrice && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-200 dark:border-green-900">
                    <span className="text-xs text-muted-foreground">
                      {lang === "ar" ? "سعر البيع" : "Sale Price"}
                    </span>
                    <span className="font-bold text-sm text-green-700 dark:text-green-400">
                      <SARAmount value={Number(unit.markupPrice)} size={12} />
                    </span>
                  </div>
                )}
                {unit.rentalPrice && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-200 dark:border-violet-900">
                    <span className="text-xs text-muted-foreground">
                      {lang === "ar" ? "سعر الإيجار / شهر" : "Rental / Month"}
                    </span>
                    <span className="font-bold text-sm text-violet-700 dark:text-violet-400">
                      <SARAmount value={Number(unit.rentalPrice)} size={12} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const { lang } = useLanguage();
  const { can } = usePermissions();

  const [units, setUnits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [drawerUnit, setDrawerUnit] = React.useState<any>(null);

  // New property form
  const [newUnit, setNewUnit] = React.useState({
    number: "",
    type: "APARTMENT",
    status: "AVAILABLE",
    city: "",
    district: "",
    addressLine: "",
    floor: "",
    area: "",
    price: "",
    markupPrice: "",
    rentalPrice: "",
    bedrooms: "",
    bathrooms: "",
  });

  const canWrite = can("properties:write");
  const canDelete = can("properties:delete");

  // ─── Load ──────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    async function loadData() {
      try {
        const unitsData = await getUnitsWithBuildings();
        setUnits(unitsData);
      } catch (err: any) {
        setError(
          lang === "ar"
            ? "تعذّر تحميل بيانات العقارات. يرجى المحاولة مجدداً."
            : "Failed to load properties. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── Filtered ─────────────────────────────────────────────────────────────

  const filteredUnits = React.useMemo(() => {
    return units.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.number?.toLowerCase().includes(q) ||
        u.building?.name?.toLowerCase().includes(q) ||
        u.buildingName?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.district?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [units, search, statusFilter]);

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  const kpis = React.useMemo(
    () => ({
      total: units.length,
      available: units.filter((u) => u.status === "AVAILABLE").length,
      soldRented: units.filter(
        (u) => u.status === "SOLD" || u.status === "RENTED"
      ).length,
      maintenance: units.filter((u) => u.status === "MAINTENANCE").length,
    }),
    [units]
  );

  // ─── Add ───────────────────────────────────────────────────────────────────

  async function handleAddUnit() {
    if (!newUnit.number.trim()) {
      setError(
        lang === "ar"
          ? "رقم الوحدة حقل مطلوب."
          : "Unit number is required."
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createUnit({
        number: newUnit.number,
        type: newUnit.type as any,
        status: newUnit.status as any,
        area: newUnit.area ? parseFloat(newUnit.area) : undefined,
        price: newUnit.price ? parseFloat(newUnit.price) : undefined,
        markupPrice: newUnit.markupPrice
          ? parseFloat(newUnit.markupPrice)
          : undefined,
        rentalPrice: newUnit.rentalPrice
          ? parseFloat(newUnit.rentalPrice)
          : undefined,
      });
      setUnits((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewUnit({
        number: "",
        type: "APARTMENT",
        status: "AVAILABLE",
        city: "",
        district: "",
        addressLine: "",
        floor: "",
        area: "",
        price: "",
        markupPrice: "",
        rentalPrice: "",
        bedrooms: "",
        bathrooms: "",
      });
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === "ar"
            ? "فشل إنشاء العقار. يرجى المحاولة مجدداً."
            : "Failed to create property. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUnit(deleteTarget.id);
      setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === "ar"
            ? "فشل حذف العقار. يرجى المحاولة مجدداً."
            : "Failed to delete property. Please try again.")
      );
    } finally {
      setDeleting(false);
    }
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  function handleExport() {
    const rows = [
      [
        "Unit #",
        "Type",
        "Building",
        "City",
        "District",
        "Floor",
        "Area (m²)",
        "Sale Price (SAR)",
        "Status",
      ],
      ...filteredUnits.map((u) => [
        u.number,
        unitTypeLabels[u.type]?.en ?? u.type,
        u.buildingName || u.building?.name || "",
        u.city || "",
        u.district || "",
        u.floor ?? "",
        u.area ?? "",
        u.markupPrice ?? u.price ?? "",
        unitStatusConfig[u.status]?.label.en ?? u.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

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
        title={lang === "ar" ? "العقارات" : "Properties"}
        description={
          lang === "ar"
            ? "إدارة وتتبع محفظة العقارات والوحدات"
            : "Manage and track your property portfolio"
        }
        actions={
          <>
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
            {canWrite && (
              <Button
                variant="primary"
                size="sm"
                style={{ display: "inline-flex" }}
                className="gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                {lang === "ar" ? "إضافة عقار" : "Add Property"}
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
          label={lang === "ar" ? "إجمالي العقارات" : "Total Properties"}
          value={kpis.total}
          subtitle={
            lang === "ar"
              ? "جميع الوحدات المسجّلة في المنصة"
              : "All registered units across projects"
          }
          icon={<Building2 className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "متاح" : "Available"}
          value={kpis.available}
          subtitle={
            lang === "ar"
              ? "وحدات جاهزة للبيع أو التأجير"
              : "Units ready for sale or lease"
          }
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "مباع / مؤجر" : "Sold / Rented"}
          value={kpis.soldRented}
          subtitle={
            lang === "ar"
              ? "وحدات مشغولة بعقود نشطة"
              : "Units with active contracts"
          }
          icon={<KeyRound className="h-[18px] w-[18px]" />}
          accentColor="info"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "تحت الصيانة" : "Maintenance"}
          value={kpis.maintenance}
          subtitle={
            lang === "ar"
              ? "وحدات قيد الإصلاح أو التجديد"
              : "Units under repair or renovation"
          }
          icon={<Wrench className="h-[18px] w-[18px]" />}
          accentColor="warning"
          loading={loading}
        />
      </div>

      {/* ── Filter Bar ── */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {statusFilterOptions.map((opt) => {
              const count =
                opt.key === ""
                  ? units.length
                  : units.filter((u) => u.status === opt.key).length;
              return (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={cn(
                    "px-3.5 py-2 rounded-full text-sm font-medium border transition-colors",
                    statusFilter === opt.key
                      ? "border-primary/30 bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                  style={{ display: "inline-flex" }}
                >
                  {opt.label[lang]} {count}
                </button>
              );
            })}
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
                ? "ابحث برقم الوحدة أو اسم المبنى..."
                : "Search by unit number or building name..."
            }
            className="w-full h-10 bg-background border border-input rounded-xl ps-10 pe-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </Card>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {lang === "ar" ? "عرض" : "Showing"}{" "}
          <strong className="text-foreground">{filteredUnits.length}</strong>{" "}
          {lang === "ar" ? "عقار" : "properties"}
        </p>
      </div>

      {/* ── Property List ── */}
      <Card className="overflow-hidden">
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">
              {lang === "ar" ? "لا توجد عقارات" : "No properties found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {lang === "ar"
                ? "حاول تعديل خيارات البحث أو الفلتر، أو أضف عقاراً جديداً."
                : "Try adjusting your search or filter, or add a new property."}
            </p>
            {canWrite && (
              <Button
                variant="primary"
                size="sm"
                style={{ display: "inline-flex" }}
                className="gap-2 mt-4"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                {lang === "ar" ? "إضافة عقار" : "Add Property"}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {lang === "ar" ? "رقم الوحدة" : "Unit #"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {lang === "ar" ? "النوع" : "Type"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {lang === "ar" ? "المدينة / الحي" : "City / District"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {lang === "ar" ? "اسم المبنى" : "Building"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الطابق" : "Floor"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "المساحة" : "Area"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {lang === "ar" ? "السعر" : "Price"}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUnits.map((unit) => {
                  const statusCfg = getStatusCfg(unit.status);
                  const typeLbl =
                    unitTypeLabels[unit.type] ?? {
                      ar: unit.type,
                      en: unit.type,
                    };
                  const buildingDisplay =
                    unit.buildingName ||
                    unit.building?.name ||
                    "—";
                  const locationDisplay = [unit.city, unit.district]
                    .filter(Boolean)
                    .join(lang === "ar" ? "، " : ", ") || "—";

                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary/90 tabular-nums">
                          {unit.number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-muted-foreground border border-border rounded-full px-2.5 py-1">
                          {typeLbl[lang]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {locationDisplay}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {buildingDisplay}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                        {unit.floor ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                        {unit.area ? `${unit.area} m²` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {unit.markupPrice || unit.price ? (
                          <span className="text-sm font-semibold text-foreground">
                            <SARAmount
                              value={Number(unit.markupPrice ?? unit.price)}
                              size={11}
                              compact
                            />
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
                              statusCfg.dot
                            )}
                          />
                          {statusCfg.label[lang]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDrawerUnit(unit)}
                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                            title={lang === "ar" ? "عرض التفاصيل" : "View Details"}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => {
                                setDeleteTarget(unit);
                                setShowDeleteDialog(true);
                              }}
                              className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                              title={lang === "ar" ? "حذف" : "Delete"}
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
          </div>
        )}
      </Card>

      {/* ── Property Detail Drawer ── */}
      {drawerUnit && (
        <PropertyDrawer
          unit={drawerUnit}
          onClose={() => setDrawerUnit(null)}
          lang={lang}
        />
      )}

      {/* ── Add Property Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {lang === "ar" ? "إضافة عقار جديد" : "Add New Property"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Unit # and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "رقم الوحدة *" : "Unit Number *"}
                  </label>
                  <Input
                    value={newUnit.number}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, number: e.target.value })
                    }
                    placeholder="A-101"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "نوع العقار *" : "Property Type *"}
                  </label>
                  <select
                    value={newUnit.type}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, type: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(unitTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  {lang === "ar" ? "الحالة" : "Status"}
                </label>
                <select
                  value={newUnit.status}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, status: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(unitStatusConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "المدينة" : "City"}
                  </label>
                  <KsaCitySelect
                    value={newUnit.city}
                    onChange={(v) => setNewUnit({ ...newUnit, city: v })}
                    placeholder={lang === "ar" ? "اختر المدينة" : "Select city"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "الحي" : "District"}
                  </label>
                  <Input
                    value={newUnit.district}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, district: e.target.value })
                    }
                    placeholder={lang === "ar" ? "حي النرجس" : "Al Narjis"}
                  />
                </div>
              </div>

              {/* Floor + Area */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "الطابق" : "Floor"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.floor}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, floor: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.area}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, area: e.target.value })
                    }
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Bedrooms + Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "غرف النوم" : "Bedrooms"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.bedrooms}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, bedrooms: e.target.value })
                    }
                    placeholder="3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "دورات المياه" : "Bathrooms"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.bathrooms}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, bathrooms: e.target.value })
                    }
                    placeholder="2"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "سعر البيع (ر.س)" : "Sale Price (SAR)"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.markupPrice}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, markupPrice: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "سعر الإيجار (ر.س)" : "Rental Price (SAR)"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.rentalPrice}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, rentalPrice: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Inline modal error */}
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
                onClick={handleAddUnit}
                disabled={saving}
                style={{ display: "inline-flex" }}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {lang === "ar" ? "حفظ العقار" : "Save Property"}
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
                ? `هل أنت متأكد من حذف الوحدة "${deleteTarget?.number}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete unit "${deleteTarget?.number}"? This action cannot be undone.`}
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
