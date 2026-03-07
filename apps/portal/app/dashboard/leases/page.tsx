"use client";

import * as React from "react";
import { 
  FilePdf, 
  CurrencyCircleDollar, 
  CheckCircle, 
  Clock, 
  DownloadSimple,
  Buildings,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Badge } from "@repo/ui";

export default function TenantLeasePage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {lang === "ar" ? "عقد الإيجار الخاص بك" : "Your Tenancy Agreement"}
          </h1>
          <p className="text-neutral mt-2">
            {lang === "ar" ? "مرحباً بك، يمكنك هنا إدارة عقدك ومتابعة مدفوعاتك بكل شفافية." : "Welcome! Here you can manage your lease and track payments transparently."}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lease Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-md shadow-card border border-border p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-secondary" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded bg-secondary/10 flex items-center justify-center text-secondary">
                <Buildings size={28} weight="fill" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "برج الأفق" : "Horizon Tower"}</h2>
                <p className="text-xs text-neutral">{lang === "ar" ? "شقة 204 - جاردن سيتي، الرياض" : "Unit 204 - Garden City, Riyadh"}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "الحالة" : "Status"}</span>
                <Badge variant="available">{lang === "ar" ? "نشط" : "Active"}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "بداية العقد" : "Start Date"}</span>
                <span className="font-bold text-primary font-dm-sans">2026-04-01</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral">{lang === "ar" ? "نهاية العقد" : "End Date"}</span>
                <span className="font-bold text-primary font-dm-sans">2027-03-31</span>
              </div>
              <div className="h-px bg-border pt-4" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral uppercase tracking-widest">{lang === "ar" ? "الإيجار السنوي" : "Annual Rent"}</span>
                <span className="text-xl font-bold text-secondary tracking-tight">SAR 45,000</span>
              </div>
            </div>

            <Button className="w-full mt-10 gap-2" variant="secondary">
              <DownloadSimple size={20} />
              {lang === "ar" ? "تحميل نسخة من العقد" : "Download Lease Copy"}
            </Button>
          </div>

          <div className="bg-primary p-6 rounded-md text-white space-y-4">
             <div className="flex items-center gap-2">
                <Clock size={20} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{lang === "ar" ? "التنبيه القادم" : "Upcoming Alert"}</span>
             </div>
             <p className="text-sm">
                {lang === "ar" 
                  ? "الدفعة القادمة مستحقة في 1 يوليو 2026 بمبلغ 11,250 ريال." 
                  : "Next installment is due on July 1, 2026 for SAR 11,250."}
             </p>
          </div>
        </div>

        {/* Payment History and Schedule */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-md shadow-card border border-border p-8">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-bold text-primary">{lang === "ar" ? "جدول المدفوعات" : "Payment Schedule"}</h2>
                 <Button variant="secondary" size="sm" className="gap-2">
                    <CurrencyCircleDollar size={18} />
                    {lang === "ar" ? "دفع المستحقات" : "Pay Now"}
                 </Button>
              </div>

              <div className="space-y-4">
                 {[
                   { id: "1", date: "2026-04-01", amount: "11,250", status: "paid", label: "الدفعة الأولى" },
                   { id: "2", date: "2026-07-01", amount: "11,250", status: "upcoming", label: "الدفعة الثانية" },
                   { id: "3", date: "2026-10-01", amount: "11,250", status: "upcoming", label: "الدفعة الثالث" },
                   { id: "4", date: "2027-01-01", amount: "11,250", status: "upcoming", label: "الدفعة الأخيرة" },
                 ].map((pay) => (
                   <div key={pay.id} className="flex items-center justify-between p-5 rounded border border-border bg-muted/5 group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                           pay.status === "paid" ? "bg-secondary/10 text-secondary" : "bg-muted text-neutral/40"
                         )}>
                           {pay.status === "paid" ? <CheckCircle size={24} weight="fill" /> : <Clock size={24} />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-primary">{lang === "ar" ? pay.label : `Installment #${pay.id}`}</p>
                            <p className="text-[10px] text-neutral font-dm-sans uppercase tracking-widest">{pay.date}</p>
                         </div>
                      </div>
                      <div className="text-end">
                         <p className="text-sm font-bold text-primary">SAR {pay.amount}</p>
                         <p className={cn(
                           "text-[10px] font-bold uppercase mt-1",
                           pay.status === "paid" ? "text-secondary" : "text-neutral/50"
                         )}>
                           {pay.status === "paid" ? (lang === "ar" ? "تم السداد" : "Paid") : (lang === "ar" ? "بانتظار الموعد" : "Upcoming")}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-6 bg-accent/5 rounded-md border border-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <FilePdf size={32} className="text-accent" />
                 <div>
                    <p className="text-sm font-bold text-primary">{lang === "ar" ? "سياسة الإلغاء والإنهاء" : "Cancellation Policy"}</p>
                    <p className="text-xs text-neutral">{lang === "ar" ? "راجع تفاصيل إنهاء العقد مبكراً" : "Review early termination terms"}</p>
                 </div>
              </div>
              <ArrowSquareOut size={20} className="text-accent" />
           </div>
        </div>
      </div>
    </div>
  );
}
