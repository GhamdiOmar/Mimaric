"use client";

import * as React from "react";
import Link from "next/link";
import { Receipt, CurrencyCircleDollar, TrendUp, Warning, Spinner, ChartBar, Wrench, MapPin, Buildings, Package, Tag, Vault, Coins } from "@phosphor-icons/react";
import { SARAmount, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
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
          <Card key={i} className="p-6">
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
          </Card>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/finance/escrow" className="block group">
          <Card className="p-4 transition-colors group-hover:border-primary/40">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Vault size={20} className="text-primary" /></div>
              <div>
                <h3 className="text-sm font-bold text-primary">حسابات الضمان — Escrow</h3>
                <p className="text-xs text-neutral mt-0.5">إدارة حسابات الضمان للمشاريع على الخارطة</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/collections" className="block group">
          <Card className="p-4 transition-colors group-hover:border-primary/40">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2"><Coins size={20} className="text-amber-600" /></div>
              <div>
                <h3 className="text-sm font-bold text-primary">التحصيل — Collections</h3>
                <p className="text-xs text-neutral mt-0.5">أعمار الذمم والمتابعة والتصعيد</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Revenue breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral">إيرادات الإيجار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <SARAmount value={stats.totalRentRevenue} size={28} className="text-3xl font-bold text-primary" />
              </div>
              <p className="text-xs text-neutral mt-2">{stats.paidCount} دفعة محصّلة من {stats.installmentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral">إيرادات البيع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <SARAmount value={stats.totalSaleRevenue} size={28} className="text-3xl font-bold text-primary" />
              </div>
              <p className="text-xs text-neutral mt-2">من العقود الموقّعة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Off-Plan Revenue */}
      {offPlanRevenue && offPlanRevenue.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} className="text-accent" weight="duotone" />
              <span className="text-lg font-bold text-primary font-primary">إيرادات على الخارطة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary font-primary">الفوترة الإلكترونية — ZATCA Phase 2</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm font-primary">
            سيتم تفعيل الربط مع فاتورة قريباً — Coming Soon
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Costs Section */}
      {maintenanceCosts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench size={20} className="text-accent" />
              <span className="text-lg font-bold text-primary font-primary">تكاليف الصيانة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-left">التكلفة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(maintenanceCosts.byCategory).map(([cat, cost]) => (
                    <TableRow key={cat}>
                      <TableCell className="text-primary font-primary">{categoryLabels[cat] ?? cat}</TableCell>
                      <TableCell className="text-left">
                        <SARAmount value={cost as number} size={14} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unit Revenue Table */}
      {unitRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Buildings size={20} className="text-secondary" />
              <span className="text-lg font-bold text-primary font-primary">إيرادات الوحدات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الوحدة</TableHead>
                  <TableHead className="text-right">المبنى</TableHead>
                  <TableHead className="text-left">إيرادات الإيجار</TableHead>
                  <TableHead className="text-left">تكاليف الصيانة</TableHead>
                  <TableHead className="text-left">صافي الدخل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitRevenue.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-primary font-medium">{u.number}</TableCell>
                    <TableCell className="text-primary font-primary">{u.building}</TableCell>
                    <TableCell className="text-left">
                      <SARAmount value={u.rentIncome} size={14} />
                    </TableCell>
                    <TableCell className="text-left">
                      <SARAmount value={u.maintenanceCost} size={14} />
                    </TableCell>
                    <TableCell className={`text-left font-bold ${u.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      <SARAmount value={u.netIncome} size={14} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Land Investment Section */}
      {landInvestment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} className="text-secondary" />
              <span className="text-lg font-bold text-primary font-primary">استثمارات الأراضي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
