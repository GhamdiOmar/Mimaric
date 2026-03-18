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
import { getSalesTracking } from "../../app/actions/launch";

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

export default function SalesFunnelChart({ projectId }: { projectId: string }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSalesTracking(projectId)
      .then((raw) =>
        setData(
          raw.map((w: any) => ({
            name: w.name || `الموجة ${w.waveNumber}`,
            available: w.available,
            reserved: w.reserved,
            sold: w.sold,
            revenue: w.revenue,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="w-full h-48 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">
        لا توجد بيانات مبيعات بعد
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <ChartTooltip content={<CustomTooltip />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="available" name="متاح" stackId="a" fill="var(--color-available)" />
        <Bar dataKey="reserved" name="محجوز" stackId="a" fill="var(--color-reserved)" />
        <Bar dataKey="sold" name="مباع" stackId="a" fill="var(--color-sold)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
