"use client";

import * as React from "react";
import { Receipt, CurrencyCircleDollar, TrendUp, Warning, Spinner, ChartBar } from "@phosphor-icons/react";
import { RiyalIcon } from "@repo/ui";
import { getFinanceStats } from "../../actions/finance";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

export default function FinancePage() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getFinanceStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-primary font-primary">المالية</h1>
        <p className="text-sm text-neutral mt-1 font-primary">إدارة الفوترة الإلكترونية والتقارير المالية وضريبة القيمة المضافة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "إجمالي الإيرادات",
            value: stats ? <span className="flex items-center gap-1"><RiyalIcon size={24} /> {fmt(stats.totalRevenue)}</span> : "—",
            icon: CurrencyCircleDollar,
            color: "secondary",
          },
          {
            label: "الفواتير المعلقة",
            value: stats ? <span className="flex items-center gap-1"><RiyalIcon size={20} /> {fmt(stats.pendingInvoices)}</span> : "—",
            icon: Receipt,
            color: "accent",
          },
          {
            label: "المتأخرات",
            value: stats ? <span className="flex items-center gap-1"><RiyalIcon size={20} /> {fmt(stats.overdueAmount)}</span> : "—",
            icon: Warning,
            color: "destructive",
          },
          {
            label: "نسبة التحصيل",
            value: stats ? `${stats.collectionRate}%` : "—",
            icon: TrendUp,
            color: "secondary",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-md shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{kpi.label}</span>
              <kpi.icon size={20} className={
                kpi.color === "secondary" ? "text-secondary" :
                kpi.color === "destructive" ? "text-destructive" : "text-accent"
              } />
            </div>
            <h3 className="text-2xl font-bold text-primary">
              {loading ? <Spinner size={24} className="animate-spin" /> : kpi.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">إيرادات الإيجار</h3>
            <div className="flex items-center gap-2">
              <RiyalIcon size={28} className="text-secondary" />
              <span className="text-3xl font-bold text-primary">{fmt(stats.totalRentRevenue)}</span>
            </div>
            <p className="text-xs text-neutral mt-2">{stats.paidCount} دفعة محصّلة من {stats.installmentCount}</p>
          </div>
          <div className="bg-white p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">إيرادات البيع</h3>
            <div className="flex items-center gap-2">
              <RiyalIcon size={28} className="text-primary" />
              <span className="text-3xl font-bold text-primary">{fmt(stats.totalSaleRevenue)}</span>
            </div>
            <p className="text-xs text-neutral mt-2">من العقود الموقّعة</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-md shadow-card border border-border">
        <h3 className="text-lg font-bold text-primary mb-6 font-primary">الفوترة الإلكترونية — ZATCA Phase 2</h3>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm font-primary">
          سيتم تفعيل الربط مع فاتورة قريباً — Coming Soon
        </div>
      </div>
    </div>
  );
}
