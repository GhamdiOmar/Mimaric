"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RiyalIcon } from "@repo/ui";
import { getRevenueTimeline } from "../../app/actions/dashboard";

const MONTH_NAMES_AR: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card p-3 rounded-md shadow-raised border border-border text-xs">
      <p className="font-bold text-primary mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-neutral">{p.name}:</span>
          <span className="font-bold text-primary flex items-center gap-0.5">
            <RiyalIcon size={12} /> {fmt(p.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-border mt-1 pt-1 flex items-center gap-1">
        <span className="text-neutral">الإجمالي:</span>
        <span className="font-bold text-primary flex items-center gap-0.5">
          <RiyalIcon size={12} /> {fmt(payload.reduce((s: number, p: any) => s + p.value, 0))}
        </span>
      </div>
    </div>
  );
}

export default function RevenueTrendChart() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getRevenueTimeline()
      .then((raw) =>
        setData(
          raw.map((d) => ({
            ...d,
            label: MONTH_NAMES_AR[d.month.split("-")[1] ?? ""] ?? d.month,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="w-full h-48 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">
        لا توجد بيانات إيرادات بعد
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(148 76% 27%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(148 76% 27%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(216 45% 17%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(216 45% 17%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(218 17% 35%)" }}
          axisLine={{ stroke: "hsl(214 32% 91%)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(218 17% 35%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) => (
            <span className="text-neutral text-xs">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="rent"
          name="إيجارات"
          stackId="1"
          stroke="hsl(148 76% 27%)"
          fill="url(#colorRent)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="sales"
          name="مبيعات"
          stackId="1"
          stroke="hsl(216 45% 17%)"
          fill="url(#colorSales)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
