"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import * as React from "react";
import {
  Check,
  User,
  Tag,
  Calendar,
  CircleDollarSign,
  ArrowRight,
  ArrowLeft,
  Building2,
  Info,
  AlertTriangle,
  Loader2,
  Search,
  Package,
  Home,
} from "lucide-react";
import { RiyalIcon } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { Button, Input, Badge } from "@repo/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCustomers } from "../../../../actions/customers";
import { createReservation } from "../../../../actions/reservations";
import { getMapInventory, reserveInventoryItem } from "../../../../actions/launch";
import { getProjects } from "../../../../actions/projects";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const steps = [
  { id: 1, label: { ar: "اختيار العميل", en: "Select Customer" }, icon: User },
  { id: 2, label: { ar: "اختيار الوحدة", en: "Select Unit" }, icon: Home },
  { id: 3, label: { ar: "تفاصيل الحجز", en: "Details" }, icon: Tag },
  { id: 4, label: { ar: "تأكيد الدفع", en: "Payment" }, icon: CircleDollarSign },
  { id: 5, label: { ar: "ملخص الحجز", en: "Summary" }, icon: Check },
];

function InnerNewReservationPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const { lang } = useLanguage();
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchingCustomers, setFetchingCustomers] = React.useState(true);

  // Source toggle state
  const [source, setSource] = React.useState<"unit" | "inventory">("unit");
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string>("");
  const [selectedUnit, setSelectedUnit] = React.useState<any>(null);
  const [inventoryItems, setInventoryItems] = React.useState<any[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = React.useState<any>(null);
  const [fetchingInventory, setFetchingInventory] = React.useState(false);
  const [fetchingProjects, setFetchingProjects] = React.useState(false);

  // Reservation details
  const [reservationDays, setReservationDays] = React.useState(7);
  const [expiryDate, setExpiryDate] = React.useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [depositAmount, setDepositAmount] = React.useState<number>(10000);

  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedUnitId = searchParams.get("unitId");

  // Load customers
  React.useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers");
      } finally {
        setFetchingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  // Load projects (used for both unit and inventory flows)
  React.useEffect(() => {
    setFetchingProjects(true);
    getProjects()
      .then((data) => {
        setProjects(data);
        // If preselected unitId, find and auto-select
        if (preselectedUnitId) {
          for (const project of data) {
            for (const building of project.buildings || []) {
              const unit = building.units?.find((u: any) => u.id === preselectedUnitId);
              if (unit) {
                setSelectedProjectId(project.id);
                setSelectedBuildingId(building.id);
                setSelectedUnit(unit);
                setDepositAmount(Number(unit.markupPrice ?? unit.price ?? 10000));
                break;
              }
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setFetchingProjects(false));
  }, [preselectedUnitId]);

  // Load inventory items when inventory source + project selected
  React.useEffect(() => {
    if (source === "inventory" && selectedProjectId) {
      setFetchingInventory(true);
      getMapInventory(selectedProjectId)
        .then((items) => {
          setInventoryItems(items.filter((i: any) => i.status === "AVAILABLE_INV"));
        })
        .catch(console.error)
        .finally(() => setFetchingInventory(false));
    }
  }, [source, selectedProjectId]);

  // Update expiry date when days change
  React.useEffect(() => {
    setExpiryDate(
      new Date(Date.now() + reservationDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
  }, [reservationDays]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const effectiveDeposit = source === "inventory" && selectedInventoryItem
    ? Number(selectedInventoryItem.basePriceSar ?? 10000)
    : depositAmount;

  const effectiveUnitId = selectedUnit?.id || preselectedUnitId || "";

  const handleConfirmReservation = async () => {
    if (!selectedCustomerId) return;
    if (source === "unit" && !effectiveUnitId) {
      alert(lang === "ar" ? "يرجى اختيار وحدة أولاً" : "Please select a unit first");
      return;
    }
    setLoading(true);
    try {
      if (source === "inventory" && selectedInventoryItem) {
        await reserveInventoryItem({
          projectId: selectedProjectId,
          inventoryItemId: selectedInventoryItem.id,
          customerId: selectedCustomerId,
          unitId: effectiveUnitId || "inventory-placeholder",
          amount: effectiveDeposit,
          expiresAt: new Date(expiryDate || "").toISOString(),
        });
      } else {
        await createReservation({
          customerId: selectedCustomerId,
          unitId: effectiveUnitId,
          amount: effectiveDeposit,
          expiresAt: new Date(expiryDate || ""),
        });
      }
      router.push("/dashboard/sales/reservations");
    } catch (err: any) {
      console.error("Reservation error:", err);
      alert(lang === "ar" ? `فشل تأكيد الحجز: ${err.message}` : `Failed to confirm reservation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((l) => l.id === selectedCustomerId);
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  const selectedBuilding = selectedProject?.buildings?.find((b: any) => b.id === selectedBuildingId);
  const availableUnits = selectedBuilding?.units?.filter((u: any) => u.status === "AVAILABLE") || [];

  const canProceedStep1 = !!selectedCustomerId;
  const canProceedStep2 = source === "unit"
    ? !!selectedUnit
    : (!!selectedInventoryItem);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Source Toggle */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-muted/30 p-1 rounded-md w-fit mx-auto">
        <button
          onClick={() => { setSource("unit"); setSelectedInventoryItem(null); }}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-bold transition-all",
            source === "unit" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
          )}
        >
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {lang === "ar" ? "من الوحدات" : "From Unit"}</span>
        </button>
        <button
          onClick={() => setSource("inventory")}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-bold transition-all",
            source === "inventory" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
          )}
        >
          <span className="flex items-center gap-2"><Package className="h-4 w-4" /> {lang === "ar" ? "من المخزون" : "From Inventory"}</span>
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0 mx-12" />
        <div
          className="absolute top-1/2 left-0 right-0 h-0.5 bg-secondary transition-all duration-500 -translate-y-1/2 z-0 mx-12"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 90}%` }}
        />
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive ? "bg-card border-secondary text-secondary ring-4 ring-secondary/10" :
                  isCompleted ? "bg-secondary border-secondary text-white" : "bg-card border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label[lang]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-card rounded-md shadow-card border border-border p-8 min-h-[500px] flex flex-col">

        {/* STEP 1: Customer Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-start">
              <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "اختر العميل المعني" : "Select Interested Customer"}</h2>
              <p className="text-sm text-muted-foreground font-dm-sans mt-1">{lang === "ar" ? "ابحث عن عميل موجود أو أضف عميل جديد لبدء الحجز" : "Search existing customer or add new to start reservation"}</p>
            </div>

            <div className="relative">
              <Input placeholder={lang === "ar" ? "بحث بالاسم أو الجوال..." : "Search by name or mobile..."} className="pl-12 h-12" />
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "العملاء المتاحون" : "Available Customers"}</h3>
              {fetchingCustomers ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : customers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا يوجد عملاء. أضف عميل أولاً من صفحة العملاء." : "No customers found. Add a customer first from the Customers page."}</p>
                  <Link href="/dashboard/sales/customers" className="text-sm text-secondary mt-2 inline-block hover:underline">
                    {lang === "ar" ? "إضافة عميل →" : "Add Customer →"}
                  </Link>
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-md border transition-all cursor-pointer",
                      selectedCustomerId === customer.id ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-primary font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{customer.name}</p>
                        <p className="text-xs text-muted-foreground font-dm-sans" dir="ltr">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={customer.status === "NEW" ? "default" : "reserved"} className="text-[10px]">
                        {customer.status}
                      </Badge>
                      {selectedCustomerId === customer.id && <Check className="h-5 w-5 text-secondary" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Unit / Inventory Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {source === "unit" ? (
              <>
                <div className="text-start">
                  <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "اختر الوحدة" : "Select Unit"}</h2>
                  <p className="text-sm text-muted-foreground font-dm-sans mt-1">{lang === "ar" ? "اختر المشروع ثم المبنى ثم الوحدة المراد حجزها" : "Select project, then building, then unit to reserve"}</p>
                </div>

                {fetchingProjects ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد مشاريع. أنشئ مشروع أولاً." : "No projects found. Create a project first."}</p>
                  </div>
                ) : (
                  <>
                    {/* Project Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "المشروع" : "Project"}</label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value);
                          setSelectedBuildingId("");
                          setSelectedUnit(null);
                        }}
                        className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                      >
                        <option value="">{lang === "ar" ? "— اختر المشروع —" : "— Select Project —"}</option>
                        {projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Building Selector */}
                    {selectedProjectId && selectedProject?.buildings?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "المبنى" : "Building"}</label>
                        <select
                          value={selectedBuildingId}
                          onChange={(e) => {
                            setSelectedBuildingId(e.target.value);
                            setSelectedUnit(null);
                          }}
                          className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                        >
                          <option value="">{lang === "ar" ? "— اختر المبنى —" : "— Select Building —"}</option>
                          {selectedProject.buildings.map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.name} {b.numberOfFloors ? `(${b.numberOfFloors} ${lang === "ar" ? "طوابق" : "floors"})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Unit Grid */}
                    {selectedBuildingId && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-muted-foreground">
                          {lang === "ar" ? "الوحدات المتاحة" : "Available Units"} ({availableUnits.length})
                        </label>
                        {availableUnits.length === 0 ? (
                          <div className="text-center py-6 bg-muted/10 rounded-md border border-dashed border-muted">
                            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد وحدات متاحة في هذا المبنى" : "No available units in this building"}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {availableUnits.map((unit: any) => (
                              <div
                                key={unit.id}
                                onClick={() => {
                                  setSelectedUnit(unit);
                                  setDepositAmount(Number(unit.markupPrice ?? unit.price ?? 10000));
                                }}
                                className={cn(
                                  "p-4 rounded-md border-2 cursor-pointer transition-all hover:shadow-md",
                                  selectedUnit?.id === unit.id
                                    ? "border-secondary bg-secondary/5 shadow-md"
                                    : "border-border hover:border-secondary/40"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-primary">{unit.number}</span>
                                  {selectedUnit?.id === unit.id && <Check className="h-4 w-4 text-secondary" />}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    {unit.type === "APARTMENT" ? (lang === "ar" ? "شقة" : "Apartment") :
                                     unit.type === "VILLA" ? (lang === "ar" ? "فيلا" : "Villa") :
                                     unit.type === "OFFICE" ? (lang === "ar" ? "مكتب" : "Office") :
                                     unit.type === "RETAIL" ? (lang === "ar" ? "محل تجاري" : "Retail") : unit.type}
                                  </p>
                                  {unit.area && (
                                    <p className="text-xs text-muted-foreground">{unit.area} {lang === "ar" ? "م²" : "m²"}</p>
                                  )}
                                  {(unit.markupPrice || unit.price) && (
                                    <p className="text-sm font-bold text-secondary flex items-center gap-1">
                                      <RiyalIcon className="h-3 w-3" /> {fmt(Number(unit.markupPrice ?? unit.price))}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Unit Summary */}
                    {selectedUnit && (
                      <div className="p-4 rounded-md bg-secondary/5 border border-secondary/20 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-secondary/10 flex items-center justify-center text-secondary">
                          <Home className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-primary">
                            {lang === "ar" ? "الوحدة المختارة:" : "Selected Unit:"} {selectedUnit.number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedProject?.name} → {selectedBuilding?.name}
                          </p>
                        </div>
                        <div className="text-end">
                          {(selectedUnit.markupPrice || selectedUnit.price) && (
                            <p className="text-lg font-bold text-secondary flex items-center gap-1">
                              <RiyalIcon className="h-4 w-4" /> {fmt(Number(selectedUnit.markupPrice ?? selectedUnit.price))}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Inventory Selection Flow */
              <div className="space-y-6">
                <div className="text-start">
                  <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "اختر المنتج من المخزون" : "Select Inventory Product"}</h2>
                  <p className="text-sm text-muted-foreground font-dm-sans mt-1">{lang === "ar" ? "اختر المشروع ثم المنتج المتاح للحجز" : "Select project then available product to reserve"}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "المشروع" : "Project"}</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedInventoryItem(null); }}
                    className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                  >
                    <option value="">{lang === "ar" ? "— اختر المشروع —" : "— Select Project —"}</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {fetchingInventory && (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                )}

                {!fetchingInventory && selectedProjectId && inventoryItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{lang === "ar" ? "لا توجد منتجات متاحة في هذا المشروع" : "No available items in this project"}</p>
                )}

                {!fetchingInventory && inventoryItems.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {inventoryItems.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedInventoryItem(item)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer",
                          selectedInventoryItem?.id === item.id ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-primary">
                            {item.productLabelArabic || item.productLabel || item.itemNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.productType} — {item.areaSqm ? `${item.areaSqm} م²` : "—"}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-bold text-secondary flex items-center gap-1 justify-end">
                            <RiyalIcon className="h-3 w-3" /> {fmt(Number(item.basePriceSar ?? 0))}
                          </p>
                          {selectedInventoryItem?.id === item.id && <Check className="h-4 w-4 text-secondary mr-auto" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Reservation Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-start">
              <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "تفاصيل الحجز" : "Reservation Details"}</h2>
              <p className="text-sm text-muted-foreground font-dm-sans mt-1">{lang === "ar" ? "تأكيد تفاصيل الوحدة المختارة ومدة الحجز" : "Confirm selected unit details and reservation duration"}</p>
            </div>

            <div className="p-4 rounded-md bg-primary/5 border border-primary/10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center text-white">
                {source === "inventory" ? <Package className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                {source === "inventory" && selectedInventoryItem ? (
                  <>
                    <p className="text-sm font-bold text-primary">{selectedInventoryItem.productLabelArabic || selectedInventoryItem.productLabel || selectedInventoryItem.itemNumber}</p>
                    <p className="text-xs text-muted-foreground">{selectedInventoryItem.productType} — {selectedInventoryItem.areaSqm ? `${selectedInventoryItem.areaSqm} م²` : "—"}</p>
                  </>
                ) : selectedUnit ? (
                  <>
                    <p className="text-sm font-bold text-primary">{lang === "ar" ? "وحدة" : "Unit"} {selectedUnit.number}</p>
                    <p className="text-xs text-muted-foreground">{selectedProject?.name} → {selectedBuilding?.name}</p>
                    {selectedUnit.area && <p className="text-xs text-muted-foreground">{selectedUnit.area} {lang === "ar" ? "م²" : "m²"}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "لم يتم اختيار وحدة" : "No unit selected"}</p>
                )}
              </div>
              <div className="text-end">
                <p className="text-xs text-muted-foreground uppercase font-bold">{lang === "ar" ? "سعر الوحدة" : "Unit Price"}</p>
                <p className="text-lg font-bold text-secondary flex items-center gap-1 justify-end">
                  <RiyalIcon className="h-4 w-4" /> {fmt(effectiveDeposit)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "مدة الحجز (أيام)" : "Reservation Duration (Days)"}</label>
                <select
                  value={reservationDays}
                  onChange={(e) => setReservationDays(Number(e.target.value))}
                  className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                >
                  <option value={7}>7 {lang === "ar" ? "أيام" : "Days"}</option>
                  <option value={14}>14 {lang === "ar" ? "يوم" : "Days"}</option>
                  <option value={30}>30 {lang === "ar" ? "يوم" : "Days"}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "تاريخ انتهاء الحجز" : "Expiry Date"}</label>
                <Input
                  type="date"
                  className="h-11"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">{lang === "ar" ? "مبلغ جدية الحجز (ر.س)" : "Deposit Amount (SAR)"}</label>
              <Input
                type="number"
                className="h-11"
                value={effectiveDeposit}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
              />
            </div>

            <div className="p-4 rounded-md bg-amber-500/5 border border-amber-500/20 flex gap-3">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-primary leading-relaxed">
                {source === "inventory"
                  ? (lang === "ar"
                    ? "سيتم تحديث حالة المنتج في المخزون إلى 'محجوز' ولن يكون متاحاً للبيع حتى انتهاء مدة الحجز."
                    : "The inventory item status will be updated to 'Reserved' and will not be available for sale until the reservation expires.")
                  : (lang === "ar"
                    ? "سيتم قفل الوحدة في النظام ومنع حجزها من قبل وكلاء آخرين حتى انتهاء المدة المحددة."
                    : "The unit will be locked in the system and prevented from being reserved by other agents until the specified period expires.")}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Payment Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500 text-center py-8">
            <div className="h-20 w-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary mb-4 transition-transform hover:scale-110">
              <CircleDollarSign className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "مبلغ الحجز" : "Reservation Deposit"}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                {lang === "ar"
                  ? `يتطلب تأكيد الحجز دفع مبلغ جدية حجز قدره ${fmt(effectiveDeposit)} ريال سعودي`
                  : `Confirming the reservation requires a deposit of SAR ${fmt(effectiveDeposit)}`}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4 pt-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{lang === "ar" ? "الإجمالي المستحق" : "Total Due"}</span>
                <span className="text-lg font-bold text-primary flex items-center gap-1.5"><RiyalIcon className="h-4 w-4" /> {fmt(effectiveDeposit)}</span>
              </div>

              <div className="p-4 rounded-md border-2 border-primary/20 bg-primary/5 text-start flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-primary">{lang === "ar" ? "تحويل بنكي / نقدي" : "Bank Transfer / Cash"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-xs text-muted-foreground/60">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "هذا المبلغ غير قابل للاسترداد حسب السياسة" : "This amount is non-refundable per policy"}</span>
            </div>
          </div>
        )}

        {/* STEP 5: Summary & Confirm */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-white mb-4">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Check className="h-8 w-8" />}
              </div>
              <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "تم تجهيز الحجز بنجاح" : "Reservation Ready"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{lang === "ar" ? "يرجى مراجعة البيانات قبل التأكيد النهائي" : "Please review details before final confirmation"}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-4 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "العميل" : "Client"}</span>
                <span className="font-bold text-primary">{selectedCustomer?.name || "..."}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "المشروع" : "Project"}</span>
                <span className="font-bold text-primary">{selectedProject?.name || "—"}</span>
              </div>
              {source === "unit" && selectedUnit && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "المبنى" : "Building"}</span>
                    <span className="font-bold text-primary">{selectedBuilding?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "الوحدة" : "Unit"}</span>
                    <span className="font-bold text-primary">{selectedUnit.number}</span>
                  </div>
                </>
              )}
              {source === "inventory" && selectedInventoryItem && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "المنتج" : "Product"}</span>
                    <span className="font-bold text-primary">
                      {selectedInventoryItem.productLabelArabic || selectedInventoryItem.itemNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "المصدر" : "Source"}</span>
                    <Badge variant="reserved" className="text-[10px]">{lang === "ar" ? "من المخزون" : "From Inventory"}</Badge>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "مدة الحجز" : "Duration"}</span>
                <span className="font-bold text-primary">{reservationDays} {lang === "ar" ? "يوم" : "days"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry"}</span>
                <span className="font-bold text-primary">{new Date(expiryDate || "").toLocaleDateString("ar-SA")}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-bold text-primary">{lang === "ar" ? "إجمالي مبلغ الحجز" : "Total Deposit"}</span>
                <span className="text-xl font-bold text-secondary flex items-center gap-1.5"><RiyalIcon className="h-5 w-5" /> {fmt(effectiveDeposit)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleConfirmReservation} disabled={loading} className="w-full py-6">
                {loading
                  ? (lang === "ar" ? "جاري التأكيد..." : "Confirming...")
                  : (lang === "ar" ? "تأكيد الحجز وإصدار السند" : "Confirm & Issue Receipt")}
              </Button>
              <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed" disabled title={lang === "ar" ? "قريباً" : "Coming soon"} style={{ display: "inline-flex" }}>
                {lang === "ar" ? "إرسال عرض سعر مخفض للعميل" : "Send Quotation to Client"}
              </Button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-auto pt-8 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="gap-2"
          >
            {lang === "ar" ? <ArrowRight className="h-[18px] w-[18px]" /> : <ArrowLeft className="h-[18px] w-[18px]" />}
            {lang === "ar" ? "السابق" : "Previous"}
          </Button>

          <Button
            onClick={nextStep}
            disabled={
              currentStep === steps.length ||
              (currentStep === 1 && !canProceedStep1) ||
              (currentStep === 2 && !canProceedStep2)
            }
            className="gap-2"
          >
            {lang === "ar" ? "التالي" : "Next"}
            {lang === "ar" ? <ArrowLeft className="h-[18px] w-[18px]" /> : <ArrowRight className="h-[18px] w-[18px]" />}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard/sales/reservations" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
          {lang === "ar" ? "إلغاء والعودة للحجوزات" : "Cancel and go back to reservations"}
        </Link>
      </div>
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <InnerNewReservationPage />
    </React.Suspense>
  );
}
