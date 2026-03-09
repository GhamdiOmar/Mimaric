"use client";

import * as React from "react";
import { RiyalIcon } from "@repo/ui";
import { 
  Plus, 
  User, 
  Calendar, 
  CurrencyCircleDollar, 
  Receipt,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  Clock,
  Buildings,
  Info,
  Spinner
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Input, Badge } from "@repo/ui";
import Link from "next/link";
import { createCustomer } from "../../../actions/customers";

export default function NewLeasePage() {
  const [step, setStep] = React.useState(1);
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    status: "NEW"
  });

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const customer = await createCustomer(newCustomer);
      // Here you could automatically select the newly created customer
      setShowAddModal(false);
      setNewCustomer({ name: "", phone: "", email: "", status: "NEW" });
      alert("Customer created successfully!");
    } catch (err) {
      alert("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header & Progress */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "إنشاء عقد إيجار جديد" : "Create New Tenancy Agreement"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "خطوات بسيطة لتوثيق العلاقة الإيجارية وحفظ حقوق الأطراف" : "Simple steps to document leasing relationships and protect all parties."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </div>

      {/* Stepper Component */}
      <div className="relative flex justify-between items-center px-4 md:px-20 py-8 bg-card rounded-md shadow-card border border-border overflow-hidden">
         {/* Background connecting line */}
         <div className="absolute top-[52px] left-20 right-20 h-0.5 bg-muted hidden md:block" />
         
         {[1, 2, 3, 4].map((s) => (
           <div key={s} className="relative z-10 flex flex-col items-center gap-3">
             <div className={cn(
               "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
               step >= s ? "bg-primary border-primary text-white shadow-raised" : "bg-card border-muted text-neutral"
             )}>
               {step > s ? <CheckCircle weight="fill" size={24} /> : s}
             </div>
             <span className={cn(
               "text-[10px] font-bold uppercase tracking-widest transition-colors",
               step === s ? "text-primary" : "text-neutral"
             )}>
               {s === 1 ? (lang === "ar" ? "المستأجر" : "Tenant") : 
                s === 2 ? (lang === "ar" ? "بيانات الوحدة" : "Unit Details") :
                s === 3 ? (lang === "ar" ? "الدفعات" : "Installments") : 
                (lang === "ar" ? "المراجعة" : "Review")}
             </span>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/5 rounded">
                    <User size={24} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "اختيار المستأجر" : "Select Tenant"}</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral">{lang === "ar" ? "البحث عن عميل" : "Search Customer"}</label>
                    <Input placeholder={lang === "ar" ? "الاسم، رقم الجوال، أو رقم الهوية" : "Name, Mobile, or ID Number"} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 border border-secondary bg-secondary/5 rounded-md flex items-center gap-4 cursor-pointer">
                       <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                          <User size={20} weight="fill" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-primary">فهد بن محمد القرني</p>
                          <p className="text-[10px] text-neutral">ID: 1092XXXXXX</p>
                       </div>
                    </div>
                    <div 
                      className="p-4 border border-border border-dashed rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setShowAddModal(true)}
                    >
                       <Plus size={20} className="text-neutral group-hover:text-primary mr-2" />
                       <span className="text-sm font-medium text-neutral group-hover:text-primary">{lang === "ar" ? "إضافة عميل جديد" : "Add New Customer"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/5 rounded">
                    <Buildings size={24} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "تفاصيل الوحدة ومدة العقد" : "Unit Details & Period"}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral">{lang === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                    <Input type="date" className="font-dm-sans" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral">{lang === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                    <Input type="date" className="font-dm-sans" />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded flex items-start gap-4">
                  <Info size={24} className="text-primary mt-1" />
                  <div className="text-xs leading-relaxed text-neutral">
                    {lang === "ar" 
                      ? "مدة العقد المقترحة هي سنة واحدة (12 شهر). سيتم احتساب قيمة الإيجار بناءً على السعر السنوي المعتمد للوحدة." 
                      : "The calculated period is 1 year (12 months). Rent will be calculated based on the unit's approved annual rate."}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/5 rounded">
                    <CurrencyCircleDollar size={24} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "خطة الدفع والتحصيل" : "Payment Schedule"}</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral">{lang === "ar" ? "عدد الدفعات السنوية" : "Annual Installments"}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 4, 12].map(n => (
                        <button key={n} className={cn(
                          "py-3 rounded border text-sm font-bold transition-all",
                          n === 4 ? "bg-primary text-white border-primary" : "bg-card text-neutral border-border hover:border-primary/50"
                        )}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral">{lang === "ar" ? "جدول الدفعات المقترح" : "Generated Payments"}</p>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-md">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded bg-card border border-border flex items-center justify-center text-[10px] font-bold text-neutral">#{i}</div>
                           <div className="text-xs font-bold text-primary flex items-center gap-1"><RiyalIcon size={12}/> 11,250</div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral font-dm-sans">
                           <Calendar size={14} />
                           {i === 1 ? "2026-04-01" : i === 2 ? "2026-07-01" : i === 3 ? "2026-10-01" : "2027-01-01"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={prevStep} disabled={step === 1} className="gap-2">
              <ArrowRight className="icon-directional" />
              {lang === "ar" ? "السابق" : "Previous"}
            </Button>
            <Button onClick={nextStep} disabled={step === 4} className="gap-2">
              {lang === "ar" ? "المتابعة" : "Continue"}
              <ArrowLeft className="icon-directional" />
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-md shadow-card border border-border sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-6 border-b border-border pb-4">{lang === "ar" ? "ملخص العقد" : "Agreement Summary"}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-xs text-neutral">{lang === "ar" ? "الوحدة" : "Unit"}</span>
                <span className="text-xs font-bold text-primary text-end">برج الأفق - شقة 204</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-neutral">{lang === "ar" ? "الإيجار السنوي" : "Annual Rent"}</span>
                <span className="text-xs font-bold text-secondary flex items-center gap-1"><RiyalIcon size={12}/> 45,000</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-neutral">{lang === "ar" ? "رسوم الخدمات" : "Service Charges"}</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1"><RiyalIcon size={12}/> 2,500</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-primary">{lang === "ar" ? "الإجمالي" : "Total Amount"}</span>
                <span className="text-sm font-bold text-primary flex items-center gap-1"><RiyalIcon size={14}/> 47,500</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-accent/5 rounded-md border border-accent/20">
               <div className="flex items-center gap-2 mb-2">
                  <Receipt size={18} className="text-accent" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{lang === "ar" ? "ضريبة القيمة المضافة" : "VAT Applied"}</span>
               </div>
               <p className="text-[10px] text-accent/80 leading-relaxed font-dm-sans">
                  {lang === "ar" 
                    ? "تطبق ضريبة القيمة المضافة (15%) على الوحدات التجارية فقط وفقاً لأنظمة هيئة الزكاة والضريبة والجمارك." 
                    : "VAT (15%) applies to commercial units only as per ZATCA regulations."}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-md rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-primary mb-6">
                 {lang === "ar" ? "إضافة عميل جديد" : "Add New Customer"}
              </h2>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                    <Input 
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder={lang === "ar" ? "اسم العميل..." : "Customer name..."}
                    />
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الجوال" : "Phone Number"}</label>
                    <Input 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="e.g. +966..."
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "البريد الإلكتروني" : "Email (Optional)"}</label>
                    <Input 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="example@mail.com"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                 <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button onClick={handleAddCustomer} disabled={saving} className="gap-2">
                    {saving && <Spinner className="h-4 w-4 animate-spin text-white" />}
                    {lang === "ar" ? "حفظ البيانات" : "Save Customer"}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
