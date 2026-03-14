"use client";

import * as React from "react";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@repo/ui";
import { getOccupancyByProject } from "../../app/actions/dashboard";

const COLORS = [
  "hsl(216 45% 17%)",   // primary navy
  "hsl(148 76% 27%)",   // secondary green
  "hsl(46 65% 52%)",    // accent gold
  "hsl(24 75% 50%)",    // warning orange
  "hsl(200 60% 45%)",   // sky blue
  "hsl(280 50% 45%)",   // purple
  "hsl(214 32% 70%)",   // muted steel
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card/90 backdrop-blur-xl p-3 rounded-lg shadow-elevation-2 border border-border/50 text-xs">
      <p className="font-bold text-primary mb-1">{d.name}</p>
      <div className="space-y-0.5">
        <p className="text-neutral">إجمالي الوحدات: <span className="font-bold text-primary">{d.total}</span></p>
        <p className="text-neutral">مشغولة: <span className="font-bold text-secondary">{d.occupied}</span></p>
        <p className="text-neutral">شاغرة: <span className="font-bold text-destructive">{d.vacant}</span></p>
        <p className="text-neutral">نسبة الإشغال: <span className="font-bold text-primary">{d.rate}%</span></p>
      </div>
    </div>
  );
}

export default function OccupancyDonutChart() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getOccupancyByProject()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = React.useMemo(() => data.filter((d) => d.total > 0), [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((d, idx) => {
      config[d.name] = {
        label: d.name,
        color: COLORS[idx % COLORS.length]!,
      };
    });
    return config;
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="w-48 h-48 bg-muted/40 rounded-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">
        لا توجد مشاريع بعد
      </div>
    );
  }

  const totalUnits = data.reduce((s, d) => s + d.total, 0);
  const totalOccupied = data.reduce((s, d) => s + d.occupied, 0);
  const overallRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div className="relative">
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="occupied"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<CustomTooltip />} />
        </PieChart>
      </ChartContainer>
      {/* Center label */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-2xl font-bold text-primary">{overallRate}%</span>
        <br />
        <span className="text-[10px] text-neutral">إشغال</span>
      </div>
    </div>
  );
}
