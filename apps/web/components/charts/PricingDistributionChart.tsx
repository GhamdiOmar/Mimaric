"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@repo/ui";
import { RiyalIcon } from "@repo/ui";
import { getPricingAnalytics } from "../../app/actions/analytics";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const PRODUCT_LABELS: Record<string, string> = {
  VILLA_PLOT: "فيلا",
  TOWNHOUSE_PLOT: "تاون هاوس",
  DUPLEX_PLOT: "دوبلكس",
  APARTMENT_PLOT: "شقة",
  COMMERCIAL_LOT: "تجاري",
  MIXED_USE: "متعدد",
  RAW_LAND: "أرض خام",
};

const COLORS = [
  "hsl(148 76% 27%)",
  "hsl(216 45% 17%)",
  "hsl(43 74% 53%)",
  "hsl(207 90% 54%)",
  "hsl(25 95% 53%)",
  "hsl(340 82% 52%)",
  "hsl(262 80% 50%)",
];

const chartConfig = {
  avgPricePerSqm: {
    label: "متوسط السعر/م²",
  },
} satisfies ChartConfig;

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card p-3 rounded-md shadow-raised border border-border text-xs space-y-1">
      <p className="font-bold text-primary">{d.label}</p>
      <div className="flex items-center gap-1">
        <span className="text-neutral">متوسط السعر/م²:</span>
        <span className="font-bold text-primary flex items-center gap-0.5">
          <RiyalIcon size={10} /> {fmt(d.avgPricePerSqm)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-neutral">الحد الأدنى:</span>
        <span className="font-bold flex items-center gap-0.5"><RiyalIcon size={10} /> {fmt(d.minPrice)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-neutral">الحد الأعلى:</span>
        <span className="font-bold flex items-center gap-0.5"><RiyalIcon size={10} /> {fmt(d.maxPrice)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-neutral">عدد الوحدات:</span>
        <span className="font-bold">{d.count}</span>
      </div>
    </div>
  );
}

export default function PricingDistributionChart({ projectId }: { projectId: string }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getPricingAnalytics(projectId)
      .then((raw) =>
        setData(
          raw.map((item: any) => ({
            ...item,
            label: PRODUCT_LABELS[item.productType] || item.productType,
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
      <div className="flex items-center justify-center h-64 text-neutral/40 text-sm">
        لا توجد بيانات تسعير بعد
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
        />
        <ChartTooltip content={<CustomTooltip />} />
        <Bar dataKey="avgPricePerSqm" name="متوسط السعر/م²" radius={[4, 4, 0, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
