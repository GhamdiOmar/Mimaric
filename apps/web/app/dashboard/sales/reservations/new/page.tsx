"use client";

import * as React from "react";
import {
  Check,
  User,
  Tag,
  Calendar,
  CurrencyCircleDollar,
  ArrowRight,
  ArrowLeft,
  Buildings,
  Info,
  Warning,
  Spinner,
  MagnifyingGlass,
  Package,
} from "@phosphor-icons/react";
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
  { id: 2, label: { ar: "تفاصيل الحجز", en: "Details" }, icon: Tag },
  { id: 3, label: { ar: "تأكيد الدفع", en: "Payment" }, icon: CurrencyCircleDollar },
  { id: 4, label: { ar: "ملخص الحجز", en: "Summary" }, icon: Check },
];

function InnerNewReservationPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchingCustomers, setFetchingCustomers] = React.useState(true);

  // Source toggle state
  const [source, setSource] = React.useState<"unit" | "inventory">("unit");
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [inventoryItems, setInventoryItems] = React.useState<any[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = React.useState<any>(null);
  const [fetchingInventory, setFetchingInventory] = React.useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const unitId = searchParams.get("unitId") || "default-unit-id";

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

  React.useEffect(() => {
    if (source === "inventory") {
      getProjects().then(setProjects).catch(console.error);
    }
  }, [source]);

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

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const depositAmount = source === "inventory" && selectedInventoryItem
    ? Number(selectedInventoryItem.basePriceSar ?? 10000)
    : 10000;

  const handleConfirmReservation = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      if (source === "inventory" && selectedInventoryItem) {
        await reserveInventoryItem({
          projectId: selectedProjectId,
          inventoryItemId: selectedInventoryItem.id,
          customerId: selectedCustomerId,
          unitId: unitId,
          amount: depositAmount,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        await createReservation({
          customerId: selectedCustomerId,
          unitId: unitId,
          amount: 10000,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
      router.push("/dashboard/units");
    } catch (err) {
      alert("Failed to confirm reservation");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(l => l.id === selectedCustomerId);

  const canProceedStep1 = selectedCustomerId && (
    source === "unit" || (source === "inventory" && selectedInventoryItem)
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Source Toggle */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-muted/30 p-1 rounded-md w-fit mx-auto">
        <button
          onClick={() => { setSource("unit"); setSelectedInventoryItem(null); }}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-bold transition-all",
            source === "unit" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-primary"
          )}
        >
          <span className="flex items-center gap-2"><Buildings size={16} /> {lang === "ar" ? "من الوحدات" : "From Unit"}</span>
        </button>
        <button
          onClick={() => setSource("inventory")}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-bold transition-all",
            source === "inventory" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-primary"
          )}
        >
          <span className="flex items-center gap-2"><Package size={16} /> {lang === "ar" ? "من المخزون" : "From Inventory"}</span>
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative px-4">
        {/* Progress Line */}
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
                  isCompleted ? "bg-secondary border-secondary text-white" : "bg-card border-muted text-neutral"
                )}
              >
                {isCompleted ? <Check size={20} weight="bold" /> : <Icon size={20} />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-primary" : "text-neutral"
              )}>
                {step.label[lang]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-card rounded-md shadow-card border border-border p-8 min-h-[500px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-start">
              <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "اختر العميل المعني" : "Select Interested Customer"}</h2>
              <p className="text-sm text-neutral font-dm-sans mt-1">{lang === "ar" ? "ابحث عن عميل موجود أو أضف عميل جديد لبدء الحجز" : "Search existing customer or add new to start reservation"}</p>
            </div>

            <div className="relative">
              <Input placeholder={lang === "ar" ? "بحث بالاسم أو الجوال..." : "Search by name or mobile..."} className="pl-12 h-12" />
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-neutral">{lang === "ar" ? "العملاء المتاحون" : "Available Customers"}</h3>
              {fetchingCustomers ? (
                <div className="flex justify-center py-10"><Spinner className="animate-spin text-primary" size={24} /></div>
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
                        <p className="text-xs text-neutral font-dm-sans" dir="ltr">{customer.phone}</p>
                      </div>
                    </div>
                    {selectedCustomerId === customer.id && <Check size={20} className="text-secondary" weight="bold" />}
                  </div>
                ))
              )}
            </div>

            {/* Inventory Selection (when source is "inventory") */}
            {source === "inventory" && selectedCustomerId && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase text-neutral">{lang === "ar" ? "اختر المشروع والمنتج" : "Select Project & Product"}</h3>
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

                {fetchingInventory && (
                  <div className="flex justify-center py-4"><Spinner className="animate-spin text-primary" size={20} /></div>
                )}

                {!fetchingInventory && selectedProjectId && inventoryItems.length === 0 && (
                  <p className="text-sm text-neutral text-center py-4">{lang === "ar" ? "لا توجد منتجات متاحة في هذا المشروع" : "No available items in this project"}</p>
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
                          <p className="text-xs text-neutral">
                            {item.productType} — {item.areaSqm ? `${item.areaSqm} م²` : "—"}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-bold text-secondary flex items-center gap-1 justify-end">
                            <RiyalIcon size={12} /> {fmt(Number(item.basePriceSar ?? 0))}
                          </p>
                          {selectedInventoryItem?.id === item.id && <Check size={16} className="text-secondary mr-auto" weight="bold" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="text-start">
              <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "تفاصيل الوحدة والحجز" : "Unit & Reservation Details"}</h2>
              <p className="text-sm text-neutral font-dm-sans mt-1">{lang === "ar" ? "تأكيد تفاصيل الوحدة المختارة ومدة الحجز" : "Confirm unit details and reservation duration"}</p>
            </div>

            <div className="p-4 rounded-md bg-primary/5 border border-primary/10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center text-white">
                {source === "inventory" ? <Package size={24} /> : <Buildings size={24} />}
              </div>
              <div>
                {source === "inventory" && selectedInventoryItem ? (
                  <>
                    <p className="text-sm font-bold text-primary">{selectedInventoryItem.productLabelArabic || selectedInventoryItem.productLabel || selectedInventoryItem.itemNumber}</p>
                    <p className="text-xs text-neutral">{selectedInventoryItem.productType} — {selectedInventoryItem.areaSqm ? `${selectedInventoryItem.areaSqm} م²` : "—"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-primary">وحدة {unitId.split('-')[0]} - المجمع السكني</p>
                    <p className="text-xs text-neutral">ID: {unitId}</p>
                  </>
                )}
              </div>
              <div className="mr-auto text-end">
                <p className="text-xs text-neutral uppercase font-bold">{lang === "ar" ? "المبلغ المقدر" : "Estimated Price"}</p>
                <p className="text-lg font-bold text-secondary flex items-center gap-1 justify-end">
                  <RiyalIcon size={16} /> {source === "inventory" && selectedInventoryItem ? fmt(Number(selectedInventoryItem.basePriceSar ?? 0)) : "950,000"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral">{lang === "ar" ? "مدة الحجز (أيام)" : "Reservation Duration (Days)"}</label>
                <select className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none">
                  <option>7 {lang === "ar" ? "أيام" : "Days"}</option>
                  <option>14 {lang === "ar" ? "يوم" : "Days"}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral">{lang === "ar" ? "تاريخ انتهاء الحجز" : "Expiry Date"}</label>
                <Input type="date" className="h-11" defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="p-4 rounded-md bg-accent/5 border border-accent/20 flex gap-3">
              <Info size={20} className="text-accent shrink-0 mt-0.5" />
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

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500 text-center py-8">
            <div className="h-20 w-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary mb-4 transition-transform hover:scale-110">
              <CurrencyCircleDollar size={48} weight="fill" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "مبلغ الحجز" : "Reservation Deposit"}</h2>
              <p className="text-sm text-neutral max-w-sm mx-auto mt-2">
                {lang === "ar"
                  ? `يتطلب تأكيد الحجز دفع مبلغ جدية حجز قدره ${fmt(depositAmount)} ريال سعودي`
                  : `Confirming the reservation requires a deposit of SAR ${fmt(depositAmount)}`}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4 pt-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-neutral">{lang === "ar" ? "الإجمالي المستحق" : "Total Due"}</span>
                <span className="text-lg font-bold text-primary flex items-center gap-1.5"><RiyalIcon size={16} /> {fmt(depositAmount)}</span>
              </div>

              <div className="p-4 rounded-md border-2 border-primary/20 bg-primary/5 text-start flex items-center gap-3">
                <Check size={20} className="text-primary" />
                <span className="text-sm font-bold text-primary">{lang === "ar" ? "تحويل بنكي / نقدي" : "Bank Transfer / Cash"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-xs text-neutral/60">
              <Warning size={14} />
              <span>{lang === "ar" ? "هذا المبلغ غير قابل للاسترداد حسب السياسة" : "This amount is non-refundable per policy"}</span>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-white mb-4">
                {loading ? <Spinner className="animate-spin" size={32} /> : <Check size={32} weight="bold" />}
              </div>
              <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "تم تجهيز الحجز بنجاح" : "Reservation Ready"}</h2>
              <p className="text-sm text-neutral mt-2">{lang === "ar" ? "يرجى مراجعة البيانات قبل التأكيد النهائي" : "Please review details before final confirmation"}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-4 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "العميل" : "Client"}</span>
                <span className="font-bold text-primary">{selectedCustomer?.name || "..."}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? (source === "inventory" ? "المنتج" : "الوحدة") : (source === "inventory" ? "Product" : "Unit")}</span>
                <span className="font-bold text-primary">
                  {source === "inventory" && selectedInventoryItem
                    ? (selectedInventoryItem.productLabelArabic || selectedInventoryItem.itemNumber)
                    : unitId}
                </span>
              </div>
              {source === "inventory" && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral">{lang === "ar" ? "المصدر" : "Source"}</span>
                  <Badge variant="reserved" className="text-[10px]">{lang === "ar" ? "من المخزون" : "From Inventory"}</Badge>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry"}</span>
                <span className="font-bold text-primary">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-bold text-primary">{lang === "ar" ? "إجمالي مبلغ الحجز" : "Total Deposit"}</span>
                <span className="text-xl font-bold text-secondary flex items-center gap-1.5"><RiyalIcon size={20} /> {fmt(depositAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleConfirmReservation} disabled={loading} className="w-full py-6">
                {lang === "ar" ? "تأكيد الحجز وإصدار السند" : "Confirm & Issue Receipt"}
              </Button>
              <Button variant="secondary" className="w-full">
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
            {lang === "ar" ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            {lang === "ar" ? "السابق" : "Previous"}
          </Button>

          <Button
            onClick={nextStep}
            disabled={currentStep === steps.length || (currentStep === 1 && !canProceedStep1)}
            className="gap-2"
          >
            {lang === "ar" ? "التالي" : "Next"}
            {lang === "ar" ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard/units" className="text-sm text-neutral hover:text-primary transition-colors flex items-center justify-center gap-2">
          {lang === "ar" ? "إلغاء والعودة للمصفوفة" : "Cancel and go back to matrix"}
        </Link>
      </div>
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center py-10"><Spinner className="animate-spin text-primary" size={32} /></div>}>
      <InnerNewReservationPage />
    </React.Suspense>
  );
}
