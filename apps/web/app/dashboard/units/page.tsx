"use client";

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
  Spinner
} from "@phosphor-icons/react";
import { Button, Badge, Input } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getUnitsWithBuildings, massUpdateUnits, createUnit, getBuildings } from "../../actions/units";

export default function AdvancedUnitMatrixPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [selectedUnits, setSelectedUnits] = React.useState<string[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [buildings, setBuildings] = React.useState<any[]>([]);
  const [newUnit, setNewUnit] = React.useState({
    number: "",
    type: "APARTMENT",
    buildingId: "",
    area: "",
    price: "",
    status: "AVAILABLE"
  });

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
            {lang === "ar" ? "مصفوفة الوحدات المتقدمة" : "Advanced Unit Matrix"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة حالة الوحدات والمخزون العقاري بشكل جماعي." : "Manage unit status and property inventory at scale."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
             {lang === "ar" ? "English" : "العربية"}
          </Button>
          <Button size="sm" className="gap-2">
            <Buildings size={18} weight="fill" />
            {lang === "ar" ? "تصدير المخطط" : "Export Layout"}
          </Button>
        </div>
      </div>

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
                 <option value="AVAILABLE">Available</option>
                 <option value="RESERVED">Reserved</option>
                 <option value="SOLD">Sold</option>
                 <option value="MAINTENANCE">Maintenance</option>
              </select>
              
              <Button size="sm" variant="secondary" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                 <CurrencyCircleDollar size={16} />
                 {lang === "ar" ? "تغيير السعر" : "Change Price"}
              </Button>
              <Button size="sm" variant="danger" className="gap-2 bg-red-500/80 hover:bg-red-500 whitespace-nowrap">
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
      <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                <input 
                  type="text" 
                  placeholder={lang === "ar" ? "رقم الوحدة..." : "Unit #..."}
                  className="w-full bg-white border-border rounded py-2 pr-10 pl-4 text-sm outline-none font-primary"
                />
              </div>
              <Button variant="secondary" size="sm" className="gap-2">
                 <Funnel size={16} />
                 {lang === "ar" ? "تصفية" : "Filter"}
              </Button>
           </div>
           <div className="flex items-center gap-2">
              <Badge variant="available" className="bg-secondary/5 border-secondary/20 text-secondary">
                {units.filter(u => u.status === "AVAILABLE").length} Available
              </Badge>
              <Badge variant="sold" className="bg-primary/5 border-primary/20 text-primary">
                {units.filter(u => u.status === "SOLD").length} Sold
              </Badge>
              <Badge variant="reserved" className="bg-accent/5 border-accent/20 text-accent">
                {units.filter(u => u.status === "RESERVED").length} Reserved
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

           {units.map((unit) => (
             <div 
               key={unit.id}
               onClick={() => toggleSelect(unit.id)}
               className={cn(
                 "relative group cursor-pointer aspect-square rounded-md border-2 p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden",
                 selectedUnits.includes(unit.id) 
                   ? "border-secondary bg-secondary/5 ring-4 ring-secondary/10" 
                   : "border-border bg-white hover:border-primary/20 hover:shadow-md"
               )}
             >
                {/* Selection Circle */}
                <div className={cn(
                  "absolute top-3 left-3 h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                  selectedUnits.includes(unit.id) ? "bg-secondary border-secondary text-white" : "bg-white border-border text-transparent"
                )}>
                   <CheckSquare size={12} weight="fill" />
                </div>

                <div className="text-end">
                   <h3 className="text-xl font-bold text-primary font-latin leading-none mt-1">{unit.number}</h3>
                   <span className="text-[10px] text-neutral font-latin">{unit.building?.name || "Bldg"}</span>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[10px] text-neutral font-primary">
                      <span>{unit.type}</span>
                      <span>{unit.area}m²</span>
                   </div>
                   <Badge variant={unit.status.toLowerCase() as any} className="w-full justify-center text-[9px] py-0.5">
                      {unit.status}
                   </Badge>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center hover:scale-110 transition-transform">
                      <NotePencil size={18} />
                   </button>
                   <button className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center hover:scale-110 transition-transform">
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
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
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
                          <option value="APARTMENT">Apartment</option>
                          <option value="VILLA">Villa</option>
                          <option value="OFFICE">Office</option>
                          <option value="RETAIL">Retail</option>
                          <option value="WAREHOUSE">Warehouse</option>
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
