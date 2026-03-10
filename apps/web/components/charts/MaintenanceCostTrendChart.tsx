"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RiyalIcon } from "@repo/ui";
import { getMaintenanceCostTrend } from "../../app/actions/dashboard";
import { useChartTheme } from "./useChartTheme";

const MONTH_NAMES_AR: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card shadow-lg border border-border rounded-lg p-3 text-xs" dir="rtl">
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
  const theme = useChartTheme();

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
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.tickFill }} axisLine={{ stroke: theme.axisStroke }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: theme.tickFill }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="estimated" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="تقديري" />
        <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="فعلي" />
      </LineChart>
    </ResponsiveContainer>
  );
}
