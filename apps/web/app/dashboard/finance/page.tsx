"use client";

import * as React from "react";
import { Receipt, CurrencyCircleDollar, ChartBar, TrendUp } from "@phosphor-icons/react";
import { Badge } from "@repo/ui";

export default function FinancePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-primary font-primary">المالية</h1>
        <p className="text-sm text-neutral mt-1 font-primary">إدارة الفوترة الإلكترونية والتقارير المالية وضريبة القيمة المضافة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "إجمالي الإيرادات", value: "SAR 2.4M", icon: CurrencyCircleDollar, color: "secondary" },
          { label: "الفواتير المعلقة", value: "SAR 180K", icon: Receipt, color: "accent" },
          { label: "نمو ربعي", value: "+12.5%", icon: TrendUp, color: "secondary" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-md shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{kpi.label}</span>
              <kpi.icon size={20} className={kpi.color === "secondary" ? "text-secondary" : "text-accent"} />
            </div>
            <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-md shadow-card border border-border">
        <h3 className="text-lg font-bold text-primary mb-6 font-primary">الفوترة الإلكترونية — ZATCA Phase 2</h3>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg text-neutral/40 text-sm font-primary">
          سيتم تفعيل الربط مع فاتورة قريباً — Coming Soon
        </div>
      </div>
    </div>
  );
}
