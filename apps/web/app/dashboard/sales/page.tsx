"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { Users, Tag, Receipt, Package, TrendingUp, CircleDollarSign, BarChart3, ArrowRight, Globe } from "lucide-react";
import { Button, Badge, SARAmount, Card, PageIntro, KPICard } from "@repo/ui";
import Link from "next/link";
import { getSalesStats, getOffPlanSalesStats } from "../../actions/sales";

export default function SalesPage() {
  const { lang } = useLanguage();
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
      <PageIntro
        title={lang === "ar" ? "المبيعات" : "Sales"}
        description={lang === "ar" ? "إدارة دورة المبيعات الكاملة من العميل المحتمل إلى العقد النهائي." : "Manage the full sales pipeline from customer to final contract."}
        actions={
          <Link href="/dashboard/gis/sales">
            <Button variant="outline" size="sm" style={{ display: "inline-flex" }}>
              <Globe className="w-4 h-4 me-1.5" />
              {lang === "ar" ? "خريطة المبيعات" : "Sales Map"}
            </Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي العملاء" : "Total Customers"}
          value={stats.customerCount}
          subtitle={lang === "ar" ? "جميع العملاء المسجلين في المنصة" : "All registered customers in the platform"}
          icon={<Users className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "الحجوزات النشطة" : "Active Reservations"}
          value={stats.reservationCount}
          subtitle={lang === "ar" ? "حجوزات الوحدات قيد المعالجة" : "Unit reservations being processed"}
          icon={<Tag className="h-[18px] w-[18px]" />}
          accentColor="warning"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "العقود الموقعة" : "Signed Contracts"}
          value={stats.contractCount}
          subtitle={lang === "ar" ? "عقود البيع المكتملة والنشطة" : "Completed and active sales contracts"}
          icon={<Receipt className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "إيرادات على الخارطة" : "Off-Plan Revenue"}
          value={offPlanStats ? <SARAmount value={offPlanStats.soldValue || 0} size={11} compact /> : "—"}
          subtitle={lang === "ar" ? "إجمالي قيمة المبيعات على الخارطة" : "Total off-plan sales value"}
          icon={<CircleDollarSign className="h-[18px] w-[18px]" />}
          accentColor="info"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <Card className="p-8 hover:shadow-lg hover:border-secondary/30 transition-all h-full flex flex-col">
              <div className="h-12 w-12 rounded-md bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-all">
                <mod.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{mod.label[lang]}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex-1">{mod.desc[lang]}</p>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="available" className={`bg-secondary/5 text-secondary border-secondary/20 text-[10px] ${loading ? "animate-pulse" : ""}`}>
                  {mod.count} {lang === "ar" ? "سجل" : "records"}
                </Badge>
                <span className="text-xs text-muted-foreground group-hover:text-secondary transition-colors">{lang === "ar" ? "عرض" : "View"} →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Off-Plan Sales Pipeline */}
      {offPlanStats && offPlanStats.total > 0 && (
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-amber-500/15 flex items-center justify-center">
                <Package className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {lang === "ar" ? "مسار مبيعات على الخارطة" : "Off-Plan Sales Pipeline"}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {lang === "ar" ? "تحويل المخزون العقاري إلى مبيعات" : "Converting inventory into sales"}
                </p>
              </div>
            </div>
            <Link href="/dashboard/units?tab=inventory">
              <Button variant="secondary" size="sm" className="gap-2 text-[10px]">
                {lang === "ar" ? "عرض المخزون" : "View Inventory"}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Pipeline Value */}
            <Card className="rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "قيمة المسار" : "Pipeline Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground"><SARAmount value={offPlanStats.pipelineValue} size={11} compact /></p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {offPlanStats.available + offPlanStats.reserved} {lang === "ar" ? "عنصر نشط" : "active items"}
              </p>
            </Card>

            {/* Reserved Value */}
            <Card className="rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "قيمة المحجوز" : "Reserved Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-amber-600"><SARAmount value={offPlanStats.reservedValue} size={11} compact /></p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {offPlanStats.reserved} {lang === "ar" ? "محجوز" : "reserved"}
              </p>
            </Card>

            {/* Sold Value */}
            <Card className="rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-secondary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "قيمة المباع" : "Sold Value"}
                </span>
              </div>
              <p className="text-lg font-bold text-secondary"><SARAmount value={offPlanStats.soldValue} size={11} compact /></p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {offPlanStats.sold} {lang === "ar" ? "مباع" : "sold"}
              </p>
            </Card>

            {/* Conversion Rate */}
            <Card className="rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-info" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "معدل التحويل" : "Conversion Rate"}
                </span>
              </div>
              <p className="text-2xl font-bold text-info font-latin">{offPlanStats.conversionRate}%</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-info rounded-full transition-all" style={{ width: `${offPlanStats.conversionRate}%` }} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
