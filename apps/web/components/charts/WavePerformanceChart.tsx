"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getWavePerformance } from "../../app/actions/analytics";

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
          <span className="font-bold text-primary">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function WavePerformanceChart({ projectId }: { projectId: string }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getWavePerformance(projectId)
      .then((raw) =>
        setData(
          raw.map((w: any) => ({
            name: w.name || `الموجة ${w.waveNumber}`,
            released: w.released,
            reserved: w.reserved,
            sold: w.sold,
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
        لا توجد بيانات موجات بعد
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(218 17% 35%)" }}
          axisLine={{ stroke: "hsl(214 32% 91%)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(218 17% 35%)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) => (
            <span className="text-neutral text-xs">{value}</span>
          )}
        />
        <Bar dataKey="released" name="متاح" stackId="a" fill="hsl(148 76% 27%)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="reserved" name="محجوز" stackId="a" fill="hsl(43 74% 53%)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="sold" name="مباع" stackId="a" fill="hsl(216 45% 17%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
