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
  MagnifyingGlass
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Input, Badge } from "@repo/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCustomers } from "../../../../actions/customers";
import { createReservation } from "../../../../actions/reservations";

const steps = [
  { id: 1, label: { ar: "اختيار العميل", en: "Select Customer" }, icon: User },
  { id: 2, label: { ar: "تفاصيل الحجز", en: "Details" }, icon: Tag },
  { id: 3, label: { ar: "تأكيد الدفع", en: "Payment" }, icon: CurrencyCircleDollar },
  { id: 4, label: { ar: "ملخص الحجز", en: "Summary" }, icon: Check },
];

export default function NewReservationPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchingCustomers, setFetchingCustomers] = React.useState(true);
  
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

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleConfirmReservation = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      await createReservation({
        customerId: selectedCustomerId,
        unitId: unitId,
        amount: 10000,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
      router.push("/dashboard/units");
    } catch (err) {
      alert("Failed to confirm reservation");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(l => l.id === selectedCustomerId);

  return (
    <div className="max-w-4xl mx-auto py-8">
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
                  isActive ? "bg-white border-secondary text-secondary ring-4 ring-secondary/10" : 
                  isCompleted ? "bg-secondary border-secondary text-white" : "bg-white border-muted text-neutral"
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
      <div className="bg-white rounded-md shadow-card border border-border p-8 min-h-[500px] flex flex-col">
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
                <Buildings size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">وحدة {unitId.split('-')[0]} - المجمع السكني</p>
                <p className="text-xs text-neutral">ID: {unitId}</p>
              </div>
              <div className="mr-auto text-end">
                <p className="text-xs text-neutral uppercase font-bold">{lang === "ar" ? "المبلغ المقدر" : "Estimated Price"}</p>
                <p className="text-lg font-bold text-secondary">SAR 950,000</p>
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
              <p className="text-xs text-primary customering-relaxed">
                {lang === "ar" 
                  ? "سيتم قفل الوحدة في النظام ومنع حجزها من قبل وكلاء آخرين حتى انتهاء المدة المحددة." 
                  : "The unit will be locked in the system and prevented from being reserved by other agents until the specified period expires."}
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
                  ? "يتطلب تأكيد الحجز دفع مبلغ جدية حجز قدره 10,000 ريال سعودي" 
                  : "Confirming the reservation requires a dynamic deposit of SAR 10,000"}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4 pt-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-neutral">{lang === "ar" ? "الإجمالي المستحق" : "Total Due"}</span>
                <span className="text-lg font-bold text-primary">SAR 10,000</span>
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
                <span className="text-neutral">{lang === "ar" ? "الوحدة" : "Unit"}</span>
                <span className="font-bold text-primary">{unitId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry"}</span>
                <span className="font-bold text-primary">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-bold text-primary">{lang === "ar" ? "إجمالي مبلغ الحجز" : "Total Deposit"}</span>
                <span className="text-xl font-bold text-secondary">SAR 10,000</span>
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
            disabled={currentStep === steps.length || (currentStep === 1 && !selectedCustomerId)}
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
