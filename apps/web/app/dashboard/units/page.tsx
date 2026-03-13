"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  Buildings,
  Selection,
  CurrencyCircleDollar,
  Trash,
  NotePencil,
  CheckSquare,
  Square,
  Funnel,
  MagnifyingGlass,
  ArrowSquareOut,
  Plus,
  Spinner,
  Package,
  MapTrifold,
  ChartBar,
  Storefront,
  Tag,
  ArrowRight
} from "@phosphor-icons/react";
import { Button, Badge, Input, SARAmount, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getUnitsWithBuildings, massUpdateUnits, createUnit, getBuildings, deleteUnit, getUnitFinancialSummary } from "../../actions/units";
import { getMaintenanceForUnit } from "../../actions/maintenance";
import { getAllInventoryItems, getGlobalInventoryStats } from "../../actions/inventory";
import { Wrench, X, Eye, ShoppingCart, House, Spinner as SpinnerIcon } from "@phosphor-icons/react";
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

const invStatusConfig: Record<string, { ar: string; en: string; color: string }> = {
  UNRELEASED: { ar: "لم تُطلق", en: "Unreleased", color: "bg-muted text-neutral" },
  AVAILABLE_INV: { ar: "متاح", en: "Available", color: "bg-secondary/15 text-secondary" },
  RESERVED_INV: { ar: "محجوز", en: "Reserved", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  SOLD_INV: { ar: "مباع", en: "Sold", color: "bg-info/15 text-info" },
  HELD_INV: { ar: "محتجز", en: "Held", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  WITHDRAWN: { ar: "مسحوب", en: "Withdrawn", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
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
    <React.Suspense fallback={<div className="flex h-[calc(100vh-200px)] items-center justify-center"><Spinner className="h-8 w-8 animate-spin text-primary" /></div>}>
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
  const [newUnit, setNewUnit] = React.useState({
    number: "",
    type: "APARTMENT",
    buildingId: "",
    area: "",
    price: "",
    status: "AVAILABLE"
  });

  // Tab state
  const [activeTab, setActiveTab] = React.useState<"units" | "inventory">("units");

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
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const maintenanceStatusLabels: Record<string, { ar: string; en: string; variant: string }> = {
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
    setLoadingDetail(true);
    try {
      const [maint, fin] = await Promise.all([
        getMaintenanceForUnit(unit.id),
        getUnitFinancialSummary(unit.id).catch(() => null),
      ]);
      setDetailMaintenance(maint);
      setDetailFinancials(fin);
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
          setNewUnit(prev => ({ ...prev, buildingId: firstBuilding.id }));
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
    setSelectedUnits(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updates = selectedUnits.map(id => ({ id, status: newStatus }));
      await massUpdateUnits(updates);
      // Refresh local state
      setUnits(units.map(u => u && selectedUnits.includes(u.id) ? { ...u, status: newStatus } : u));
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
      });
      setUnits(prev => [...prev, unit]);
      setShowAddModal(false);
      setNewUnit({
        number: "",
        type: "APARTMENT",
        buildingId: buildings[0]?.id || "",
        area: "",
        price: "",
        status: "AVAILABLE"
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
      const updates = selectedUnits.map(id => ({ id, price: parseFloat(bulkPrice) }));
      await massUpdateUnits(updates);
      setUnits(units.map(u => selectedUnits.includes(u.id) ? { ...u, price: parseFloat(bulkPrice) } : u));
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
    const msg = lang === "ar"
      ? `هل أنت متأكد من حذف ${count} وحدة؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete ${count} unit(s)? This action cannot be undone.`;
    if (!confirm(msg)) return;
    setUpdating(true);
    try {
      for (const id of selectedUnits) {
        await deleteUnit(id);
      }
      setUnits(units.filter(u => !selectedUnits.includes(u.id)));
      setSelectedUnits([]);
    } catch (err) {
      alert(lang === "ar" ? "فشل حذف بعض الوحدات" : "Failed to delete some units");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "الوحدات والمخزون" : "Units & Inventory"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة الوحدات المادية ومخزون المشاريع على الخارطة." : "Manage physical units and off-plan project inventory."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "units" && (
            <Button size="sm" className="gap-2">
              <Buildings size={18} weight="fill" />
              {lang === "ar" ? "تصدير المخطط" : "Export Layout"}
            </Button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg w-fit mx-2">
        <button
          onClick={() => setActiveTab("units")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all",
            activeTab === "units"
              ? "bg-card text-primary shadow-sm"
              : "text-neutral hover:text-primary hover:bg-card/50"
          )}
        >
          <Buildings size={18} weight={activeTab === "units" ? "fill" : "regular"} />
          {lang === "ar" ? "الوحدات المادية" : "Physical Units"}
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            activeTab === "units" ? "bg-primary/10 text-primary" : "bg-muted text-neutral"
          )}>
            {units.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all",
            activeTab === "inventory"
              ? "bg-card text-primary shadow-sm"
              : "text-neutral hover:text-primary hover:bg-card/50"
          )}
        >
          <Package size={18} weight={activeTab === "inventory" ? "fill" : "regular"} />
          {lang === "ar" ? "مخزون على الخارطة" : "Off-Plan Inventory"}
          {inventoryStats && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              activeTab === "inventory" ? "bg-primary/10 text-primary" : "bg-muted text-neutral"
            )}>
              {inventoryStats.total}
            </span>
          )}
        </button>
      </div>

      {/* ═══ PHYSICAL UNITS TAB ═══ */}
      {activeTab === "units" && <>

      {/* Bulk Action Bar (Floating) */}
      {selectedUnits.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-primary-deep text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex items-center gap-8 animate-in slide-in-from-bottom-10">
           <div className="flex items-center gap-3 border-r border-white/20 pr-6 mr-2">
              <span className="h-6 w-6 bg-secondary text-white rounded-full flex items-center justify-center text-xs font-bold leading-none">
                 {selectedUnits.length}
              </span>
              <span className="text-sm font-primary">{lang === "ar" ? "وحدة مختارة" : "Units Selected"}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <select 
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                disabled={updating}
                className="bg-secondary/80 hover:bg-secondary text-white text-xs font-bold rounded-md px-3 py-2 outline-none border-none cursor-pointer"
              >
                 <option value="">{lang === "ar" ? "تحديث الحالة" : "Update Status"}</option>
                 {Object.entries(unitStatusLabels).map(([value, label]) => (
                   <option key={value} value={value}>{label[lang]}</option>
                 ))}
              </select>
              
              <Button size="sm" variant="secondary" className="gap-2 bg-card/10 border-white/20 text-white hover:bg-card/20" onClick={() => setShowPriceModal(true)} disabled={updating}>
                 <CurrencyCircleDollar size={16} />
                 {lang === "ar" ? "تغيير السعر" : "Change Price"}
              </Button>
              <Button size="sm" variant="danger" className="gap-2 bg-red-500/80 hover:bg-red-500 whitespace-nowrap" onClick={handleBulkDelete} disabled={updating}>
                 <Trash size={16} />
                 {lang === "ar" ? "حذف" : "Delete"}
              </Button>
           </div>
           
           <button onClick={() => setSelectedUnits([])} className="text-xs text-white/50 hover:text-white underline underline-offset-4 ml-4">
              {lang === "ar" ? "إلغاء التحديد" : "Clear Selection"}
           </button>
        </div>
      )}

      {/* Grid Layout */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                <input
                  type="text"
                  placeholder={lang === "ar" ? "رقم الوحدة..." : "Unit #..."}
                  className="w-full bg-card border-border rounded py-2 pr-10 pl-4 text-sm outline-none font-primary"
                />
              </div>
              {/* Project Filter */}
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-9 px-3 bg-card border border-border rounded-md text-xs outline-none"
              >
                <option value="">{lang === "ar" ? "كل المشاريع" : "All Projects"}</option>
                {Array.from(new Map(buildings.map((b: any) => [b.project?.id, b.project?.name])).entries())
                  .filter(([id]) => id)
                  .map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
              </select>
              <Button variant="secondary" size="sm" className="gap-2">
                 <Funnel size={16} />
                 {lang === "ar" ? "تصفية" : "Filter"}
              </Button>
           </div>
           <div className="flex items-center gap-2">
              <Badge variant="available" className="bg-secondary/15 border border-secondary/40 text-secondary font-bold px-3 py-1">
                {units.filter(u => u.status === "AVAILABLE").length} {unitStatusLabels["AVAILABLE"]![lang]}
              </Badge>
              <Badge variant="sold" className="bg-primary/15 border border-primary/40 text-primary font-bold px-3 py-1">
                {units.filter(u => u.status === "SOLD").length} {unitStatusLabels["SOLD"]![lang]}
              </Badge>
              <Badge variant="reserved" className="bg-accent/15 border border-accent/40 text-accent font-bold px-3 py-1">
                {units.filter(u => u.status === "RESERVED").length} {unitStatusLabels["RESERVED"]![lang]}
              </Badge>
           </div>
        </div>

        {/* Matrix Grid */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 relative">
           {/* Decorative Background Traces */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden scale-110">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                 <path d="M50 0 V100 M0 50 H1000 M200 0 V1000" stroke="#107840" strokeWidth="20" fill="none" />
                 <circle cx="50" cy="50" r="15" fill="#107840" />
                 <circle cx="200" cy="200" r="15" fill="#107840" />
              </svg>
           </div>

           {units.filter((u) => !selectedProject || u.building?.project?.id === selectedProject).map((unit) => (
             <div 
               key={unit.id}
               onClick={() => toggleSelect(unit.id)}
               className={cn(
                 "relative group cursor-pointer aspect-square rounded-md border-2 p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden",
                 selectedUnits.includes(unit.id) 
                   ? "border-secondary bg-secondary/5 ring-4 ring-secondary/10" 
                   : "border-border bg-card hover:border-primary/20 hover:shadow-md"
               )}
             >
                {/* Selection Checkbox */}
                <div className={cn(
                  "absolute top-2.5 right-2.5 h-5 w-5 rounded border-[1.5px] flex items-center justify-center transition-all z-10",
                  selectedUnits.includes(unit.id) ? "bg-secondary border-secondary text-white" : "bg-card/80 border-border text-transparent group-hover:border-primary/40"
                )}>
                   <CheckSquare size={12} weight="bold" />
                </div>

                <div className="text-end">
                   <h3 className="text-xl font-bold text-primary font-latin leading-none mt-1">{unit.number}</h3>
                   <span className="text-[10px] text-neutral font-latin">{unit.building?.name || "Bldg"}</span>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[10px] text-neutral font-primary">
                      <span>{unitTypeLabels[unit.type]?.[lang] ?? unit.type}</span>
                      <span>{unit.area}m²</span>
                   </div>
                   <Badge variant={unit.status.toLowerCase() as any} className="w-full justify-center text-[9px] py-0.5">
                      {unitStatusLabels[unit.status]?.[lang] ?? unit.status}
                   </Badge>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button className="h-8 w-8 rounded-full bg-card text-primary flex items-center justify-center hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); }}>
                      <NotePencil size={18} />
                   </button>
                   <button className="h-8 w-8 rounded-full bg-card text-primary flex items-center justify-center hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); openUnitDetail(unit); }}>
                      <ArrowSquareOut size={18} />
                   </button>
                </div>
             </div>
           ))}

           {/* Add New Unit Placeholder */}
           <div
             onClick={() => setShowAddModal(true)}
             className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-neutral hover:border-secondary hover:text-secondary transition-all cursor-pointer group"
           >
              <Plus size={32} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest mt-2">{lang === "ar" ? "أضف وحدة" : "Add Unit"}</span>
           </div>
        </div>
      </Card>

      </>}

      {/* ═══ OFF-PLAN INVENTORY TAB ═══ */}
      {activeTab === "inventory" && (
        loadingInventory ? (
          <div className="flex h-[calc(100vh-350px)] items-center justify-center">
            <Spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            {inventoryStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-2">
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Package size={18} className="text-primary" weight="duotone" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "إجمالي المخزون" : "Total Items"}</span>
                  </div>
                  <p className="text-2xl font-bold text-primary font-latin">{inventoryStats.total}</p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-secondary/10 flex items-center justify-center">
                      <Storefront size={18} className="text-secondary" weight="duotone" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "متاح" : "Available"}</span>
                  </div>
                  <p className="text-2xl font-bold text-secondary font-latin">{inventoryStats.available}</p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <Tag size={18} className="text-amber-600" weight="duotone" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "محجوز" : "Reserved"}</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 font-latin">{inventoryStats.reserved}</p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-info/10 flex items-center justify-center">
                      <ChartBar size={18} className="text-info" weight="duotone" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "مباع" : "Sold"}</span>
                  </div>
                  <p className="text-2xl font-bold text-info font-latin">{inventoryStats.sold}</p>
                </Card>
                <Card className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center">
                      <CurrencyCircleDollar size={18} className="text-accent" weight="duotone" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "قيمة المخزون" : "Pipeline Value"}</span>
                  </div>
                  <p className="text-lg font-bold text-primary"><SARAmount value={inventoryStats.totalValue} size={12} compact /></p>
                </Card>
              </div>
            )}

            {/* Inventory Table */}
            <Card className="overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                    <input
                      type="text"
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      placeholder={lang === "ar" ? "بحث في المخزون..." : "Search inventory..."}
                      className="w-full bg-card border-border rounded py-2 pr-10 pl-4 text-sm outline-none font-primary"
                    />
                  </div>
                  <select
                    value={invStatusFilter}
                    onChange={(e) => setInvStatusFilter(e.target.value)}
                    className="h-9 px-3 bg-card border border-border rounded-md text-xs outline-none"
                  >
                    <option value="">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
                    {Object.entries(invStatusConfig).map(([value, label]) => (
                      <option key={value} value={value}>{label[lang]}</option>
                    ))}
                  </select>
                  <select
                    value={invProjectFilter}
                    onChange={(e) => setInvProjectFilter(e.target.value)}
                    className="h-9 px-3 bg-card border border-border rounded-md text-xs outline-none"
                  >
                    <option value="">{lang === "ar" ? "كل المشاريع" : "All Projects"}</option>
                    {Array.from(new Map(inventoryItems.map((i: any) => [i.project?.id, i.project?.name])).entries())
                      .filter(([id]) => id)
                      .map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {inventoryStats && (
                    <>
                      <Badge variant="available" className="bg-secondary/15 border border-secondary/40 text-secondary font-bold px-3 py-1">
                        {inventoryStats.available} {lang === "ar" ? "متاح" : "Available"}
                      </Badge>
                      <Badge variant="sold" className="bg-info/15 border border-info/40 text-info font-bold px-3 py-1">
                        {inventoryStats.sold} {lang === "ar" ? "مباع" : "Sold"}
                      </Badge>
                      <Badge variant="reserved" className="bg-muted border border-border text-neutral font-bold px-3 py-1">
                        {inventoryStats.unreleased} {lang === "ar" ? "لم تُطلق" : "Unreleased"}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang === "ar" ? "رقم العنصر" : "Item #"}</TableHead>
                      <TableHead>{lang === "ar" ? "نوع المنتج" : "Product Type"}</TableHead>
                      <TableHead>{lang === "ar" ? "المشروع" : "Project"}</TableHead>
                      <TableHead>{lang === "ar" ? "المساحة" : "Area"}</TableHead>
                      <TableHead>{lang === "ar" ? "السعر" : "Price"}</TableHead>
                      <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems
                      .filter((item: any) => {
                        if (invStatusFilter && item.status !== invStatusFilter) return false;
                        if (invProjectFilter && item.project?.id !== invProjectFilter) return false;
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
                        const ist = invStatusConfig[item.status] ?? invStatusConfig.UNRELEASED!;
                        const pt = productTypeLabels[item.productType] ?? { ar: item.productType, en: item.productType };
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="font-bold text-primary font-latin">{item.itemNumber}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-foreground">{pt[lang]}</span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/projects/${item.project?.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                {item.project?.name ?? "—"}
                                <ArrowSquareOut size={12} />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-neutral font-latin">{item.areaSqm ? `${item.areaSqm} م²` : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-bold text-primary">
                                {item.finalPriceSar || item.basePriceSar ? (
                                  <SARAmount value={item.finalPriceSar ?? item.basePriceSar} size={10} compact />
                                ) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", ist.color)}>{ist[lang]}</span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/projects/${item.project?.id}`}>
                                <Button variant="ghost" size="sm" className="text-neutral hover:text-primary">
                                  <ArrowRight size={14} />
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
                    <Package size={48} className="text-neutral/30 mb-4" weight="duotone" />
                    <h3 className="text-lg font-bold text-primary mb-1 font-primary">{lang === "ar" ? "لا يوجد مخزون" : "No Inventory Items"}</h3>
                    <p className="text-sm text-neutral max-w-md font-primary">
                      {lang === "ar"
                        ? "لم يتم إضافة أي عناصر مخزون بعد. أنشئ مخزونًا من صفحة المشروع في تبويب المخزون."
                        : "No inventory items have been added yet. Create inventory from the project detail page under the Inventory tab."}
                    </p>
                  </div>
                )}
            </Card>
          </div>
        )
      )}

      {/* Change Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-sm rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-primary mb-2 font-primary">
                 {lang === "ar" ? "تغيير السعر" : "Change Price"}
              </h2>
              <p className="text-sm text-neutral mb-6">
                 {lang === "ar" ? `تحديث سعر ${selectedUnits.length} وحدة مختارة` : `Update price for ${selectedUnits.length} selected unit(s)`}
              </p>
              <div className="space-y-1 mb-6">
                 <label className="text-xs font-bold text-neutral flex items-center gap-1">{lang === "ar" ? "السعر الجديد" : "New Price"}</label>
                 <Input
                   type="number"
                   value={bulkPrice}
                   onChange={(e) => setBulkPrice(e.target.value)}
                   placeholder="0.00"
                   autoFocus
                 />
              </div>
              <div className="flex items-center justify-end gap-3">
                 <Button variant="secondary" onClick={() => { setShowPriceModal(false); setBulkPrice(""); }} disabled={updating}>
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button onClick={handleBulkPriceUpdate} disabled={updating || !bulkPrice} className="gap-2">
                    {updating && <Spinner className="h-4 w-4 animate-spin" />}
                    {lang === "ar" ? "تحديث السعر" : "Update Price"}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Unit Detail Modal */}
      {detailUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-xl rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "تفاصيل الوحدة" : "Unit Details"} — {detailUnit.number}</h2>
                <p className="text-xs text-neutral mt-0.5">{detailUnit.building?.name}</p>
              </div>
              <button onClick={() => setDetailUnit(null)} className="text-neutral hover:text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Unit Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "النوع" : "Type"}</span>
                  <p className="text-sm font-bold text-primary">{unitTypeLabels[detailUnit.type]?.[lang] ?? detailUnit.type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "الحالة" : "Status"}</span>
                  <p className="text-sm"><Badge variant={detailUnit.status?.toLowerCase() as any} className="text-[10px]">{unitStatusLabels[detailUnit.status]?.[lang] ?? detailUnit.status}</Badge></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "المساحة" : "Area"}</span>
                  <p className="text-sm font-bold text-primary">{detailUnit.area ? `${detailUnit.area} م²` : "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "السعر" : "Price"}</span>
                  <p className="text-sm font-bold text-primary">
                    <SARAmount value={detailUnit.price} size={12} />
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              {detailFinancials && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-3">
                    {lang === "ar" ? "الملخص المالي" : "Financial Summary"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-neutral uppercase">{lang === "ar" ? "إيجار محصّل" : "Rent Collected"}</span>
                      <p className="text-sm font-bold text-secondary mt-0.5"><SARAmount value={detailFinancials.totalRentCollected} size={10} compact /></p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-neutral uppercase">{lang === "ar" ? "إيراد البيع" : "Sale Revenue"}</span>
                      <p className="text-sm font-bold text-primary mt-0.5"><SARAmount value={detailFinancials.saleRevenue} size={10} compact /></p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-neutral uppercase">{lang === "ar" ? "تكاليف صيانة" : "Maintenance"}</span>
                      <p className="text-sm font-bold text-red-600 mt-0.5"><SARAmount value={detailFinancials.totalMaintenanceCost} size={10} compact /></p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-3">
                      <span className="text-[9px] font-bold text-neutral uppercase">{lang === "ar" ? "صافي الدخل" : "Net Income"}</span>
                      <p className={`text-sm font-bold mt-0.5 ${detailFinancials.netIncome >= 0 ? "text-secondary" : "text-red-600"}`}>
                        <SARAmount value={detailFinancials.netIncome} size={10} compact />
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sell / Rent Quick Actions */}
              {detailUnit.status === "AVAILABLE" && (
                <div className="border-t border-border pt-4 flex items-center gap-3">
                  <Link href={`/dashboard/sales/reservations?unitId=${detailUnit.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="gap-2 w-full">
                      <ShoppingCart size={14} />
                      {lang === "ar" ? "بيع" : "Sell"}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/rentals/new?unitId=${detailUnit.id}`} className="flex-1">
                    <Button size="sm" className="gap-2 w-full">
                      <House size={14} />
                      {lang === "ar" ? "تأجير" : "Rent"}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Maintenance Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral flex items-center gap-2">
                    <Wrench size={14} />
                    {lang === "ar" ? "طلبات الصيانة" : "Maintenance Requests"}
                    {detailMaintenance.filter((m: any) => !["RESOLVED", "CLOSED"].includes(m.status)).length > 0 && (
                      <Badge variant="overdue" className="text-[9px]">
                        {detailMaintenance.filter((m: any) => !["RESOLVED", "CLOSED"].includes(m.status)).length}
                      </Badge>
                    )}
                  </h3>
                  <Link href={`/dashboard/maintenance`}>
                    <Button variant="secondary" size="sm" className="gap-1 text-[10px]">
                      <Plus size={12} />
                      {lang === "ar" ? "طلب جديد" : "New Request"}
                    </Button>
                  </Link>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center py-6">
                    <Spinner size={20} className="animate-spin text-primary" />
                  </div>
                ) : detailMaintenance.length === 0 ? (
                  <p className="text-xs text-neutral text-center py-4">{lang === "ar" ? "لا توجد طلبات صيانة لهذه الوحدة" : "No maintenance requests for this unit"}</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {detailMaintenance.map((m: any) => {
                      const mStatus = maintenanceStatusLabels[m.status] ?? { ar: m.status, en: m.status, variant: "draft" };
                      return (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/10 transition-colors">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-primary">{m.title}</p>
                            <p className="text-[10px] text-neutral mt-0.5">
                              {new Date(m.createdAt).toLocaleDateString("en-SA")}
                              {m.assignedTo?.name && ` • ${m.assignedTo.name}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={mStatus.variant as any} className="text-[9px]">{mStatus[lang]}</Badge>
                            <Link href={`/dashboard/maintenance/${m.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye size={12} />
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
           <div className="bg-card w-full max-w-md rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-primary mb-6 font-primary">
                 {lang === "ar" ? "إضافة وحدة جديدة" : "Add New Unit"}
              </h2>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الوحدة" : "Unit Number"}</label>
                    <Input 
                      value={newUnit.number}
                      onChange={(e) => setNewUnit({...newUnit, number: e.target.value})}
                      placeholder="e.g. A-101"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المبنى" : "Building"}</label>
                       <select 
                         value={newUnit.buildingId}
                         onChange={(e) => setNewUnit({...newUnit, buildingId: e.target.value})}
                         className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       >
                          {buildings.map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.project.name})</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "نوع الوحدة" : "Unit Type"}</label>
                       <select 
                         value={newUnit.type}
                         onChange={(e) => setNewUnit({...newUnit, type: e.target.value})}
                         className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       >
                          {Object.entries(unitTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label[lang]}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
                       <Input 
                         type="number"
                         value={newUnit.area}
                         onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                         placeholder="0.00"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "السعر" : "Price"}</label>
                       <Input 
                         type="number"
                         value={newUnit.price}
                         onChange={(e) => setNewUnit({...newUnit, price: e.target.value})}
                         placeholder="0.00"
                       />
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                 <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={updating}>
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button onClick={handleAddUnit} disabled={updating} className="gap-2">
                    {updating && <Spinner className="h-4 w-4 animate-spin" />}
                    {lang === "ar" ? "حفظ الوحدة" : "Save Unit"}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
