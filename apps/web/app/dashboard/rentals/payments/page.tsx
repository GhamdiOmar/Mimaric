"use client";

import * as React from "react";
import { 
  CurrencyCircleDollar, 
  Clock, 
  CheckCircle, 
  Warning, 
  Calendar,
  DotsThreeVertical,
  MagnifyingGlass,
  Funnel,
  ArrowSquareOut,
  IdentificationCard,
  Building
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Input, Badge } from "@repo/ui";
import { RiyalIcon } from "@repo/ui";

const mockPayments = [
  { id: "PAY-1001", tenant: "سعود العرفج", unit: "شقة 104", amount: <span className="flex items-center gap-1"><RiyalIcon size={12}/> 11,250</span>, dueDate: "2026-03-01", status: "paid", method: "Mada" },
  { id: "PAY-1002", tenant: "شركة الحلول المتقدمة", unit: "مكتب 201", amount: <span className="flex items-center gap-1"><RiyalIcon size={12}/> 22,500</span>, dueDate: "2026-03-15", status: "unpaid", method: null },
  { id: "PAY-1003", tenant: "عبدالرحمن الراجحي", unit: "فيلا 09", amount: <span className="flex items-center gap-1"><RiyalIcon size={12}/> 35,000</span>, dueDate: "2026-02-28", status: "overdue", method: null },
  { id: "PAY-1004", tenant: "نورة القحطاني", unit: "شقة 402", amount: <span className="flex items-center gap-1"><RiyalIcon size={12}/> 8,750</span>, dueDate: "2026-04-01", status: "unpaid", method: null },
  { id: "PAY-1005", tenant: "بندر بن خالد", unit: "شقة 105", amount: <span className="flex items-center gap-1"><RiyalIcon size={12}/> 11,250</span>, dueDate: "2026-03-05", status: "partially_paid", method: "Bank Transfer" },
];

export default function RentCollectionPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "تحصيل الإيجارات" : "Rent Collection"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "متابعة دفعات المستأجرين، التحصيل المالي، والتدقيق المحاسبي." : "Monitor tenant payments, financial collection, and accounting audits."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "English" : "العربية"}
          </Button>
          <Button size="sm" className="gap-2">
            <Calendar size={18} />
            {lang === "ar" ? "تقرير الشهر" : "Monthly Report"}
          </Button>
        </div>
      </div>

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "إجمالي المستحق", en: "Total Due", value: <span className="flex items-center gap-1"><RiyalIcon size={24}/> 248,500</span>, icon: CurrencyCircleDollar, color: "primary" },
          { label: "تم تحصيله", en: "Collected", value: <span className="flex items-center gap-1"><RiyalIcon size={24}/> 182,000</span>, icon: CheckCircle, color: "secondary" },
          { label: "متأخرات", en: "Overdue", value: <span className="flex items-center gap-1"><RiyalIcon size={24}/> 42,500</span>, icon: Warning, color: "destructive" },
          { label: "قيد التحصيل", en: "Pending", value: <span className="flex items-center gap-1"><RiyalIcon size={24}/> 24,000</span>, icon: Clock, color: "accent" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-md shadow-card border border-border group hover:shadow-raised transition-all">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? kpi.label : kpi.en}</span>
                <kpi.icon size={20} className={cn(
                  kpi.color === "primary" ? "text-primary" : 
                  kpi.color === "secondary" ? "text-secondary" :
                  kpi.color === "destructive" ? "text-destructive" : "text-accent"
                )} />
             </div>
             <h3 className="text-xl font-bold text-primary">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/10">
           <div className="relative w-full md:w-80 group">
              <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={lang === "ar" ? "ابحث بالاسم، الوحدة، أو رقم الطلب" : "Search by name, unit..."}
                className="w-full bg-white border-border rounded py-2 pr-10 pl-4 text-sm focus:border-primary/30 outline-none transition-all"
              />
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="secondary" size="sm" className="gap-2 flex-1 md:flex-none">
                 <Funnel size={16} />
                 {lang === "ar" ? "تصفية" : "Filter"}
              </Button>
           </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">{lang === "ar" ? "المستأجر" : "Tenant"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">{lang === "ar" ? "الوحدة" : "Unit"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">{lang === "ar" ? "المبلغ" : "Amount"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">{lang === "ar" ? "الاستحقاق" : "Due Date"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockPayments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                          <IdentificationCard size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-primary">{p.tenant}</p>
                          <p className="text-[10px] text-neutral">{p.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Building size={16} className="text-neutral" />
                       <span className="text-xs font-semibold text-primary">{p.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-primary">{p.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-neutral font-dm-sans">
                       <Clock size={14} />
                       {p.dueDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      p.status === "paid" ? "available" : 
                      p.status === "overdue" ? "overdue" : 
                      p.status === "partially_paid" ? "reserved" : "draft"
                    } className="text-[10px]">
                      {p.status === "paid" ? (lang === "ar" ? "مدفوعة" : "Paid") : 
                       p.status === "overdue" ? (lang === "ar" ? "متأخرة" : "Overdue") : 
                       p.status === "partially_paid" ? (lang === "ar" ? "عربون" : "Partial") : (lang === "ar" ? "غير مدفوعة" : "Unpaid")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm">
                          <ArrowSquareOut size={16} />
                       </Button>
                       <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm">
                          <DotsThreeVertical size={18} />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-muted/10 border-t border-border flex items-center justify-between">
           <span className="text-[10px] font-bold text-neutral uppercase tracking-wider">{lang === "ar" ? "عرض 5 من 124 دفعة" : "Displaying 5 of 124 payments"}</span>
           <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" className="h-7 px-3 text-[10px]" disabled>{lang === "ar" ? "السابق" : "Prev"}</Button>
              <Button variant="secondary" size="sm" className="h-7 px-3 text-[10px]">{lang === "ar" ? "التالي" : "Next"}</Button>
           </div>
        </div>
      </div>
    </div>
  );
}
