"use client";

import * as React from "react";
import { RiyalIcon } from "@repo/ui";
import {
  Buildings,
  TrendUp,
  Users,
  Handshake,
  Clock,
  CurrencyCircleDollar
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { getDashboardStats } from "../actions/dashboard";

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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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
    { label: { ar: "الإيجارات المحصلة", en: "Rent Collected" }, value: stats ? <span className="flex items-center gap-1 justify-center"><RiyalIcon size={18} /> {formatCurrency(stats.totalRentCollected)}</span> : "—", icon: CurrencyCircleDollar, color: "secondary" },
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
              "bg-white p-6 rounded-md shadow-card border border-border flex flex-col justify-between group hover:shadow-raised hover:border-primary/20 transition-all cursor-default relative overflow-hidden",
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

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">تحليل الإيرادات (آخر 6 أشهر)</h3>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm">
            [Revenue Trend Line Chart Placeholder]
          </div>
        </div>
        <div className="bg-white p-8 rounded-md shadow-card border border-border min-h-[400px]">
          <h3 className="text-lg font-bold text-primary mb-6">توزيع الإشغال حسب المشروع</h3>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm">
            [Occupancy Donut Chart Placeholder]
          </div>
        </div>
      </div>
    </div>
  );
}
