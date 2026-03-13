"use client";

import * as React from "react";
import { SARAmount, KPICard, SkeletonKPICard, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import {
  Buildings,
  TrendUp,
  Users,
  Handshake,
  Clock,
  CurrencyCircleDollar,
  MapPin,
  Wrench,
  HardHat,
  Rocket,
  Package,
  ChartBar,
  Compass,
  CheckCircle,
  Stack,
  Star,
} from "@phosphor-icons/react";
import { getDashboardStats, getDashboardLandStats, getDashboardOffPlanStats } from "../actions/dashboard";
import { getDashboardPlanningStats } from "../actions/planning-reports";
import RevenueTrendChart from "../../components/charts/RevenueTrendChart";
import OccupancyDonutChart from "../../components/charts/OccupancyDonutChart";
import LandPipelineChart from "../../components/charts/LandPipelineChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import MaintenanceCostTrendChart from "../../components/charts/MaintenanceCostTrendChart";

type DashboardStats = {
  totalUnits: number;
  occupancyRate: number;
  totalRentCollected: number;
  activeLeases: number;
  openMaintenanceCount: number;
  newCustomersThisMonth: number;
};

export default function DashboardPage() {
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

  const kpiData = [
    { label: "إجمالي الوحدات", value: stats ? formatNumber(stats.totalUnits) : "—", icon: <Buildings size={20} weight="duotone" />, color: "primary" as const },
    { label: "نسبة الإشغال", value: stats ? `${stats.occupancyRate}%` : "—", icon: <TrendUp size={20} weight="duotone" />, color: "secondary" as const },
    { label: "الإيجارات المحصلة", value: stats ? <SARAmount value={stats.totalRentCollected} compact size={18} /> : "—", icon: <CurrencyCircleDollar size={20} weight="duotone" />, color: "secondary" as const },
    { label: "عقود نشطة", value: stats ? formatNumber(stats.activeLeases) : "—", icon: <Handshake size={20} weight="duotone" />, color: "accent" as const },
    { label: "طلبات صيانة", value: stats ? formatNumber(stats.openMaintenanceCount) : "—", icon: <Clock size={20} weight="duotone" />, color: "warning" as const },
    { label: "العملاء الجدد", value: stats ? `+${formatNumber(stats.newCustomersThisMonth)}` : "—", icon: <Users size={20} weight="duotone" />, color: "secondary" as const },
  ];

  const landKpiData = [
    { label: "الأراضي", value: landStats ? landStats.totalParcels : "—", icon: <MapPin size={20} weight="duotone" />, color: "secondary" as const },
    { label: "المشاريع النشطة", value: landStats ? landStats.activeProjects : "—", icon: <HardHat size={20} weight="duotone" />, color: "primary" as const },
    { label: "قيمة المحفظة", value: landStats ? <SARAmount value={landStats.portfolioValue} compact size={18} /> : "—", icon: <CurrencyCircleDollar size={20} weight="duotone" />, color: "secondary" as const },
    { label: "تكاليف الصيانة", value: landStats ? <SARAmount value={landStats.maintenanceCostsThisMonth} compact size={18} /> : "—", icon: <Wrench size={20} weight="duotone" />, color: "accent" as const },
  ];

  const offPlanKpiData = [
    { label: "مشاريع البيع على الخارطة", value: offPlanStats ? offPlanStats.totalOffPlanProjects : "—", icon: <Rocket size={20} weight="duotone" />, color: "primary" as const },
    { label: "إجمالي المخزون", value: offPlanStats ? offPlanStats.totalInventory : "—", icon: <Package size={20} weight="duotone" />, color: "secondary" as const },
    { label: "معدل التحويل", value: offPlanStats ? `${offPlanStats.conversionRate}%` : "—", icon: <ChartBar size={20} weight="duotone" />, color: "accent" as const },
    { label: "قيمة المبيعات", value: offPlanStats ? <SARAmount value={offPlanStats.pipelineValue} compact size={18} /> : "—", icon: <CurrencyCircleDollar size={20} weight="duotone" />, color: "secondary" as const },
  ];

  const planningKpiData = [
    { label: "مساحات العمل", value: planningStats ? planningStats.totalWorkspaces : "—", icon: <Compass size={20} weight="duotone" />, color: "primary" as const },
    { label: "مساحات نشطة", value: planningStats ? planningStats.activeWorkspaces : "—", icon: <Stack size={20} weight="duotone" />, color: "secondary" as const },
    { label: "سيناريوهات معتمدة", value: planningStats ? planningStats.approvedBaselines : "—", icon: <Star size={20} weight="duotone" />, color: "accent" as const },
    { label: "معدل الامتثال", value: planningStats ? `${planningStats.avgComplianceScore}%` : "—", icon: <CheckCircle size={20} weight="duotone" />, color: planningStats?.avgComplianceScore >= 70 ? "secondary" as const : "warning" as const },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonKPICard key={i} />)
          : kpiData.map((kpi, idx) => (
              <KPICard
                key={idx}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                accentColor={kpi.color}
              />
            ))
        }
      </div>

      {/* Land & Projects KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!landStats
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : landKpiData.map((kpi, idx) => (
              <KPICard
                key={`land-${idx}`}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                accentColor={kpi.color}
              />
            ))
        }
      </div>

      {/* Off-Plan Development KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!offPlanStats
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : offPlanKpiData.map((kpi, idx) => (
              <KPICard
                key={`offplan-${idx}`}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                accentColor={kpi.color}
              />
            ))
        }
      </div>

      {/* Planning OS KPI Cards */}
      {planningStats && planningStats.totalWorkspaces > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planningKpiData.map((kpi, idx) => (
            <KPICard
              key={`planning-${idx}`}
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              accentColor={kpi.color}
            />
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">تحليل الإيرادات (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart />
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">توزيع الإشغال حسب المشروع</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyDonutChart />
          </CardContent>
        </Card>
      </div>

      {/* Land & Project Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">مسار استحواذ الأراضي</CardTitle>
          </CardHeader>
          <CardContent>
            <LandPipelineChart />
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">توزيع حالات المشاريع</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectStatusChart />
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">تكاليف الصيانة (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceCostTrendChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
