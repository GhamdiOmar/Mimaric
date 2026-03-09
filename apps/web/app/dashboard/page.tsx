"use client";

import * as React from "react";
import { SARAmount } from "@repo/ui";
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
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { getDashboardStats, getDashboardLandStats, getDashboardOffPlanStats } from "../actions/dashboard";
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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
    getDashboardLandStats().then(setLandStats).catch(console.error);
    getDashboardOffPlanStats().then(setOffPlanStats).catch(console.error);
  }, []);

  const formatNumber = (n: number) => n.toLocaleString("en-US");
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return formatNumber(n);
  };

  const kpiData = [
    { label: { ar: "إجمالي الوحدات", en: "Total Units" }, value: stats ? formatNumber(stats.totalUnits) : "—", icon: Buildings, color: "primary" },
    { label: { ar: "نسبة الإشغال", en: "Occupancy Rate" }, value: stats ? `${stats.occupancyRate}%` : "—", icon: TrendUp, color: "secondary" },
    { label: { ar: "الإيجارات المحصلة", en: "Rent Collected" }, value: stats ? <SARAmount value={stats.totalRentCollected} compact size={18} /> : "—", icon: CurrencyCircleDollar, color: "secondary" },
    { label: { ar: "عقود نشطة", en: "Active Leases" }, value: stats ? formatNumber(stats.activeLeases) : "—", icon: Handshake, color: "accent" },
    { label: { ar: "طلبات صيانة", en: "Maintenance Requests" }, value: stats ? formatNumber(stats.openMaintenanceCount) : "—", icon: Clock, color: "warning" },
    { label: { ar: "العملاء الجدد", en: "New Customers" }, value: stats ? `+${formatNumber(stats.newCustomersThisMonth)}` : "—", icon: Users, color: "secondary" },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
            className={cn(
              "bg-card p-6 rounded-md shadow-card border border-border flex flex-col justify-between group hover:shadow-raised hover:border-primary/20 transition-all cursor-default relative overflow-hidden",
              loading && "animate-pulse"
            )}
          >
            {/* Left Accent Bar */}
            <div className={cn(
              "absolute top-0 right-0 bottom-0 w-1",
              kpi.color === "primary" ? "bg-primary" :
              kpi.color === "secondary" ? "bg-secondary" :
              kpi.color === "accent" ? "bg-accent" : "bg-warning"
            )} />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase text-neutral tracking-wider truncate mr-2">
                {kpi.label.ar}
              </span>
              <div className={cn(
                "p-2 rounded-sm",
                kpi.color === "primary" ? "bg-primary/10 text-primary" :
                kpi.color === "secondary" ? "bg-secondary/10 text-secondary" :
                kpi.color === "accent" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
              )}>
                <kpi.icon size={20} weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Land & Projects KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: { ar: "الأراضي", en: "Land Parcels" }, value: landStats ? landStats.totalParcels : "—", icon: MapPin, color: "secondary" },
          { label: { ar: "المشاريع النشطة", en: "Active Projects" }, value: landStats ? landStats.activeProjects : "—", icon: HardHat, color: "primary" },
          { label: { ar: "قيمة المحفظة", en: "Portfolio Value" }, value: landStats ? <SARAmount value={landStats.portfolioValue} compact size={18} /> : "—", icon: CurrencyCircleDollar, color: "secondary" },
          { label: { ar: "تكاليف الصيانة", en: "Maintenance Costs" }, value: landStats ? <SARAmount value={landStats.maintenanceCostsThisMonth} compact size={18} /> : "—", icon: Wrench, color: "accent" },
        ].map((kpi, idx) => (
          <div key={`land-${idx}`} className={cn("bg-card p-6 rounded-md shadow-card border border-border flex flex-col justify-between group hover:shadow-raised hover:border-primary/20 transition-all cursor-default relative overflow-hidden", !landStats && "animate-pulse")}>
            <div className={cn("absolute top-0 right-0 bottom-0 w-1", kpi.color === "primary" ? "bg-primary" : kpi.color === "secondary" ? "bg-secondary" : "bg-accent")} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase text-neutral tracking-wider truncate mr-2">{kpi.label.ar}</span>
              <div className={cn("p-2 rounded-sm", kpi.color === "primary" ? "bg-primary/10 text-primary" : kpi.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent")}>
                <kpi.icon size={20} weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Off-Plan Development KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: { ar: "مشاريع البيع على الخارطة", en: "Off-Plan Projects" }, value: offPlanStats ? offPlanStats.totalOffPlanProjects : "—", icon: Rocket, color: "primary" },
          { label: { ar: "إجمالي المخزون", en: "Total Inventory" }, value: offPlanStats ? offPlanStats.totalInventory : "—", icon: Package, color: "secondary" },
          { label: { ar: "معدل التحويل", en: "Conversion Rate" }, value: offPlanStats ? `${offPlanStats.conversionRate}%` : "—", icon: ChartBar, color: "accent" },
          { label: { ar: "قيمة المبيعات", en: "Pipeline Value" }, value: offPlanStats ? <SARAmount value={offPlanStats.pipelineValue} compact size={18} /> : "—", icon: CurrencyCircleDollar, color: "secondary" },
        ].map((kpi, idx) => (
          <div key={`offplan-${idx}`} className={cn("bg-card p-6 rounded-md shadow-card border border-border flex flex-col justify-between group hover:shadow-raised hover:border-primary/20 transition-all cursor-default relative overflow-hidden", !offPlanStats && "animate-pulse")}>
            <div className={cn("absolute top-0 right-0 bottom-0 w-1", kpi.color === "primary" ? "bg-primary" : kpi.color === "secondary" ? "bg-secondary" : "bg-accent")} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase text-neutral tracking-wider truncate mr-2">{kpi.label.ar}</span>
              <div className={cn("p-2 rounded-sm", kpi.color === "primary" ? "bg-primary/10 text-primary" : kpi.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent")}>
                <kpi.icon size={20} weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">تحليل الإيرادات (آخر 6 أشهر)</h3>
          <RevenueTrendChart />
        </div>
        <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">توزيع الإشغال حسب المشروع</h3>
          <OccupancyDonutChart />
        </div>
      </div>

      {/* Land & Project Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">مسار استحواذ الأراضي</h3>
          <LandPipelineChart />
        </div>
        <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">توزيع حالات المشاريع</h3>
          <ProjectStatusChart />
        </div>
        <div className="bg-card p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">تكاليف الصيانة (آخر 6 أشهر)</h3>
          <MaintenanceCostTrendChart />
        </div>
      </div>
    </div>
  );
}
