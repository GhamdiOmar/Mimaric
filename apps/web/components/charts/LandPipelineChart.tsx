"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";
import { getDashboardLandStats } from "../../app/actions/dashboard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@repo/ui";

const COLORS = ["#64748b", "#107840", "#D4AF37"];

const statusLabels: Record<string, { ar: string; en: string }> = {
  identified: { ar: "تم التحديد", en: "Identified" },
  underReview: { ar: "قيد المراجعة", en: "Under Review" },
  acquired: { ar: "تم الاستحواذ", en: "Acquired" },
};

const chartConfig = {
  value: {
    label: "عدد الأراضي",
  },
} satisfies ChartConfig;

export default function LandPipelineChart() {
  const [data, setData] = React.useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDashboardLandStats()
      .then((stats) => {
        setData([
          { name: statusLabels.identified!.ar, value: stats.pipeline.identified },
          { name: statusLabels.underReview!.ar, value: stats.pipeline.underReview },
          { name: statusLabels.acquired!.ar, value: stats.pipeline.acquired },
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-neutral text-sm">جاري التحميل...</div>;
  if (data.every((d) => d.value === 0)) return <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">لا توجد بيانات</div>;

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fontWeight: 600, textAnchor: "end" }}
          tickLine={false}
          axisLine={false}
          orientation="right"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList dataKey="value" position="right" fill="hsl(var(--foreground))" fontSize={14} fontWeight={700} offset={8} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
