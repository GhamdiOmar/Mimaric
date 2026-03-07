"use client";

import * as React from "react";
import { FileText, ChartBar, DownloadSimple, Calendar } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";

const reports = [
  { id: "1", name: "تقرير الإيرادات الشهري", nameEn: "Monthly Revenue Report", type: "Financial", date: "2026-03-01" },
  { id: "2", name: "تقرير معدل الإشغال", nameEn: "Occupancy Rate Report", type: "Operations", date: "2026-03-01" },
  { id: "3", name: "تقرير تحصيل الإيجارات", nameEn: "Rent Collection Report", type: "Financial", date: "2026-02-28" },
  { id: "4", name: "تقرير طلبات الصيانة", nameEn: "Maintenance Requests Report", type: "Operations", date: "2026-02-28" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">التقارير والتحليلات</h1>
          <p className="text-sm text-neutral mt-1 font-primary">عرض وتصدير التقارير التفصيلية لأداء المحفظة العقارية.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Calendar size={18} />
          تقرير مخصص
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-md shadow-card border border-border p-6 hover:shadow-raised hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={24} />
              </div>
              <Badge variant="available" className="bg-muted text-neutral border-none text-[10px]">{report.type}</Badge>
            </div>
            <h3 className="text-sm font-bold text-primary font-primary">{report.name}</h3>
            <p className="text-[10px] text-neutral font-latin mt-1">{report.date}</p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" className="gap-2 text-xs">
                <DownloadSimple size={14} />
                تحميل PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
