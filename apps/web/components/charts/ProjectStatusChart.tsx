"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { getProjectStatusDistribution } from "../../app/actions/dashboard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@repo/ui";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "hsl(200 60% 45%)",
  UNDER_CONSTRUCTION: "hsl(46 65% 52%)",
  READY: "hsl(148 76% 27%)",
  HANDED_OVER: "hsl(214 32% 50%)",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  UNDER_CONSTRUCTION: "قيد الإنشاء",
  READY: "جاهز",
  HANDED_OVER: "تم التسليم",
};

const chartConfig = {
  count: {
    label: "مشاريع",
  },
} satisfies ChartConfig;

export default function ProjectStatusChart() {
  const [data, setData] = React.useState<{ name: string; count: number; status: string }[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">جاري التحميل...</div>;
  if (data.length === 0) return <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">لا توجد مشاريع</div>;

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] ?? "hsl(214 32% 50%)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
