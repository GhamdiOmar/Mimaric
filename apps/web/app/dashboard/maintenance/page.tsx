"use client";

import * as React from "react";
import { Wrench, Clock, CheckCircle, Warning, Plus, Spinner } from "@phosphor-icons/react";
import { Badge } from "@repo/ui";
import { getMaintenanceRequests } from "../../actions/maintenance";

type MaintenanceRequest = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string | Date;
  unit: { number: string; building: { name: string } };
  assignedTo?: { name: string } | null;
};

const statusLabels: Record<string, { ar: string; variant: string }> = {
  OPEN: { ar: "مفتوح", variant: "draft" },
  IN_PROGRESS: { ar: "جاري", variant: "reserved" },
  RESOLVED: { ar: "تم الحل", variant: "available" },
  CLOSED: { ar: "مغلق", variant: "available" },
};

const priorityLabels: Record<string, { ar: string; color: string }> = {
  LOW: { ar: "منخفض", color: "text-neutral" },
  MEDIUM: { ar: "متوسط", color: "text-primary" },
  HIGH: { ar: "عالي", color: "text-accent" },
  URGENT: { ar: "عاجل", color: "text-destructive" },
};

export default function MaintenancePage() {
  const [requests, setRequests] = React.useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getMaintenanceRequests()
      .then((data) => setRequests(data as any))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCount = requests.filter((r) => r.status === "OPEN").length;
  const inProgressCount = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const resolvedCount = requests.filter((r) => r.status === "RESOLVED" || r.status === "CLOSED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-primary font-primary">طلبات الصيانة</h1>
        <p className="text-sm text-neutral mt-1 font-primary">متابعة وإدارة طلبات الصيانة وتوزيع المهام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "مفتوحة", value: String(openCount), icon: Warning, color: "text-accent" },
          { label: "قيد التنفيذ", value: String(inProgressCount), icon: Clock, color: "text-primary" },
          { label: "مكتملة", value: String(resolvedCount), icon: CheckCircle, color: "text-secondary" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-md shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{kpi.label}</span>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <h3 className="text-2xl font-bold text-primary">{loading ? "—" : kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral">
            <Wrench size={48} className="mb-4 text-muted" />
            <p className="text-sm font-primary">لا توجد طلبات صيانة حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">العنوان</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">الوحدة</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">النوع</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">الأولوية</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">الحالة</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r) => {
                  const status = statusLabels[r.status] ?? { ar: "مفتوح", en: "Open", variant: "available" };
                  const priority = priorityLabels[r.priority] ?? { ar: "متوسط", en: "Medium", color: "text-amber-500" };
                  return (
                    <tr key={r.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary font-primary">{r.title}</td>
                      <td className="px-6 py-4 text-sm text-primary font-primary">
                        {r.unit.number} — {r.unit.building.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral font-primary">{r.type}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${priority.color}`}>{priority.ar}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={status.variant as any} className="text-[10px]">
                          {status.ar}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral font-latin">
                        {new Date(r.createdAt).toLocaleDateString("en-SA")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
