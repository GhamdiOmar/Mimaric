"use client";

import * as React from "react";
import { Wrench, Clock, CheckCircle, Warning } from "@phosphor-icons/react";
import { Badge } from "@repo/ui";

const mockRequests = [
  { id: "MNT-001", unit: "شقة 104", type: "كهرباء", status: "open", date: "2026-03-05" },
  { id: "MNT-002", unit: "مكتب 201", type: "سباكة", status: "in_progress", date: "2026-03-04" },
  { id: "MNT-003", unit: "فيلا 09", type: "تكييف", status: "closed", date: "2026-03-01" },
];

export default function MaintenancePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-primary font-primary">طلبات الصيانة</h1>
        <p className="text-sm text-neutral mt-1 font-primary">متابعة وإدارة طلبات الصيانة وتوزيع المهام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "مفتوحة", value: "8", icon: Warning, color: "text-accent" },
          { label: "قيد التنفيذ", value: "12", icon: Clock, color: "text-primary" },
          { label: "مكتملة هذا الشهر", value: "34", icon: CheckCircle, color: "text-secondary" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-md shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{kpi.label}</span>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <h3 className="text-2xl font-bold text-primary">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">رقم الطلب</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">الوحدة</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">النوع</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">الحالة</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockRequests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-primary font-latin">{r.id}</td>
                  <td className="px-6 py-4 text-sm text-primary font-primary">{r.unit}</td>
                  <td className="px-6 py-4 text-sm text-neutral font-primary">{r.type}</td>
                  <td className="px-6 py-4">
                    <Badge variant={r.status === "closed" ? "available" : r.status === "in_progress" ? "reserved" : "draft"} className="text-[10px]">
                      {r.status === "open" ? "مفتوح" : r.status === "in_progress" ? "جاري" : "مكتمل"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral font-latin">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
