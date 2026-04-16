"use client";

import * as React from "react";
import { MapPin, Rocket } from "lucide-react";
import { KPICard, SARAmount, Card, CardContent } from "@repo/ui";
import { useLanguage } from "../LanguageProvider";

interface MetricsTabsProps {
  landStats: any;
  offPlanStats: any;
}

const tabs = [
  { key: "land", label: { ar: "الأراضي", en: "Land" }, icon: MapPin },
  { key: "offplan", label: { ar: "البيع على الخارطة", en: "Off-Plan" }, icon: Rocket },
] as const;

export function MetricsTabs({ landStats, offPlanStats }: MetricsTabsProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<string>("land");

  const formatNumber = (n: number) => n?.toLocaleString("en-US") ?? "—";

  const renderContent = () => {
    switch (activeTab) {
      case "land":
        if (!landStats) return <MetricsSkeleton />;
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard compact label={lang === "ar" ? "الأراضي" : "Parcels"} value={formatNumber(landStats.totalParcels)} accentColor="secondary" />
            <KPICard compact label={lang === "ar" ? "المشاريع النشطة" : "Active Projects"} value={formatNumber(landStats.activeProjects)} accentColor="primary" />
            <KPICard compact label={lang === "ar" ? "قيمة المحفظة" : "Portfolio Value"} value={<SARAmount value={landStats.portfolioValue} compact size={16} />} accentColor="secondary" />
            <KPICard compact label={lang === "ar" ? "تكاليف الصيانة" : "Maintenance Costs"} value={<SARAmount value={landStats.maintenanceCostsThisMonth} compact size={16} />} accentColor="accent" />
          </div>
        );
      case "offplan":
        if (!offPlanStats) return <MetricsSkeleton />;
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard compact label={lang === "ar" ? "مشاريع الخارطة" : "Off-Plan Projects"} value={formatNumber(offPlanStats.totalOffPlanProjects)} accentColor="primary" />
            <KPICard compact label={lang === "ar" ? "إجمالي المخزون" : "Total Inventory"} value={formatNumber(offPlanStats.totalInventory)} accentColor="secondary" />
            <KPICard compact label={lang === "ar" ? "معدل التحويل" : "Conversion Rate"} value={`${offPlanStats.conversionRate}%`} accentColor="accent" />
            <KPICard compact label={lang === "ar" ? "قيمة المبيعات" : "Pipeline Value"} value={<SARAmount value={offPlanStats.pipelineValue} compact size={16} />} accentColor="secondary" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-1 p-1.5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label[lang]}</span>
          </button>
        ))}
      </div>
      <CardContent className="p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
