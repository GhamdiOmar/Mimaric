"use client";

import * as React from "react";
import { Badge } from "@repo/ui";
import { 
  Buildings, 
  TrendUp, 
  Users, 
  Handshake, 
  Clock, 
  CurrencyCircleDollar 
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";

const kpiData = [
  { label: { ar: "إجمالي الوحدات", en: "Total Units" }, value: "1,248", icon: Buildings, color: "primary" },
  { label: { ar: "نسبة الإشغال", en: "Occupancy Rate" }, value: "92%", icon: TrendUp, color: "secondary" },
  { label: { ar: "الإيجارات المحصلة", en: "Rent Collected" }, value: "SAR 450K", icon: CurrencyCircleDollar, color: "secondary" },
  { label: { ar: "عقود نشطة", en: "Active Leases" }, value: "842", icon: Handshake, color: "accent" },
  { label: { ar: "طلبات صيانة", en: "Maintenance Requests" }, value: "24", icon: Clock, color: "warning" },
  { label: { ar: "العملاء المحتملون", en: "Customers This Month" }, value: "+156", icon: Users, color: "secondary" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiData.map((kpi, idx) => (
          <div 
            key={idx} 
            className="bg-white p-6 rounded-md shadow-card border border-border flex flex-col justify-between group hover:shadow-raised hover:border-primary/20 transition-all cursor-default relative overflow-hidden"
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
              {idx === 1 && <span className="text-[10px] text-secondary font-bold">+2.4%</span>}
            </div>
          </div>
        ))}
      </div>

      {/* charts placeholder or tables could go here */}
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
