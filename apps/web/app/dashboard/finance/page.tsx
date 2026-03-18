"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Receipt, CircleDollarSign, Wrench, MapPin, Building2, Package, Vault, Coins, Loader2, FileDown, BarChart3, Zap } from "lucide-react";
import { KPICard, SARAmount, PageIntro, Button, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
import { useLanguage } from "../../../components/LanguageProvider";
import { getFinanceStats, getMaintenanceCostSummary, getUnitRevenueBreakdown, getLandInvestmentSummary, getOffPlanRevenueSummary } from "../../actions/finance";

const categoryLabels: Record<string, { ar: string; en: string }> = {
  HVAC: { ar: "تكييف", en: "HVAC" },
  PLUMBING: { ar: "سباكة", en: "Plumbing" },
  ELECTRICAL: { ar: "كهرباء", en: "Electrical" },
  STRUCTURAL: { ar: "إنشائي", en: "Structural" },
  FIRE_SAFETY: { ar: "سلامة حريق", en: "Fire Safety" },
  ELEVATOR: { ar: "مصاعد", en: "Elevator" },
  CLEANING: { ar: "نظافة", en: "Cleaning" },
  LANDSCAPING: { ar: "تنسيق حدائق", en: "Landscaping" },
  PEST_CONTROL: { ar: "مكافحة آفات", en: "Pest Control" },
  GENERAL: { ar: "عام", en: "General" },
};

export default function FinancePage() {
  const { lang } = useLanguage();
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
    <div className="space-y-8">
      <PageIntro
        title={lang === "ar" ? "المالية" : "Finance"}
        description={lang === "ar"
          ? "هذه الصفحة تعيد تقديم لوحة المالية بصياغة أكثر فخامة ووضوحاً. سطح داكن، بطاقات زجاجية طبقية، هرمية تحريرية قوية."
          : "Executive finance command view. Manage invoicing, collections, and VAT compliance with full operational clarity."}
        actions={
          <>
            <Button variant="primary" size="sm"><FileDown className="h-3.5 w-3.5" /> {lang === "ar" ? "تصدير التقرير التنفيذي" : "Export Report"}</Button>
            <Button variant="outline" size="sm"><BarChart3 className="h-3.5 w-3.5" /> {lang === "ar" ? "عرض التدفقات النقدية" : "Cash Flows"}</Button>
            <Button variant="outline" size="sm"><Zap className="h-3.5 w-3.5" /> {lang === "ar" ? "الفوترة الإلكترونية" : "E-Invoicing"}</Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
          value={loading ? "—" : <SARAmount value={stats?.totalRevenue ?? 0} compact size={20} />}
          subtitle={lang === "ar" ? "إيرادات محصلة عبر الإيجارات والمبيعات خلال الفترة الحالية" : "Revenue collected via rent and sales this period"}
          icon={<CircleDollarSign className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "نسبة التحصيل" : "Collection Rate"}
          value={loading ? "—" : `${stats?.collectionRate ?? 0}%`}
          subtitle={lang === "ar" ? "يظهر تحسن الالتزام والسداد مقارنة بالدورة السابقة" : "Shows improved payment compliance vs previous period"}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "الفواتير المعلقة" : "Pending Invoices"}
          value={loading ? "—" : <SARAmount value={stats?.pendingInvoices ?? 0} compact size={20} />}
          subtitle={lang === "ar" ? "لا توجد فواتير مفتوحة حالياً ضمن الفترة المحددة" : "No outstanding invoices within the current period"}
          icon={<Receipt className="h-[18px] w-[18px]" />}
          accentColor="accent"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "المتأخرات" : "Overdue"}
          value={loading ? "—" : <SARAmount value={stats?.overdueAmount ?? 0} compact size={20} />}
          subtitle={lang === "ar" ? "الحسابات المتأخرة منخفضة وتحت السيطرة التشغيلية" : "Overdue accounts are low and under operational control"}
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          accentColor="destructive"
          loading={loading}
        />
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/finance/escrow" className="block group">
          <Card className="p-4 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><Vault className="h-[18px] w-[18px] text-primary" /></div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{lang === "ar" ? "حسابات الضمان" : "Escrow Accounts"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "إدارة حسابات الضمان للمشاريع" : "Manage escrow accounts for projects"}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/collections" className="block group">
          <Card className="p-4 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><Coins className="h-[18px] w-[18px] text-warning" /></div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{lang === "ar" ? "التحصيل" : "Collections"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "أعمار الذمم والمتابعة والتصعيد" : "Aging, follow-ups, and escalation"}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Revenue breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "إيرادات الإيجار" : "Rental Revenue"}</p>
            <div className="mt-2">
              <SARAmount value={stats.totalRentRevenue} size={28} className="text-2xl font-bold text-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.paidCount} {lang === "ar" ? "دفعة محصّلة من" : "paid of"} {stats.installmentCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "إيرادات البيع" : "Sales Revenue"}</p>
            <div className="mt-2">
              <SARAmount value={stats.totalSaleRevenue} size={28} className="text-2xl font-bold text-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{lang === "ar" ? "من العقود الموقّعة" : "From signed contracts"}</p>
          </Card>
        </div>
      )}

      {/* Off-Plan Revenue */}
      {offPlanRevenue && offPlanRevenue.total > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-amber-500" />
              {lang === "ar" ? "إيرادات على الخارطة" : "Off-Plan Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: { ar: "قيمة المسار", en: "Pipeline Value" }, value: offPlanRevenue.pipelineValue, sub: `${offPlanRevenue.total} ${lang === "ar" ? "عنصر" : "items"}` },
                { label: { ar: "قيمة المحجوز", en: "Reserved Value" }, value: offPlanRevenue.reservedValue, sub: `${offPlanRevenue.reservedCount} ${lang === "ar" ? "محجوز" : "reserved"}` },
                { label: { ar: "قيمة المباع", en: "Sold Value" }, value: offPlanRevenue.soldValue, sub: `${offPlanRevenue.soldCount} ${lang === "ar" ? "مباع" : "sold"}` },
              ].map((item, i) => (
                <div key={i} className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{item.label[lang]}</p>
                  <div className="mt-1.5"><SARAmount value={item.value} size={18} className="text-lg font-bold text-foreground" /></div>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
                </div>
              ))}
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "معدل التحويل" : "Conversion Rate"}</p>
                <p className="text-lg font-bold text-foreground mt-1.5 tabular-nums">{offPlanRevenue.conversionRate}%</p>
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-info rounded-full transition-all" style={{ width: `${offPlanRevenue.conversionRate}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ZATCA Placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{lang === "ar" ? "الفوترة الإلكترونية — ZATCA Phase 2" : "E-Invoicing — ZATCA Phase 2"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
            {lang === "ar" ? "سيتم تفعيل الربط مع فاتورة قريبا" : "Integration with ZATCA coming soon"}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Costs */}
      {maintenanceCosts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-amber-500" />
              {lang === "ar" ? "تكاليف الصيانة" : "Maintenance Costs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "تقديري" : "Estimated"}</p>
                <div className="mt-1.5"><SARAmount value={maintenanceCosts.totalEstimated} size={20} className="text-xl font-bold text-foreground" /></div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "فعلي" : "Actual"}</p>
                <div className="mt-1.5"><SARAmount value={maintenanceCosts.totalActual} size={20} className="text-xl font-bold text-foreground" /></div>
              </div>
            </div>
            {Object.keys(maintenanceCosts.byCategory).length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang === "ar" ? "الفئة" : "Category"}</TableHead>
                    <TableHead className="text-end">{lang === "ar" ? "التكلفة" : "Cost"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(maintenanceCosts.byCategory).map(([cat, cost]) => (
                    <TableRow key={cat}>
                      <TableCell className="font-medium">{categoryLabels[cat]?.[lang] ?? cat}</TableCell>
                      <TableCell className="text-end"><SARAmount value={cost as number} size={14} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unit Revenue */}
      {unitRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-secondary" />
              {lang === "ar" ? "إيرادات الوحدات" : "Unit Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "ar" ? "الوحدة" : "Unit"}</TableHead>
                  <TableHead>{lang === "ar" ? "المبنى" : "Building"}</TableHead>
                  <TableHead className="text-end">{lang === "ar" ? "إيرادات الإيجار" : "Rent Income"}</TableHead>
                  <TableHead className="text-end">{lang === "ar" ? "تكاليف الصيانة" : "Maintenance"}</TableHead>
                  <TableHead className="text-end">{lang === "ar" ? "صافي الدخل" : "Net Income"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitRevenue.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.number}</TableCell>
                    <TableCell>{u.building}</TableCell>
                    <TableCell className="text-end"><SARAmount value={u.rentIncome} size={14} /></TableCell>
                    <TableCell className="text-end"><SARAmount value={u.maintenanceCost} size={14} /></TableCell>
                    <TableCell className={`text-end font-semibold ${u.netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                      <SARAmount value={u.netIncome} size={14} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Land Investment */}
      {landInvestment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-secondary" />
              {lang === "ar" ? "استثمارات الأراضي" : "Land Investments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "تكلفة الاستحواذ" : "Acquisition Cost"}</p>
                <div className="mt-1.5"><SARAmount value={landInvestment.totalAcquisitionCost} size={18} className="text-lg font-bold text-foreground" /></div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "القيمة التقديرية" : "Estimated Value"}</p>
                <div className="mt-1.5"><SARAmount value={landInvestment.totalEstimatedValue} size={18} className="text-lg font-bold text-foreground" /></div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "الربح/الخسارة غير المحققة" : "Unrealized Gain/Loss"}</p>
                <div className="mt-1.5">
                  <span className={`text-lg font-bold ${landInvestment.unrealizedGainLoss >= 0 ? "text-success" : "text-destructive"}`}>
                    <SARAmount value={landInvestment.unrealizedGainLoss} size={18} />
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
