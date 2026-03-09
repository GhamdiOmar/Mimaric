"use client";

import * as React from "react";
import { Receipt, CurrencyCircleDollar, TrendUp, Warning, Spinner, ChartBar, Wrench, MapPin, Buildings, Package, Tag } from "@phosphor-icons/react";
import { SARAmount } from "@repo/ui";
import { getFinanceStats, getMaintenanceCostSummary, getUnitRevenueBreakdown, getLandInvestmentSummary, getOffPlanRevenueSummary } from "../../actions/finance";

const categoryLabels: Record<string, string> = {
  HVAC: "تكييف",
  PLUMBING: "سباكة",
  ELECTRICAL: "كهرباء",
  STRUCTURAL: "إنشائي",
  FIRE_SAFETY: "سلامة حريق",
  ELEVATOR: "مصاعد",
  CLEANING: "نظافة",
  LANDSCAPING: "تنسيق حدائق",
  PEST_CONTROL: "مكافحة آفات",
  GENERAL: "عام",
};

export default function FinancePage() {
  const [stats, setStats] = React.useState<any>(null);
  const [maintenanceCosts, setMaintenanceCosts] = React.useState<any>(null);
  const [unitRevenue, setUnitRevenue] = React.useState<any[]>([]);
  const [landInvestment, setLandInvestment] = React.useState<any>(null);
  const [offPlanRevenue, setOffPlanRevenue] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      getFinanceStats(),
      getMaintenanceCostSummary(),
      getUnitRevenueBreakdown(),
      getLandInvestmentSummary(),
      getOffPlanRevenueSummary(),
    ])
      .then(([s, mc, ur, li, opr]) => {
        setStats(s);
        setMaintenanceCosts(mc);
        setUnitRevenue(ur);
        setLandInvestment(li);
        setOffPlanRevenue(opr);
      })
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
            value: stats ? <SARAmount value={stats.totalRevenue} size={24} /> : "—",
            icon: CurrencyCircleDollar,
            color: "secondary",
          },
          {
            label: "الفواتير المعلقة",
            value: stats ? <SARAmount value={stats.pendingInvoices} size={20} /> : "—",
            icon: Receipt,
            color: "accent",
          },
          {
            label: "المتأخرات",
            value: stats ? <SARAmount value={stats.overdueAmount} size={20} /> : "—",
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
          <div key={i} className="bg-card p-6 rounded-md shadow-card border border-border">
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
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">إيرادات الإيجار</h3>
            <div className="flex items-center gap-2">
              <SARAmount value={stats.totalRentRevenue} size={28} className="text-3xl font-bold text-primary" />
            </div>
            <p className="text-xs text-neutral mt-2">{stats.paidCount} دفعة محصّلة من {stats.installmentCount}</p>
          </div>
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">إيرادات البيع</h3>
            <div className="flex items-center gap-2">
              <SARAmount value={stats.totalSaleRevenue} size={28} className="text-3xl font-bold text-primary" />
            </div>
            <p className="text-xs text-neutral mt-2">من العقود الموقّعة</p>
          </div>
        </div>
      )}

      {/* Off-Plan Revenue */}
      {offPlanRevenue && offPlanRevenue.total > 0 && (
        <div className="bg-card p-6 rounded-md shadow-card border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Package size={20} className="text-accent" weight="duotone" />
            <h3 className="text-lg font-bold text-primary font-primary">إيرادات على الخارطة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">قيمة المسار</span>
              <div className="mt-2">
                <SARAmount value={offPlanRevenue.pipelineValue} size={20} className="text-xl font-bold text-primary" />
              </div>
              <p className="text-[10px] text-neutral mt-1">{offPlanRevenue.total} عنصر مخزون</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">قيمة المحجوز</span>
              <div className="mt-2">
                <SARAmount value={offPlanRevenue.reservedValue} size={20} className="text-xl font-bold text-amber-600" />
              </div>
              <p className="text-[10px] text-neutral mt-1">{offPlanRevenue.reservedCount} محجوز</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">قيمة المباع</span>
              <div className="mt-2">
                <SARAmount value={offPlanRevenue.soldValue} size={20} className="text-xl font-bold text-secondary" />
              </div>
              <p className="text-[10px] text-neutral mt-1">{offPlanRevenue.soldCount} مباع</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">معدل التحويل</span>
              <div className="mt-2">
                <span className="text-xl font-bold text-info font-latin">{offPlanRevenue.conversionRate}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-info rounded-full transition-all" style={{ width: `${offPlanRevenue.conversionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card p-8 rounded-md shadow-card border border-border">
        <h3 className="text-lg font-bold text-primary mb-6 font-primary">الفوترة الإلكترونية — ZATCA Phase 2</h3>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm font-primary">
          سيتم تفعيل الربط مع فاتورة قريباً — Coming Soon
        </div>
      </div>

      {/* Maintenance Costs Section */}
      {maintenanceCosts && (
        <div className="bg-card p-6 rounded-md shadow-card border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Wrench size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary font-primary">تكاليف الصيانة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">تقديري</span>
              <div className="mt-2">
                <SARAmount value={maintenanceCosts.totalEstimated} size={24} className="text-2xl font-bold text-primary" />
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">فعلي</span>
              <div className="mt-2">
                <SARAmount value={maintenanceCosts.totalActual} size={24} className="text-2xl font-bold text-primary" />
              </div>
            </div>
          </div>
          {Object.keys(maintenanceCosts.byCategory).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">الفئة</th>
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">التكلفة</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(maintenanceCosts.byCategory).map(([cat, cost]) => (
                    <tr key={cat} className="border-b border-border/50">
                      <td className="py-3 text-primary font-primary">{categoryLabels[cat] ?? cat}</td>
                      <td className="py-3 text-left">
                        <SARAmount value={cost as number} size={14} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Unit Revenue Table */}
      {unitRevenue.length > 0 && (
        <div className="bg-card p-6 rounded-md shadow-card border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Buildings size={20} className="text-secondary" />
            <h3 className="text-lg font-bold text-primary font-primary">إيرادات الوحدات</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">الوحدة</th>
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">المبنى</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">إيرادات الإيجار</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">تكاليف الصيانة</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-neutral">صافي الدخل</th>
                </tr>
              </thead>
              <tbody>
                {unitRevenue.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3 text-primary font-medium">{u.number}</td>
                    <td className="py-3 text-primary font-primary">{u.building}</td>
                    <td className="py-3 text-left">
                      <SARAmount value={u.rentIncome} size={14} />
                    </td>
                    <td className="py-3 text-left">
                      <SARAmount value={u.maintenanceCost} size={14} />
                    </td>
                    <td className={`py-3 text-left font-bold ${u.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      <SARAmount value={u.netIncome} size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Land Investment Section */}
      {landInvestment && (
        <div className="bg-card p-6 rounded-md shadow-card border border-border">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-secondary" />
            <h3 className="text-lg font-bold text-primary font-primary">استثمارات الأراضي</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">تكلفة الاستحواذ</span>
              <div className="mt-2">
                <SARAmount value={landInvestment.totalAcquisitionCost} size={20} className="text-xl font-bold text-primary" />
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">القيمة التقديرية</span>
              <div className="mt-2">
                <SARAmount value={landInvestment.totalEstimatedValue} size={20} className="text-xl font-bold text-primary" />
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">الربح/الخسارة غير المحققة</span>
              <div className="mt-2">
                <span className={`text-xl font-bold ${landInvestment.unrealizedGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <SARAmount value={landInvestment.unrealizedGainLoss} size={20} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
