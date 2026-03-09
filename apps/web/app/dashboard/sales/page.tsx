"use client";

import * as React from "react";
import { Users, Tag, Receipt, Package, TrendUp, CurrencyCircleDollar, ChartBar, ArrowRight } from "@phosphor-icons/react";
import { Button, Badge, SARAmount } from "@repo/ui";
import Link from "next/link";
import { getSalesStats, getOffPlanSalesStats } from "../../actions/sales";

export default function SalesPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [stats, setStats] = React.useState({ customerCount: 0, reservationCount: 0, contractCount: 0 });
  const [offPlanStats, setOffPlanStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      getSalesStats(),
      getOffPlanSalesStats(),
    ])
      .then(([s, ops]) => { setStats(s); setOffPlanStats(ops); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const salesModules = [
    { href: "/dashboard/sales/customers", icon: Users, label: { ar: "إدارة العملاء المحتملين", en: "Customer Management" }, desc: { ar: "تتبع وتحويل العملاء", en: "Track and convert customers" }, count: stats.customerCount },
    { href: "/dashboard/sales/reservations", icon: Tag, label: { ar: "الحجوزات", en: "Reservations" }, desc: { ar: "إدارة حجوزات الوحدات", en: "Manage unit reservations" }, count: stats.reservationCount },
    { href: "/dashboard/sales/contracts", icon: Receipt, label: { ar: "العقود", en: "Contracts" }, desc: { ar: "عقود البيع والشراء", en: "Sales contracts" }, count: stats.contractCount },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "محرك المبيعات" : "Sales Engine"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة دورة المبيعات الكاملة من العميل المحتمل إلى العقد النهائي." : "Manage the full sales pipeline from customer to final contract."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <div className="bg-card rounded-md shadow-card border border-border p-8 hover:shadow-raised hover:border-secondary/30 transition-all h-full flex flex-col">
              <div className="h-12 w-12 rounded-md bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-all">
                <mod.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-primary font-primary">{mod.label[lang]}</h3>
              <p className="text-xs text-neutral mt-1 font-primary flex-1">{mod.desc[lang]}</p>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="available" className={`bg-secondary/5 text-secondary border-secondary/20 text-[10px] ${loading ? "animate-pulse" : ""}`}>
                  {mod.count} {lang === "ar" ? "سجل" : "records"}
                </Badge>
                <span className="text-xs text-neutral group-hover:text-secondary transition-colors font-primary">{lang === "ar" ? "عرض" : "View"} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Off-Plan Sales Pipeline */}
      {offPlanStats && offPlanStats.total > 0 && (
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-accent/15 flex items-center justify-center">
                <Package size={18} className="text-accent" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary font-primary">
                  {lang === "ar" ? "مسار مبيعات على الخارطة" : "Off-Plan Sales Pipeline"}
                </h2>
                <p className="text-[10px] text-neutral">
                  {lang === "ar" ? "تحويل المخزون العقاري إلى مبيعات" : "Converting inventory into sales"}
                </p>
              </div>
            </div>
            <Link href="/dashboard/units?tab=inventory">
              <Button variant="secondary" size="sm" className="gap-2 text-[10px]" style={{ display: "inline-flex" }}>
                {lang === "ar" ? "عرض المخزون" : "View Inventory"}
                <ArrowRight size={12} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Pipeline Value */}
            <div className="bg-card rounded-lg border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <CurrencyCircleDollar size={16} className="text-primary" weight="duotone" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                  {lang === "ar" ? "قيمة المسار" : "Pipeline Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-primary"><SARAmount value={offPlanStats.pipelineValue} size={11} compact /></p>
              <p className="text-[10px] text-neutral mt-1">
                {offPlanStats.available + offPlanStats.reserved} {lang === "ar" ? "عنصر نشط" : "active items"}
              </p>
            </div>

            {/* Reserved Value */}
            <div className="bg-card rounded-lg border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Tag size={16} className="text-amber-600" weight="duotone" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                  {lang === "ar" ? "قيمة المحجوز" : "Reserved Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-amber-600"><SARAmount value={offPlanStats.reservedValue} size={11} compact /></p>
              <p className="text-[10px] text-neutral mt-1">
                {offPlanStats.reserved} {lang === "ar" ? "محجوز" : "reserved"}
              </p>
            </div>

            {/* Sold Value */}
            <div className="bg-card rounded-lg border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-secondary/10 flex items-center justify-center">
                  <ChartBar size={16} className="text-secondary" weight="duotone" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                  {lang === "ar" ? "قيمة المباع" : "Sold Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-secondary"><SARAmount value={offPlanStats.soldValue} size={11} compact /></p>
              <p className="text-[10px] text-neutral mt-1">
                {offPlanStats.sold} {lang === "ar" ? "مباع" : "sold"}
              </p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-card rounded-lg border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-info/10 flex items-center justify-center">
                  <TrendUp size={16} className="text-info" weight="duotone" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                  {lang === "ar" ? "معدل التحويل" : "Conversion Rate"}
                </span>
              </div>
              <p className="text-2xl font-bold text-info font-latin">{offPlanStats.conversionRate}%</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-info rounded-full transition-all" style={{ width: `${offPlanStats.conversionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
