"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { RiyalIcon, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent, type ChartConfig } from "@repo/ui";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const chartConfig = {
  available: {
    label: "متاح",
    color: "hsl(148 76% 27%)",
  },
  reserved: {
    label: "محجوز",
    color: "hsl(43 74% 53%)",
  },
  sold: {
    label: "مباع",
    color: "hsl(216 45% 17%)",
  },
} satisfies ChartConfig;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-card p-3 rounded-md shadow-lg border border-border text-xs space-y-1">
      <p className="font-bold text-primary mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-primary">{fmt(p.value)}</span>
        </div>
      ))}
      {d?.revenue > 0 && (
        <div className="border-t border-border mt-1 pt-1 flex items-center gap-1">
          <span className="text-muted-foreground">الإيرادات:</span>
          <span className="font-bold text-primary flex items-center gap-0.5">
            <RiyalIcon className="h-2.5 w-2.5" /> {fmt(d.revenue)}
          </span>
        </div>
      )}
    </div>
  );
}

// v3.0: Off-plan launch module removed. This chart is a placeholder.
export default function SalesFunnelChart({ projectId: _projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">
      لا توجد بيانات مبيعات بعد
    </div>
  );
}

// Keep chart components available for future use
export { BarChart, Bar, XAxis, YAxis, CartesianGrid, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent };
