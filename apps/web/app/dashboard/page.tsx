"use client";

import * as React from "react";
import { Building2, TrendingUp, FileText, Wrench } from "lucide-react";
import { KPICard, SARAmount, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useLanguage } from "../../components/LanguageProvider";
import { useSession } from "../../components/SimpleSessionProvider";
import { getDashboardStats, getDashboardLandStats, getDashboardOffPlanStats } from "../actions/dashboard";
import { getDashboardPlanningStats } from "../actions/planning-reports";
import RevenueTrendChart from "../../components/charts/RevenueTrendChart";
import OccupancyDonutChart from "../../components/charts/OccupancyDonutChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import MaintenanceCostTrendChart from "../../components/charts/MaintenanceCostTrendChart";
import { ActionItems } from "../../components/dashboard/ActionItems";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { MetricsTabs } from "../../components/dashboard/MetricsTabs";

type DashboardStats = {
  totalUnits: number;
  occupancyRate: number;
  totalRentCollected: number;
  activeLeases: number;
  openMaintenanceCount: number;
  newCustomersThisMonth: number;
};

export default function DashboardPage() {
  const { lang } = useLanguage();
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [landStats, setLandStats] = React.useState<any>(null);
  const [offPlanStats, setOffPlanStats] = React.useState<any>(null);
  const [planningStats, setPlanningStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
    getDashboardLandStats().then(setLandStats).catch(console.error);
    getDashboardOffPlanStats().then(setOffPlanStats).catch(console.error);
    getDashboardPlanningStats().then(setPlanningStats).catch(() => {});
  }, []);

  const formatNumber = (n: number) => n.toLocaleString("en-US");
  const userName = session?.user?.name ?? (lang === "ar" ? "مستخدم" : "User");

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = lang === "ar"
    ? hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء الخير"
    : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Greeting — glass card */}
      <div className="glass rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}، {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "الإيجارات المحصلة" : "Rent Collected"}
          value={loading ? "—" : <SARAmount value={stats?.totalRentCollected ?? 0} compact size={20} />}
          subtitle={lang === "ar" ? "إجمالي الإيرادات المحصلة من عقود الإيجار النشطة" : "Total revenue collected from active lease contracts"}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "نسبة الإشغال" : "Occupancy Rate"}
          value={loading ? "—" : `${stats?.occupancyRate ?? 0}%`}
          subtitle={lang === "ar" ? "نسبة الوحدات المؤجرة من إجمالي الوحدات المتاحة" : "Percentage of leased units vs total available"}
          icon={<Building2 className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "عقود نشطة" : "Active Leases"}
          value={loading ? "—" : formatNumber(stats?.activeLeases ?? 0)}
          subtitle={lang === "ar" ? "عقود الإيجار السارية حالياً في المحفظة" : "Currently active lease agreements in portfolio"}
          icon={<FileText className="h-[18px] w-[18px]" />}
          accentColor="accent"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "طلبات صيانة مفتوحة" : "Open Maintenance"}
          value={loading ? "—" : formatNumber(stats?.openMaintenanceCount ?? 0)}
          subtitle={lang === "ar" ? "طلبات الصيانة التي تنتظر المعالجة أو قيد التنفيذ" : "Maintenance requests pending or in progress"}
          icon={<Wrench className="h-[18px] w-[18px]" />}
          accentColor={stats && stats.openMaintenanceCount > 10 ? "warning" : "info"}
          loading={loading}
        />
      </div>

      {/* Main content: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {lang === "ar" ? "تحليل الإيرادات" : "Revenue Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <RevenueTrendChart />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {lang === "ar" ? "توزيع الإشغال" : "Occupancy Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <OccupancyDonutChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {lang === "ar" ? "حالات المشاريع" : "Project Status"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ProjectStatusChart />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Actions + Quick Links */}
        <div className="space-y-6">
          <ActionItems
            items={[
              {
                type: "overdue",
                label: lang === "ar" ? "مدفوعات متأخرة" : "Overdue Payments",
                count: 0, // Will be populated from real data
                href: "/dashboard/finance",
              },
              {
                type: "expiring",
                label: lang === "ar" ? "عقود تنتهي قريبا" : "Expiring Contracts",
                count: 0,
                href: "/dashboard/sales/contracts",
              },
              {
                type: "pending",
                label: lang === "ar" ? "طلبات صيانة معلقة" : "Pending Maintenance",
                count: stats?.openMaintenanceCount ?? 0,
                href: "/dashboard/maintenance",
              },
            ]}
          />
          <QuickActions />
        </div>
      </div>

      {/* Secondary Metrics in tabs */}
      <MetricsTabs
        landStats={landStats}
        offPlanStats={offPlanStats}
        planningStats={planningStats}
      />

      {/* Maintenance Cost Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {lang === "ar" ? "تكاليف الصيانة" : "Maintenance Costs"}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <MaintenanceCostTrendChart />
        </CardContent>
      </Card>
    </div>
  );
}
