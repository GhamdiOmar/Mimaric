"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { RiyalIcon, ChartContainer, ChartTooltip, type ChartConfig } from "@repo/ui";
import { getMaintenanceCostTrend } from "../../app/actions/dashboard";

const MONTH_NAMES_AR: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const chartConfig = {
  estimated: {
    label: "تقديري",
    color: "hsl(46 65% 52%)",
  },
  actual: {
    label: "فعلي",
    color: "hsl(148 76% 27%)",
  },
} satisfies ChartConfig;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/90 backdrop-blur-xl shadow-elevation-2 border border-border/50 rounded-lg p-3 text-xs" dir="rtl">
      <p className="font-bold text-primary mb-1">{label}</p>
      <div className="space-y-1">
        <p className="text-accent flex items-center gap-1">
          تقديري: <RiyalIcon size={10} /> {fmt(payload[0]?.value ?? 0)}
        </p>
        <p className="text-secondary flex items-center gap-1">
          فعلي: <RiyalIcon size={10} /> {fmt(payload[1]?.value ?? 0)}
        </p>
      </div>
    </div>
  );
}

export default function MaintenanceCostTrendChart() {
  const [data, setData] = React.useState<{ month: string; estimated: number; actual: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getMaintenanceCostTrend()
      .then((months) => {
        setData(
          months.map((m) => ({
            ...m,
            month: MONTH_NAMES_AR[m.month.split("-")[1] ?? "01"] ?? m.month,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-neutral text-sm">جاري التحميل...</div>;
  if (data.every((d) => d.estimated === 0 && d.actual === 0))
    return <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">لا توجد بيانات</div>;

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <ChartTooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="estimated" stroke="var(--color-estimated)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="تقديري" />
        <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="فعلي" />
      </LineChart>
    </ChartContainer>
  );
}
