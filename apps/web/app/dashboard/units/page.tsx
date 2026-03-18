"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  Building2,
  Check,
  Filter,
  Search,
  ExternalLink,
  Plus,
  Loader2,
  Package,
  Map,
  BarChart3,
  Store,
  Tag,
  ArrowRight,
  Wrench,
  X,
  Eye,
  ShoppingCart,
  Home,
  Receipt,
  Trash2,
  Pencil,
  DollarSign,
  FileDown,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import {
  Button,
  Badge,
  Input,
  SARAmount,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageIntro,
  FilterBar,
  StatusBadge,
  KPICard,
} from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  getUnitsWithBuildings,
  massUpdateUnits,
  createUnit,
  getBuildings,
  deleteUnit,
  getUnitFinancialSummary,
  getActiveContractForUnit,
} from "../../actions/units";
import { getMaintenanceForUnit } from "../../actions/maintenance";
import {
  getAllInventoryItems,
  getGlobalInventoryStats,
} from "../../actions/inventory";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const unitTypeLabels: Record<string, { ar: string; en: string }> = {
  APARTMENT: { ar: "شقة", en: "Apartment" },
  VILLA: { ar: "فيلا", en: "Villa" },
  OFFICE: { ar: "مكتب", en: "Office" },
  RETAIL: { ar: "محل تجاري", en: "Retail" },
  WAREHOUSE: { ar: "مستودع", en: "Warehouse" },
  PARKING: { ar: "موقف", en: "Parking" },
};

const unitStatusLabels: Record<string, { ar: string; en: string }> = {
  AVAILABLE: { ar: "متاح", en: "Available" },
  RESERVED: { ar: "محجوز", en: "Reserved" },
  SOLD: { ar: "مباع", en: "Sold" },
  RENTED: { ar: "مؤجر", en: "Rented" },
  MAINTENANCE: { ar: "صيانة", en: "Maintenance" },
};

const invStatusConfig: Record<
  string,
  { ar: string; en: string; color: string }
