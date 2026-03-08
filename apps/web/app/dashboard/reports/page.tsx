"use client";

import * as React from "react";
import {
  FileText,
  DownloadSimple,
  Spinner,
  CurrencyCircleDollar,
  Buildings,
  Receipt,
  Wrench,
  Table,
  MapPin,
  HardHat,
} from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import {
  getRevenueReport,
  getOccupancyReport,
  getRentCollectionReport,
  getMaintenanceReport,
  getLandPortfolioReport,
  getProjectProgressReport,
  getMaintenanceCostReport,
} from "../../actions/reports";
import { generateReportPDF } from "../../../lib/report-pdf";
import { exportToExcel } from "../../../lib/export";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0] as string,
    end: end.toISOString().split("T")[0] as string,
  };
}

const REPORTS = [
  {
    id: "revenue",
    name: "تقرير الإيرادات",
    nameEn: "Revenue Report",
    desc: "إجمالي الإيرادات من الإيجارات والمبيعات مع التوزيع الشهري",
    type: "مالي",
    icon: CurrencyCircleDollar,
  },
  {
    id: "occupancy",
    name: "تقرير الإشغال",
    nameEn: "Occupancy Report",
    desc: "معدلات الإشغال حسب المشروع والوحدات الشاغرة والمؤجرة",
    type: "تشغيلي",
    icon: Buildings,
  },
  {
    id: "collection",
    name: "تقرير التحصيل",
    nameEn: "Rent Collection Report",
    desc: "تفاصيل تحصيل الإيجارات وتقادم المتأخرات حسب العميل",
    type: "مالي",
    icon: Receipt,
  },
  {
    id: "maintenance",
    name: "تقرير الصيانة",
    nameEn: "Maintenance Report",
    desc: "ملخص طلبات الصيانة والأولويات ومتوسط وقت الحل",
    type: "تشغيلي",
    icon: Wrench,
  },
  {
    id: "land",
    name: "تقرير محفظة الأراضي",
    nameEn: "Land Portfolio Report",
    desc: "تحليل شامل لمحفظة الأراضي والاستثمارات",
    type: "استثماري",
    icon: MapPin,
  },
  {
    id: "project-progress",
    name: "تقرير تقدم المشاريع",
    nameEn: "Project Progress Report",
    desc: "تتبع حالة المشاريع ونسب البيع والتأجير",
    type: "تشغيلي",
    icon: HardHat,
  },
  {
    id: "maintenance-costs",
    name: "تقرير تكاليف الصيانة",
    nameEn: "Maintenance Cost Report",
    desc: "تحليل التكاليف الفعلية مقابل التقديرية",
    type: "مالي",
    icon: Wrench,
  },
];

