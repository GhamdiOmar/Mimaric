"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getProjectStatusDistribution } from "../../app/actions/dashboard";
import { useChartTheme } from "./useChartTheme";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "#6366f1",
  UNDER_CONSTRUCTION: "#f59e0b",
  READY: "#10b981",
  HANDED_OVER: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  UNDER_CONSTRUCTION: "قيد الإنشاء",
  READY: "جاهز",
  HANDED_OVER: "تم التسليم",
};

export default function ProjectStatusChart() {
  const [data, setData] = React.useState<{ name: string; count: number; status: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const theme = useChartTheme();

  React.useEffect(() => {
    getProjectStatusDistribution()
      .then((dist) => {
        setData(
          dist.map((d) => ({
            name: STATUS_LABELS[d.status] ?? d.status,
            count: d.count,
            status: d.status,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-neutral text-sm">جاري التحميل...</div>;
  if (data.length === 0) return <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">لا توجد مشاريع</div>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.tickFill }} axisLine={{ stroke: theme.axisStroke }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.tickFill }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: any) => [value, "مشاريع"]}
          contentStyle={theme.tooltipStyle}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