> = {
  UNRELEASED: {
    ar: "لم تُطلق",
    en: "Unreleased",
    color: "bg-muted text-muted-foreground",
  },
  AVAILABLE_INV: {
    ar: "متاح",
    en: "Available",
    color: "bg-secondary/15 text-secondary",
  },
  RESERVED_INV: {
    ar: "محجوز",
    en: "Reserved",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SOLD_INV: { ar: "مباع", en: "Sold", color: "bg-info/15 text-info" },
  HELD_INV: {
    ar: "محتجز",
    en: "Held",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  WITHDRAWN: {
    ar: "مسحوب",
    en: "Withdrawn",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
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

export default function AdvancedUnitMatrixPageWrapper() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdvancedUnitMatrixPage />
    </React.Suspense>
  );
}

function AdvancedUnitMatrixPage() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project") || "";
  const { lang } = useLanguage();
  const [selectedUnits, setSelectedUnits] = React.useState<string[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [buildings, setBuildings] = React.useState<any[]>([]);
  const [showPriceModal, setShowPriceModal] = React.useState(false);
  const [bulkPrice, setBulkPrice] = React.useState("");
  const [selectedProject, setSelectedProject] = React.useState(projectFilter);
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");
  const [unitSearch, setUnitSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [newUnit, setNewUnit] = React.useState({
    number: "",
    type: "APARTMENT",
    buildingId: "",
    area: "",
    price: "",
    markupPrice: "",
    rentalPrice: "",
    status: "AVAILABLE",
  });

  // Tab state
  const [activeTab, setActiveTab] = React.useState<"units" | "inventory">(
    "units"
  );

  // Inventory state
  const [inventoryItems, setInventoryItems] = React.useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = React.useState<any>(null);
  const [loadingInventory, setLoadingInventory] = React.useState(false);
  const [invSearch, setInvSearch] = React.useState("");
  const [invStatusFilter, setInvStatusFilter] = React.useState("");
  const [invProjectFilter, setInvProjectFilter] = React.useState("");

  // Unit detail modal
  const [detailUnit, setDetailUnit] = React.useState<any>(null);
  const [detailMaintenance, setDetailMaintenance] = React.useState<any[]>([]);
  const [detailFinancials, setDetailFinancials] = React.useState<any>(null);
  const [detailContract, setDetailContract] = React.useState<any>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const maintenanceStatusLabels: Record<
    string,
    { ar: string; en: string; variant: string }
  > = {
    OPEN: { ar: "مفتوح", en: "Open", variant: "draft" },
    ASSIGNED: { ar: "معيّن", en: "Assigned", variant: "reserved" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", variant: "reserved" },
    ON_HOLD: { ar: "معلّق", en: "On Hold", variant: "maintenance" },
    RESOLVED: { ar: "تم الحل", en: "Resolved", variant: "available" },
    CLOSED: { ar: "مغلق", en: "Closed", variant: "sold" },
  };

  async function openUnitDetail(unit: any) {
    setDetailUnit(unit);
    setDetailFinancials(null);
    setDetailContract(null);
    setLoadingDetail(true);
    try {
      const [maint, fin, contract] = await Promise.all([
        getMaintenanceForUnit(unit.id),
        getUnitFinancialSummary(unit.id).catch(() => null),
        getActiveContractForUnit(unit.id).catch(() => null),
      ]);
      setDetailMaintenance(maint);
      setDetailFinancials(fin);
      setDetailContract(contract);
    } catch (e) {
      console.error(e);
      setDetailMaintenance([]);
    } finally {
      setLoadingDetail(false);
    }
  }

  React.useEffect(() => {
    async function loadUnits() {
      try {
        const data = await getUnitsWithBuildings();
        setUnits(data);
      } catch (err) {
        console.error("Failed to fetch units");
      } finally {
        setLoading(false);
      }
    }
    loadUnits();

    async function loadBuildings() {
      try {
        const data = await getBuildings();
        setBuildings(data);
        const firstBuilding = data?.[0];
        if (firstBuilding) {
          setNewUnit((prev) => ({ ...prev, buildingId: firstBuilding.id }));
        }
      } catch (err) {
        console.error("Failed to fetch buildings");
      }
    }
    loadBuildings();
  }, []);

  // Load inventory data when inventory tab is selected
  React.useEffect(() => {
    if (activeTab !== "inventory") return;
    if (inventoryItems.length > 0) return; // already loaded
    async function loadInventory() {
      setLoadingInventory(true);
      try {
        const [items, stats] = await Promise.all([
          getAllInventoryItems(),
          getGlobalInventoryStats(),
        ]);
        setInventoryItems(items);
        setInventoryStats(stats);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      } finally {
        setLoadingInventory(false);
      }
    }
    loadInventory();
  }, [activeTab]);

  const toggleSelect = (id: string) => {
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updates = selectedUnits.map((id) => ({ id, status: newStatus }));
      await massUpdateUnits(updates);
      // Refresh local state
      setUnits(
        units.map((u) =>
          u && selectedUnits.includes(u.id) ? { ...u, status: newStatus } : u
        )
      );
      setSelectedUnits([]);
    } catch (err) {
      alert("Failed to update units");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddUnit = async () => {
    setUpdating(true);
    try {
      const unit = await createUnit({
        ...newUnit,
        area: newUnit.area ? parseFloat(newUnit.area) : undefined,
        price: newUnit.price ? parseFloat(newUnit.price) : undefined,
        markupPrice: newUnit.markupPrice
          ? parseFloat(newUnit.markupPrice)
          : undefined,
        rentalPrice: newUnit.rentalPrice
          ? parseFloat(newUnit.rentalPrice)
          : undefined,
      });
      setUnits((prev) => [...prev, unit]);
      setShowAddModal(false);
      setNewUnit({
        number: "",
        type: "APARTMENT",
        buildingId: buildings[0]?.id || "",
        area: "",
        price: "",
        markupPrice: "",
        rentalPrice: "",
        status: "AVAILABLE",
      });
    } catch (err) {
      alert("Failed to create unit");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPrice) return;
    setUpdating(true);
    try {
      const updates = selectedUnits.map((id) => ({
        id,
        price: parseFloat(bulkPrice),
      }));
      await massUpdateUnits(updates);
      setUnits(
        units.map((u) =>
          selectedUnits.includes(u.id)
            ? { ...u, price: parseFloat(bulkPrice) }
            : u
        )
      );
      setSelectedUnits([]);
      setShowPriceModal(false);
      setBulkPrice("");
    } catch (err) {
      alert("Failed to update price");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedUnits.length;
    const msg =
      lang === "ar"
        ? `هل أنت متأكد من حذف ${count} وحدة؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to delete ${count} unit(s)? This action cannot be undone.`;
    if (!confirm(msg)) return;
    setUpdating(true);
    try {
      for (const id of selectedUnits) {
        await deleteUnit(id);
      }
      setUnits(units.filter((u) => !selectedUnits.includes(u.id)));
      setSelectedUnits([]);
    } catch (err) {
      alert(
        lang === "ar" ? "فشل حذف بعض الوحدات" : "Failed to delete some units"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Filtered units based on search, project, and status
  const filteredUnits = React.useMemo(() => {
    return units.filter((u: any) => {
      const q = unitSearch.trim().toLowerCase();
      const matchesSearch = !q || u.number?.toLowerCase().includes(q) || u.building?.name?.toLowerCase().includes(q) || u.building?.project?.name?.toLowerCase().includes(q);
      const matchesProject = !selectedProject || u.building?.project?.id === selectedProject;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [units, unitSearch, selectedProject, statusFilter]);

  // Status counts for pills
  const statusCounts = React.useMemo(() => ({
    total: units.length,
    available: units.filter((u: any) => u.status === "AVAILABLE").length,
    reserved: units.filter((u: any) => u.status === "RESERVED").length,
    sold: units.filter((u: any) => u.status === "SOLD").length,
    rented: units.filter((u: any) => u.status === "RENTED").length,
    maintenance: units.filter((u: any) => u.status === "MAINTENANCE").length,
  }), [units]);

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
      {/* Header */}
      <PageIntro
        title={lang === "ar" ? "الوحدات" : "Units"}
        description={
          lang === "ar"
            ? "إدارة وتتبع جميع الوحدات العقارية عبر المشاريع والمباني"
            : "Manage and track all property units across projects and buildings"
        }
        actions={
          <>
            <Button variant="primary" size="sm" style={{ display: "inline-flex" }} className="gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              {lang === "ar" ? "إضافة وحدة" : "Add Unit"}
            </Button>
            <Button variant="outline" size="sm" style={{ display: "inline-flex" }} className="gap-2">
              <FileDown className="h-3.5 w-3.5" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي الوحدات" : "Total Units"}
          value={loading ? "—" : units.length}
          subtitle={lang === "ar" ? "جميع الوحدات المسجلة عبر المشاريع والمباني" : "All registered units across projects and buildings"}
          icon={<Building2 className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "متاح" : "Available"}
          value={loading ? "—" : units.filter((u: any) => u.status === "AVAILABLE").length}
          subtitle={lang === "ar" ? "وحدات جاهزة للبيع أو التأجير فوراً" : "Units ready for immediate sale or lease"}
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "مؤجرة / مباعة" : "Occupied / Leased"}
          value={loading ? "—" : units.filter((u: any) => u.status === "RENTED" || u.status === "SOLD").length}
          subtitle={lang === "ar" ? "وحدات مشغولة بعقود بيع أو إيجار نشطة" : "Units with active sale or rental contracts"}
          icon={<KeyRound className="h-[18px] w-[18px]" />}
          accentColor="info"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "تحت الصيانة" : "Under Maintenance"}
          value={loading ? "—" : units.filter((u: any) => u.status === "MAINTENANCE").length}
          subtitle={lang === "ar" ? "وحدات قيد الإصلاح أو التجديد حالياً" : "Units currently under repair or renovation"}
          icon={<Wrench className="h-[18px] w-[18px]" />}
          accentColor="warning"
          loading={loading}
        />
      </div>

      {/* Tab Bar */}
      <FilterBar
        filters={[
          {
            label: lang === "ar" ? "الوحدات المادية" : "Physical Units",
            value: "units",
            count: units.length,
          },
          {
            label: lang === "ar" ? "مخزون على الخارطة" : "Off-Plan Inventory",
            value: "inventory",
            count: inventoryStats?.total,
          },
        ]}
        activeFilter={activeTab}
        onFilterChange={(value) =>
          setActiveTab(value as "units" | "inventory")
        }
      />

      {/* ═══ PHYSICAL UNITS TAB ═══ */}
      {activeTab === "units" && (
        <>
          {/* Bulk Action Bar (Floating) */}
          {selectedUnits.length > 0 && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-primary-deep text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex items-center gap-8 animate-in slide-in-from-bottom-10">
              <div className="flex items-center gap-3 border-r border-white/20 pr-6 mr-2">
                <span className="h-6 w-6 bg-secondary text-white rounded-full flex items-center justify-center text-xs font-bold leading-none">
                  {selectedUnits.length}
                </span>
                <span className="text-sm">
                  {lang === "ar" ? "وحدة مختارة" : "Units Selected"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <select
                  onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                  disabled={updating}
                  className="bg-secondary/80 hover:bg-secondary text-white text-xs font-bold rounded-md px-3 py-2 outline-none border-none cursor-pointer"
                >
                  <option value="">
                    {lang === "ar" ? "تحديث الحالة" : "Update Status"}
                  </option>
                  {Object.entries(unitStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label[lang]}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant="secondary"
                  style={{ display: "inline-flex" }}
                  className="gap-2 bg-card/10 border-white/20 text-white hover:bg-card/20"
                  onClick={() => setShowPriceModal(true)}
                  disabled={updating}
                >
                  <DollarSign className="h-4 w-4" />
                  {lang === "ar" ? "تغيير السعر" : "Change Price"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  style={{ display: "inline-flex" }}
                  className="gap-2 bg-red-500/80 hover:bg-red-500 whitespace-nowrap"
                  onClick={handleBulkDelete}
                  disabled={updating}
                >
                  <Trash2 className="h-4 w-4" />
                  {lang === "ar" ? "حذف" : "Delete"}
                </Button>
              </div>

              <button
                onClick={() => setSelectedUnits([])}
                className="text-xs text-white/50 hover:text-white underline underline-offset-4 ml-4"
              >
                {lang === "ar" ? "إلغاء التحديد" : "Clear Selection"}
              </button>
            </div>
          )}

          {/* Consolidated Toolbar */}
          <Card className="p-4 space-y-4">
            {/* Row 1: Status tabs + view toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  {lang === "ar" ? "الكل" : "All"} {statusCounts.total}
                </button>
                {Object.entries(unitStatusLabels).map(([key, label]) => {
                  const count = units.filter((u: any) => u.status === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-sm font-medium border transition-colors",
                        statusFilter === key
                          ? "border-primary/30 bg-primary/15 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      )}
                      style={{ display: "inline-flex" }}
                    >
                      {label[lang]} {count}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm border transition-colors",
                    viewMode === "cards" ? "border-primary/30 bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground"
                  )}
                  style={{ display: "inline-flex" }}
                >
                  {lang === "ar" ? "بطاقات" : "Cards"}
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm border transition-colors",
                    viewMode === "table" ? "border-primary/30 bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground"
                  )}
                  style={{ display: "inline-flex" }}
                >
                  {lang === "ar" ? "جدول" : "Table"}
                </button>
              </div>
            </div>
            {/* Row 2: Search + filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  placeholder={lang === "ar" ? "ابحث برقم الوحدة أو المشروع أو المبنى..." : "Search by unit #, project, or building..."}
                  className="w-full h-10 bg-background border border-input rounded-xl ps-10 pe-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-10 px-3 bg-background border border-input rounded-xl text-sm outline-none"
              >
                <option value="">{lang === "ar" ? "كل المشاريع" : "All Projects"}</option>
                {(() => {
                  const projectMap: Record<string, string> = {};
                  buildings.forEach((b: any) => {
                    if (b.project?.id && b.project?.name) projectMap[b.project.id] = b.project.name;
                  });
                  return Object.entries(projectMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ));
                })()}
              </select>
            </div>
          </Card>

          {/* Meta row: count + status pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{lang === "ar" ? "عرض" : "Showing"} <strong className="text-foreground">{filteredUnits.length}</strong> {lang === "ar" ? "وحدة" : "units"}</span>
              <Badge variant="available" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{unitStatusLabels.AVAILABLE?.[lang]} {statusCounts.available}</Badge>
              <Badge variant="reserved" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{unitStatusLabels.RESERVED?.[lang]} {statusCounts.reserved}</Badge>
              <Badge variant="sold" className="bg-info/10 text-info border-info/20">{unitStatusLabels.SOLD?.[lang]}/{unitStatusLabels.RENTED?.[lang]} {statusCounts.sold + statusCounts.rented}</Badge>
              <Badge variant="draft" className="bg-orange-500/10 text-orange-500 border-orange-500/20">{unitStatusLabels.MAINTENANCE?.[lang]} {statusCounts.maintenance}</Badge>
            </div>
          </div>

          {/* Card View */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUnits.map((unit: any) => (
                <Card
                  key={unit.id}
                  className="p-5 cursor-pointer hover:border-primary/20 transition-colors group"
                  onClick={() => openUnitDetail(unit)}
                >
                  {/* Unit code hero */}
                  <h3 className="text-2xl font-extrabold text-primary/80 tabular-nums">{unit.number}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {unit.building?.name || "—"} · {unit.building?.project?.name || "—"}
                  </p>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                      <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</div>
                      <div className="text-sm font-semibold text-foreground">{unitTypeLabels[unit.type]?.[lang] ?? unit.type}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                      <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "المساحة" : "Area"}</div>
                      <div className="text-sm font-semibold text-foreground tabular-nums">{unit.area} {lang === "ar" ? "م²" : "m²"}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                      <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "السعر" : "Price"}</div>
                      <div className="text-sm font-semibold text-foreground">{unit.price ? <SARAmount value={Number(unit.price)} size={11} compact /> : "—"}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5">
                      <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "الطابق" : "Floor"}</div>
                      <div className="text-sm font-semibold text-foreground">{unit.floor || "—"}</div>
                    </div>
                  </div>

                  {/* Footer: status + actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <StatusBadge entityType="unit" status={unit.status} label={unitStatusLabels[unit.status]?.[lang] ?? unit.status} />
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="h-7 w-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-7 w-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); openUnitDetail(unit); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Add Unit Placeholder */}
              <div
                onClick={() => setShowAddModal(true)}
                className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[240px] text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer"
              >
                <Plus className="h-8 w-8" />
                <span className="text-xs font-bold mt-2">{lang === "ar" ? "إضافة وحدة" : "Add Unit"}</span>
              </div>
            </div>
          ) : (
            /* Table View */
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang === "ar" ? "رقم الوحدة" : "Unit #"}</TableHead>
                      <TableHead>{lang === "ar" ? "المشروع" : "Project"}</TableHead>
                      <TableHead>{lang === "ar" ? "المبنى" : "Building"}</TableHead>
                      <TableHead>{lang === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{lang === "ar" ? "المساحة" : "Area"}</TableHead>
                      <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{lang === "ar" ? "السعر" : "Price"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit: any) => (
                      <TableRow key={unit.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openUnitDetail(unit)}>
                        <TableCell className="font-bold text-primary/80 tabular-nums">{unit.number}</TableCell>
                        <TableCell>{unit.building?.project?.name || "—"}</TableCell>
                        <TableCell>{unit.building?.name || "—"}</TableCell>
                        <TableCell>{unitTypeLabels[unit.type]?.[lang] ?? unit.type}</TableCell>
                        <TableCell className="tabular-nums">{unit.area} m²</TableCell>
                        <TableCell><StatusBadge entityType="unit" status={unit.status} label={unitStatusLabels[unit.status]?.[lang] ?? unit.status} /></TableCell>
                        <TableCell>{unit.price ? <SARAmount value={Number(unit.price)} size={11} compact /> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ═══ OFF-PLAN INVENTORY TAB ═══ */}
      {activeTab === "inventory" &&
        (loadingInventory ? (
          <div className="flex h-[calc(100vh-350px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            {inventoryStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-2">
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "إجمالي المخزون" : "Total Items"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary font-latin">
                    {inventoryStats.total}
                  </p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-secondary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "متاح" : "Available"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-secondary font-latin">
                    {inventoryStats.available}
                  </p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "محجوز" : "Reserved"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 font-latin">
                    {inventoryStats.reserved}
                  </p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-info/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-info" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "مباع" : "Sold"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-info font-latin">
                    {inventoryStats.sold}
                  </p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "قيمة المخزون" : "Pipeline Value"}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    <SARAmount
                      value={inventoryStats.totalValue}
                      size={12}
                      compact
                    />
                  </p>
                </Card>
              </div>
            )}

            {/* Inventory Table */}
            <Card className="overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      placeholder={
                        lang === "ar"
                          ? "بحث في المخزون..."
                          : "Search inventory..."
                      }
                      className="w-full h-9 bg-background border border-input rounded-md py-2 pr-10 pl-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring"
                    />
                  </div>
                  <select
                    value={invStatusFilter}
                    onChange={(e) => setInvStatusFilter(e.target.value)}
                    className="h-9 px-3 bg-background border border-input rounded-md text-xs outline-none"
                  >
                    <option value="">
                      {lang === "ar" ? "كل الحالات" : "All Statuses"}
                    </option>
                    {Object.entries(invStatusConfig).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label[lang]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={invProjectFilter}
                    onChange={(e) => setInvProjectFilter(e.target.value)}
                    className="h-9 px-3 bg-background border border-input rounded-md text-xs outline-none"
                  >
                    <option value="">
                      {lang === "ar" ? "كل المشاريع" : "All Projects"}
                    </option>
                    {(() => {
                      const pm: Record<string, string> = {};
                      inventoryItems.forEach((i: any) => {
                        if (i.project?.id && i.project?.name) pm[i.project.id] = i.project.name;
                      });
                      return Object.entries(pm).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {inventoryStats && (
                    <>
                      <Badge
                        variant="available"
                        className="bg-secondary/15 border border-secondary/40 text-secondary font-bold px-3 py-1"
                      >
                        {inventoryStats.available}{" "}
                        {lang === "ar" ? "متاح" : "Available"}
                      </Badge>
                      <Badge
                        variant="sold"
                        className="bg-info/15 border border-info/40 text-info font-bold px-3 py-1"
                      >
                        {inventoryStats.sold}{" "}
                        {lang === "ar" ? "مباع" : "Sold"}
                      </Badge>
                      <Badge
                        variant="reserved"
                        className="bg-muted border border-border text-muted-foreground font-bold px-3 py-1"
                      >
                        {inventoryStats.unreleased}{" "}
                        {lang === "ar" ? "لم تُطلق" : "Unreleased"}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {lang === "ar" ? "رقم العنصر" : "Item #"}
                    </TableHead>
                    <TableHead>
                      {lang === "ar" ? "نوع المنتج" : "Product Type"}
                    </TableHead>
                    <TableHead>
                      {lang === "ar" ? "المشروع" : "Project"}
                    </TableHead>
                    <TableHead>
                      {lang === "ar" ? "المساحة" : "Area"}
                    </TableHead>
                    <TableHead>{lang === "ar" ? "السعر" : "Price"}</TableHead>
                    <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems
                    .filter((item: any) => {
                      if (invStatusFilter && item.status !== invStatusFilter)
                        return false;
                      if (
                        invProjectFilter &&
                        item.project?.id !== invProjectFilter
                      )
                        return false;
                      if (invSearch) {
                        const q = invSearch.toLowerCase();
                        return (
                          item.itemNumber?.toLowerCase().includes(q) ||
                          item.productLabel?.toLowerCase().includes(q) ||
                          item.productLabelArabic?.toLowerCase().includes(q) ||
                          item.project?.name?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((item: any) => {
                      const ist =
                        invStatusConfig[item.status] ??
                        invStatusConfig.UNRELEASED!;
                      const pt = productTypeLabels[item.productType] ?? {
                        ar: item.productType,
                        en: item.productType,
                      };
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span className="font-bold text-primary font-latin">
                              {item.itemNumber}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-foreground">
                              {pt[lang]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/projects/${item.project?.id}`}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {item.project?.name ?? "\u2014"}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-latin">
                              {item.areaSqm
                                ? `${item.areaSqm} \u0645\u00B2`
                                : "\u2014"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-bold text-primary">
                              {item.finalPriceSar || item.basePriceSar ? (
                                <SARAmount
                                  value={
                                    item.finalPriceSar ?? item.basePriceSar
                                  }
                                  size={10}
                                  compact
                                />
                              ) : (
                                "\u2014"
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full",
                                ist.color
                              )}
                            >
                              {ist[lang]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/projects/${item.project?.id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                style={{ display: "inline-flex" }}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>

              {/* Empty State */}
              {inventoryItems.length === 0 && !loadingInventory && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-bold text-primary mb-1">
                    {lang === "ar" ? "لا يوجد مخزون" : "No Inventory Items"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {lang === "ar"
                      ? "لم يتم إضافة أي عناصر مخزون بعد. أنشئ مخزونًا من صفحة المشروع في تبويب المخزون."
                      : "No inventory items have been added yet. Create inventory from the project detail page under the Inventory tab."}
                  </p>
                </div>
              )}
            </Card>
          </div>
        ))}

      {/* Change Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-card w-full max-w-sm rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <h2 className="text-xl font-bold text-primary mb-2">
              {lang === "ar" ? "تغيير السعر" : "Change Price"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {lang === "ar"
                ? `تحديث سعر ${selectedUnits.length} وحدة مختارة`
                : `Update price for ${selectedUnits.length} selected unit(s)`}
            </p>
            <div className="space-y-1 mb-6">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                {lang === "ar" ? "السعر الجديد" : "New Price"}
              </label>
              <Input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                style={{ display: "inline-flex" }}
                onClick={() => {
                  setShowPriceModal(false);
                  setBulkPrice("");
                }}
                disabled={updating}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleBulkPriceUpdate}
                disabled={updating || !bulkPrice}
                style={{ display: "inline-flex" }}
                className="gap-2"
              >
                {updating && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {lang === "ar" ? "تحديث السعر" : "Update Price"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Detail Modal */}
      {detailUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-card w-full max-w-xl rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-primary">
                  {lang === "ar" ? "تفاصيل الوحدة" : "Unit Details"} &mdash;{" "}
                  {detailUnit.number}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailUnit.building?.name}
                </p>
              </div>
              <button
                onClick={() => setDetailUnit(null)}
                className="text-muted-foreground hover:text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Unit Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "النوع" : "Type"}
                  </span>
                  <p className="text-sm font-bold text-primary">
                    {unitTypeLabels[detailUnit.type]?.[lang] ??
                      detailUnit.type}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </span>
                  <div className="text-sm mt-0.5">
                    <StatusBadge
                      entityType="unit"
                      status={detailUnit.status}
                      label={
                        unitStatusLabels[detailUnit.status]?.[lang] ??
                        detailUnit.status
                      }
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "المساحة" : "Area"}
                  </span>
                  <p className="text-sm font-bold text-primary">
                    {detailUnit.area
                      ? `${detailUnit.area} \u0645\u00B2`
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "سعر التكلفة" : "Cost Price"}
                  </span>
                  <p className="text-sm font-bold text-primary">
                    <SARAmount value={detailUnit.price} size={12} />
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "سعر البيع" : "Selling Price"}
                  </span>
                  <p className="text-sm font-bold text-secondary">
                    {detailUnit.markupPrice ? (
                      <SARAmount value={detailUnit.markupPrice} size={12} />
                    ) : (
                      "\u2014"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {lang === "ar" ? "سعر الإيجار" : "Rental Price"}
                  </span>
                  <p className="text-sm font-bold text-primary">
                    {detailUnit.rentalPrice ? (
                      <SARAmount value={detailUnit.rentalPrice} size={12} />
                    ) : (
                      "\u2014"
                    )}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              {detailFinancials && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {lang === "ar" ? "الملخص المالي" : "Financial Summary"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {lang === "ar" ? "إيجار محصّل" : "Rent Collected"}
                      </span>
                      <p className="text-sm font-bold text-secondary mt-0.5">
                        <SARAmount
                          value={detailFinancials.totalRentCollected}
                          size={10}
                          compact
                        />
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {lang === "ar" ? "إيراد البيع" : "Sale Revenue"}
                      </span>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        <SARAmount
                          value={detailFinancials.saleRevenue}
                          size={10}
                          compact
                        />
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {lang === "ar" ? "تكاليف صيانة" : "Maintenance"}
                      </span>
                      <p className="text-sm font-bold text-red-600 mt-0.5">
                        <SARAmount
                          value={detailFinancials.totalMaintenanceCost}
                          size={10}
                          compact
                        />
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {lang === "ar" ? "صافي الدخل" : "Net Income"}
                      </span>
                      <p
                        className={`text-sm font-bold mt-0.5 ${detailFinancials.netIncome >= 0 ? "text-secondary" : "text-red-600"}`}
                      >
                        <SARAmount
                          value={detailFinancials.netIncome}
                          size={10}
                          compact
                        />
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Contract Info */}
              {detailContract && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                    <Receipt className="h-3.5 w-3.5" />
                    {lang === "ar" ? "العقد المرتبط" : "Linked Contract"}
                  </h3>
                  <div className="p-3 rounded-md bg-muted/30 border border-border space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "النوع" : "Type"}
                      </span>
                      <Badge variant="draft" className="text-[10px]">
                        {detailContract.type === "SALE"
                          ? lang === "ar"
                            ? "بيع"
                            : "Sale"
                          : lang === "ar"
                            ? "إيجار"
                            : "Lease"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "الحالة" : "Status"}
                      </span>
                      <StatusBadge
                        entityType="contract"
                        status={detailContract.status}
                        label={
                          detailContract.status === "DRAFT"
                            ? lang === "ar"
                              ? "مسودة"
                              : "Draft"
                            : detailContract.status === "SENT"
                              ? lang === "ar"
                                ? "مُرسل"
                                : "Sent"
                              : lang === "ar"
                                ? "موقّع"
                                : "Signed"
                        }
                        size="sm"
                      />
                    </div>
                    {detailContract.customer?.name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "العميل" : "Customer"}
                        </span>
                        <span className="font-bold text-primary">
                          {detailContract.customer.name}
                        </span>
                      </div>
                    )}
                    {detailContract.contractNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "رقم العقد" : "Contract No."}
                        </span>
                        <span className="font-bold text-primary font-dm-sans">
                          {detailContract.contractNumber}
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/sales/contracts/${detailContract.id}`}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ display: "inline-flex" }}
                        className="gap-1 text-[10px] w-full mt-1"
                      >
                        <Eye className="h-3 w-3" />
                        {lang === "ar" ? "عرض العقد" : "View Contract"}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Sell / Rent Quick Actions */}
              {detailUnit.status === "AVAILABLE" && (
                <div className="border-t border-border pt-4 flex items-center gap-3">
                  <Link
                    href={`/dashboard/sales/reservations?unitId=${detailUnit.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ display: "inline-flex" }}
                      className="gap-2 w-full"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {lang === "ar" ? "بيع" : "Sell"}
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/rentals/new?unitId=${detailUnit.id}`}
                    className="flex-1"
                  >
                    <Button
                      size="sm"
                      style={{ display: "inline-flex" }}
                      className="gap-2 w-full"
                    >
                      <Home className="h-3.5 w-3.5" />
                      {lang === "ar" ? "تأجير" : "Rent"}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Maintenance Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5" />
                    {lang === "ar"
                      ? "طلبات الصيانة"
                      : "Maintenance Requests"}
                    {detailMaintenance.filter(
                      (m: any) =>
                        !["RESOLVED", "CLOSED"].includes(m.status)
                    ).length > 0 && (
                      <Badge variant="overdue" className="text-[9px]">
                        {
                          detailMaintenance.filter(
                            (m: any) =>
                              !["RESOLVED", "CLOSED"].includes(m.status)
                          ).length
                        }
                      </Badge>
                    )}
                  </h3>
                  <Link href={`/dashboard/maintenance`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ display: "inline-flex" }}
                      className="gap-1 text-[10px]"
                    >
                      <Plus className="h-3 w-3" />
                      {lang === "ar" ? "طلب جديد" : "New Request"}
                    </Button>
                  </Link>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : detailMaintenance.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {lang === "ar"
                      ? "لا توجد طلبات صيانة لهذه الوحدة"
                      : "No maintenance requests for this unit"}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {detailMaintenance.map((m: any) => {
                      const mStatus = maintenanceStatusLabels[m.status] ?? {
                        ar: m.status,
                        en: m.status,
                        variant: "draft",
                      };
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-xs font-bold text-primary">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(m.createdAt).toLocaleDateString(
                                "en-SA"
                              )}
                              {m.assignedTo?.name &&
                                ` \u2022 ${m.assignedTo.name}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={mStatus.variant as any}
                              className="text-[9px]"
                            >
                              {mStatus[lang]}
                            </Badge>
                            <Link href={`/dashboard/maintenance/${m.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                style={{ display: "inline-flex" }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-card w-full max-w-md rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <h2 className="text-xl font-bold text-primary mb-6">
              {lang === "ar" ? "إضافة وحدة جديدة" : "Add New Unit"}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  {lang === "ar" ? "رقم الوحدة" : "Unit Number"}
                </label>
                <Input
                  value={newUnit.number}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, number: e.target.value })
                  }
                  placeholder="e.g. A-101"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "المبنى" : "Building"}
                  </label>
                  <select
                    value={newUnit.buildingId}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, buildingId: e.target.value })
                    }
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.project.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "نوع الوحدة" : "Unit Type"}
                  </label>
                  <select
                    value={newUnit.type}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, type: e.target.value })
                    }
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.entries(unitTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "سعر التكلفة" : "Cost Price"}
                  </label>
                  <Input
                    type="number"
                    value={newUnit.price}
                    onChange={(e) =>
                      setNewUnit({ ...newUnit, price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "سعر البيع" : "Selling Price"}
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
                    {lang === "ar" ? "سعر الإيجار" : "Rental Price"}
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
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <Button
                variant="secondary"
                style={{ display: "inline-flex" }}
                onClick={() => setShowAddModal(false)}
                disabled={updating}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleAddUnit}
                disabled={updating}
                style={{ display: "inline-flex" }}
                className="gap-2"
              >
                {updating && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {lang === "ar" ? "حفظ الوحدة" : "Save Unit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