export default function ReportsPage() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = React.useState(defaults.start);
  const [endDate, setEndDate] = React.useState(defaults.end);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const dateRange = `${startDate} → ${endDate}`;

  async function handlePDF(reportId: string) {
    setLoadingId(reportId + "-pdf");
    try {
      if (reportId === "revenue") {
        const data = await getRevenueReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير الإيرادات",
          subtitle: "Revenue Report",
          dateRange,
          sections: [
            {
              title: "ملخص الإيرادات",
              rows: [
                { label: "إيرادات الإيجار", value: `${fmt(data.rentTotal)} ر.س` },
                { label: "إيرادات المبيعات", value: `${fmt(data.salesTotal)} ر.س` },
                { label: "الإجمالي", value: `${fmt(data.combined)} ر.س` },
                { label: "التغيير عن الفترة السابقة", value: `${data.changePercent}%` },
              ],
            },
            {
              title: "التوزيع الشهري",
              rows: data.months.map((m) => ({
                label: MONTH_NAMES[m.month.split("-")[1] ?? ""] ?? m.month,
                value: `${fmt(m.total)} ر.س`,
              })),
            },
            {
              title: "أعلى 5 وحدات إيراداً",
              rows: data.topUnits.map((u, i) => ({
                label: `${i + 1}. ${u.unit}`,
                value: `${fmt(u.revenue)} ر.س`,
              })),
            },
          ],
        });
      } else if (reportId === "occupancy") {
        const data = await getOccupancyReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير الإشغال",
          subtitle: "Occupancy Report",
          dateRange,
          sections: [
            {
              title: "ملخص عام",
              rows: [
                { label: "إجمالي الوحدات", value: String(data.totalUnits) },
                { label: "الوحدات المشغولة", value: String(data.totalOccupied) },
                { label: "نسبة الإشغال الكلية", value: `${data.overallRate}%` },
              ],
            },
            {
              title: "حسب المشروع",
              rows: data.projects.map((p) => ({
                label: p.name,
                value: `${p.occupied}/${p.total} (${p.rate}%)`,
              })),
            },
          ],
        });
      } else if (reportId === "collection") {
        const data = await getRentCollectionReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير تحصيل الإيجارات",
          subtitle: "Rent Collection Report",
          dateRange,
          sections: [
            {
              title: "ملخص التحصيل",
              rows: [
                { label: "المستحق", value: `${fmt(data.totalDue)} ر.س` },
                { label: "المحصّل", value: `${fmt(data.totalCollected)} ر.س` },
                { label: "نسبة التحصيل", value: `${data.collectionRate}%` },
                { label: "عدد المتأخرات", value: String(data.overdueCount) },
                { label: "مبلغ المتأخرات", value: `${fmt(data.overdueAmount)} ر.س` },
              ],
            },
            {
              title: "تقادم المتأخرات",
              rows: [
                { label: "0-30 يوم", value: `${fmt(data.aging["0-30"])} ر.س` },
                { label: "31-60 يوم", value: `${fmt(data.aging["31-60"])} ر.س` },
                { label: "61-90 يوم", value: `${fmt(data.aging["61-90"])} ر.س` },
                { label: "90+ يوم", value: `${fmt(data.aging["90+"])} ر.س` },
              ],
            },
          ],
        });
      } else if (reportId === "maintenance") {
        const data = await getMaintenanceReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير الصيانة",
          subtitle: "Maintenance Report",
          dateRange,
          sections: [
            {
              title: "ملخص الطلبات",
              rows: [
                { label: "إجمالي الطلبات", value: String(data.total) },
                { label: "تم الحل", value: String(data.resolved) },
                { label: "قيد التنفيذ", value: String(data.inProgress) },
                { label: "مفتوحة", value: String(data.open) },
                { label: "متوسط وقت الحل (أيام)", value: String(data.avgResolutionDays) },
              ],
            },
            {
              title: "حسب الأولوية",
              rows: Object.entries(data.priorities).map(([p, v]) => ({
                label: p === "HIGH" ? "عالية" : p === "MEDIUM" ? "متوسطة" : p === "LOW" ? "منخفضة" : p === "CRITICAL" ? "حرجة" : p,
                value: `${v.total} (${v.resolved} محلولة)`,
              })),
            },
          ],
        });
      } else if (reportId === "land") {
        const data = await getLandPortfolioReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير محفظة الأراضي",
          subtitle: "Land Portfolio Report",
          dateRange,
          sections: [
            {
              title: "ملخص",
              rows: [
                { label: "عدد الأراضي", value: data.totalParcels.toString() },
                { label: "إجمالي المساحة (م²)", value: fmt(data.totalArea) },
                { label: "القيمة التقديرية (ر.س)", value: fmt(data.totalEstimatedValue) },
                { label: "تكلفة الاستحواذ (ر.س)", value: fmt(data.totalAcquisitionCost) },
                { label: "الربح/الخسارة غير المحققة (ر.س)", value: fmt(data.unrealizedGainLoss) },
              ],
            },
            ...data.parcels.map((p: any) => ({
              title: p.name,
              rows: [
                { label: "المساحة", value: p.area ? `${p.area.toLocaleString()} م²` : "—" },
                { label: "القيمة التقديرية", value: `${fmt(p.estimatedValue)} ر.س` },
                { label: "الموقع", value: p.location || "—" },
                { label: "الحالة", value: p.status },
              ],
            })),
          ],
        });
      } else if (reportId === "project-progress") {
        const data = await getProjectProgressReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير تقدم المشاريع",
          subtitle: "Project Progress Report",
          dateRange,
          sections: data.projects.map((p: any) => ({
            title: p.name,
            rows: [
              { label: "الحالة", value: p.status },
              { label: "عدد الوحدات", value: p.totalUnits.toString() },
              { label: "نسبة البيع", value: `${p.soldPercent}%` },
              { label: "نسبة التأجير", value: `${p.rentedPercent}%` },
              { label: "إجمالي الإيرادات (ر.س)", value: fmt(p.totalRevenue) },
              { label: "قيمة المتبقي (ر.س)", value: fmt(p.remainingValue) },
            ],
          })),
        });
      } else if (reportId === "maintenance-costs") {
        const data = await getMaintenanceCostReport(startDate, endDate);
        generateReportPDF({
          title: "تقرير تكاليف الصيانة",
          subtitle: "Maintenance Cost Report",
          dateRange,
          sections: [
            {
              title: "ملخص",
              rows: [
                { label: "عدد الطلبات", value: data.totalRequests.toString() },
                { label: "التكلفة التقديرية (ر.س)", value: fmt(data.totalEstimated) },
                { label: "التكلفة الفعلية (ر.س)", value: fmt(data.totalActual) },
                { label: "الفرق (ر.س)", value: fmt(data.variance) },
                { label: "ساعات العمل", value: data.totalLaborHours.toString() },
              ],
            },
            {
              title: "حسب التصنيف",
              rows: data.byCategory.map((c: any) => ({
                label: c.category,
                value: `${c.count} طلب — ${fmt(c.actual)} ر.س`,
              })),
            },
            {
              title: "حسب المبنى",
              rows: data.byBuilding.map((b: any) => ({
                label: b.name,
                value: `${fmt(b.actual)} ر.س (${b.costPerSqm} ر.س/م²)`,
              })),
            },
          ],
        });
      }
    } catch (e) {
      console.error("Report generation failed:", e);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleExcel(reportId: string) {
    setLoadingId(reportId + "-excel");
    try {
      if (reportId === "revenue") {
        const data = await getRevenueReport(startDate, endDate);
        await exportToExcel({
          data: data.months,
          columns: [
            { header: "الشهر", key: "month", render: (v: string) => MONTH_NAMES[v?.split("-")[1] ?? ""] ?? v },
            { header: "إيجارات", key: "rent", render: (v: number) => fmt(v) },
            { header: "مبيعات", key: "sales", render: (v: number) => fmt(v) },
            { header: "الإجمالي", key: "total", render: (v: number) => fmt(v) },
          ],
          filename: "revenue-report",
          title: "تقرير الإيرادات",
        });
      } else if (reportId === "occupancy") {
        const data = await getOccupancyReport(startDate, endDate);
        await exportToExcel({
          data: data.projects,
          columns: [
            { header: "المشروع", key: "name" },
            { header: "إجمالي الوحدات", key: "total" },
            { header: "مشغولة", key: "occupied" },
            { header: "شاغرة", key: "vacant" },
            { header: "نسبة الإشغال %", key: "rate" },
          ],
          filename: "occupancy-report",
          title: "تقرير الإشغال",
        });
      } else if (reportId === "collection") {
        const data = await getRentCollectionReport(startDate, endDate);
        await exportToExcel({
          data: data.customers,
          columns: [
            { header: "العميل", key: "name" },
            { header: "الوحدة", key: "unit" },
            { header: "المستحق", key: "due", render: (v: number) => fmt(v) },
            { header: "المسدد", key: "paid", render: (v: number) => fmt(v) },
            { header: "الحالة", key: "status" },
          ],
          filename: "collection-report",
          title: "تقرير تحصيل الإيجارات",
        });
      } else if (reportId === "maintenance") {
        const data = await getMaintenanceReport(startDate, endDate);
        const rows = Object.entries(data.priorities).map(([p, v]) => ({
          priority: p === "HIGH" ? "عالية" : p === "MEDIUM" ? "متوسطة" : p === "LOW" ? "منخفضة" : p === "CRITICAL" ? "حرجة" : p,
          ...v,
        }));
        await exportToExcel({
          data: rows,
          columns: [
            { header: "الأولوية", key: "priority" },
            { header: "الإجمالي", key: "total" },
            { header: "تم الحل", key: "resolved" },
            { header: "مفتوحة", key: "open" },
          ],
          filename: "maintenance-report",
          title: "تقرير الصيانة",
        });
      } else if (reportId === "land") {
        const data = await getLandPortfolioReport(startDate, endDate);
        await exportToExcel({
          data: data.parcels,
          columns: [
            { header: "الاسم", key: "name" },
            { header: "المساحة", key: "area" },
            { header: "القيمة التقديرية", key: "estimatedValue", render: (v: number) => fmt(v) },
            { header: "تكلفة الاستحواذ", key: "acquisitionCost", render: (v: number) => fmt(v) },
            { header: "الموقع", key: "location" },
            { header: "الحالة", key: "status" },
          ],
          filename: "land-portfolio-report",
          title: "تقرير محفظة الأراضي",
        });
      } else if (reportId === "project-progress") {
        const data = await getProjectProgressReport(startDate, endDate);
        await exportToExcel({
          data: data.projects,
          columns: [
            { header: "المشروع", key: "name" },
            { header: "الحالة", key: "status" },
            { header: "الوحدات", key: "totalUnits" },
            { header: "بيع %", key: "soldPercent", render: (v: number) => `${v}%` },
            { header: "تأجير %", key: "rentedPercent", render: (v: number) => `${v}%` },
            { header: "الإيرادات", key: "totalRevenue", render: (v: number) => fmt(v) },
            { header: "المتبقي", key: "remainingValue", render: (v: number) => fmt(v) },
          ],
          filename: "project-progress-report",
          title: "تقرير تقدم المشاريع",
        });
      } else if (reportId === "maintenance-costs") {
        const data = await getMaintenanceCostReport(startDate, endDate);
        await exportToExcel({
          data: data.byCategory,
          columns: [
            { header: "التصنيف", key: "category" },
            { header: "عدد الطلبات", key: "count" },
            { header: "تقديري", key: "estimated", render: (v: number) => fmt(v) },
            { header: "فعلي", key: "actual", render: (v: number) => fmt(v) },
          ],
          filename: "maintenance-cost-report",
          title: "تقرير تكاليف الصيانة",
        });
      }
    } catch (e) {
      console.error("Excel export failed:", e);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">التقارير والتحليلات</h1>
          <p className="text-sm text-neutral mt-1 font-primary">عرض وتصدير التقارير التفصيلية لأداء المحفظة العقارية.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-primary bg-white"
          />
          <span className="text-neutral text-sm">إلى</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-primary bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report) => (
          <div key={report.id} className="bg-white rounded-md shadow-card border border-border p-6 hover:shadow-raised hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                <report.icon size={24} />
              </div>
              <Badge variant="draft" className="text-[10px] font-bold">{report.type}</Badge>
            </div>
            <h3 className="text-sm font-bold text-primary font-primary">{report.name}</h3>
            <p className="text-[10px] text-neutral font-primary mt-1">{report.desc}</p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 text-xs hover:bg-secondary/10 hover:border-secondary/50 hover:text-secondary hover:shadow-sm hover:-translate-y-0.5 transition-all"
                style={{ display: "inline-flex" }}
                onClick={() => handleExcel(report.id)}
                disabled={loadingId !== null}
              >
                {loadingId === report.id + "-excel" ? <Spinner size={14} className="animate-spin" /> : <Table size={14} />}
                Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 text-xs hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive hover:shadow-sm hover:-translate-y-0.5 transition-all"
                style={{ display: "inline-flex" }}
                onClick={() => handlePDF(report.id)}
                disabled={loadingId !== null}
              >
                {loadingId === report.id + "-pdf" ? <Spinner size={14} className="animate-spin" /> : <DownloadSimple size={14} />}
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
