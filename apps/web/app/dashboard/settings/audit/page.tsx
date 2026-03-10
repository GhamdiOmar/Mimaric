"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  ClockCounterClockwise,
  Funnel,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getAuditLogs } from "../../../actions/audit";

type AuditLog = {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-500",
  READ: "bg-blue-500/10 text-blue-500",
  UPDATE: "bg-amber-500/10 text-amber-500",
  DELETE: "bg-red-500/10 text-red-500",
  READ_PII: "bg-purple-500/10 text-purple-500",
  EXPORT: "bg-indigo-500/10 text-indigo-500",
  LOGIN: "bg-cyan-500/10 text-cyan-500",
  LOGOUT: "bg-gray-500/10 text-gray-500",
  PASSWORD_CHANGE: "bg-orange-500/10 text-orange-500",
  PASSWORD_RESET: "bg-rose-500/10 text-rose-500",
};

const labels = {
  ar: {
    title: "سجل المراجعة",
    subtitle: "تتبع جميع العمليات والوصول إلى البيانات",
    timestamp: "التاريخ",
    user: "المستخدم",
    action: "العملية",
    resource: "المورد",
    resourceId: "معرّف المورد",
    ip: "عنوان IP",
    noLogs: "لا توجد سجلات",
    filterAction: "تصفية حسب العملية",
    filterResource: "تصفية حسب المورد",
    all: "الكل",
    page: "صفحة",
    of: "من",
    prev: "السابق",
    next: "التالي",
  },
  en: {
    title: "Audit Trail",
    subtitle: "Track all operations and data access",
    timestamp: "Timestamp",
    user: "User",
    action: "Action",
    resource: "Resource",
    resourceId: "Resource ID",
    ip: "IP Address",
    noLogs: "No audit logs found",
    filterAction: "Filter by action",
    filterResource: "Filter by resource",
    all: "All",
    page: "Page",
    of: "of",
    prev: "Previous",
    next: "Next",
  },
};

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "READ_PII", "EXPORT", "LOGIN", "LOGOUT", "PASSWORD_CHANGE", "PASSWORD_RESET"];
const RESOURCES = ["Customer", "Contract", "Lease", "Reservation", "RentInstallment", "Unit", "Project", "User", "Organization", "Document", "MaintenanceRequest", "Auth"];

export default function AuditLogPage() {
  const { lang } = useLanguage();
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [actionFilter, setActionFilter] = React.useState("");
  const [resourceFilter, setResourceFilter] = React.useState("");

  const t = labels[lang];

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        page,
        pageSize: 50,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
      });
      setLogs(result.logs);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={cn("p-6 max-w-full", lang === "ar" ? "text-right" : "text-left")} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <ClockCounterClockwise size={24} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.title}</h1>
            <p className="text-xs text-muted">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-muted" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="text-xs bg-surface border border-border rounded-md px-2 py-1.5"
          >
            <option value="">{t.filterAction}: {t.all}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            className="text-xs bg-surface border border-border rounded-md px-2 py-1.5"
          >
            <option value="">{t.filterResource}: {t.all}</option>
            {RESOURCES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="px-4 py-3 font-medium text-muted text-start">{t.timestamp}</th>
                <th className="px-4 py-3 font-medium text-muted text-start">{t.user}</th>
                <th className="px-4 py-3 font-medium text-muted text-start">{t.action}</th>
                <th className="px-4 py-3 font-medium text-muted text-start">{t.resource}</th>
                <th className="px-4 py-3 font-medium text-muted text-start">{t.resourceId}</th>
                <th className="px-4 py-3 font-medium text-muted text-start">{t.ip}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">{t.noLogs}</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{log.userEmail}</div>
                      <div className="text-[10px] text-muted">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", actionColors[log.action] || "bg-gray-500/10 text-gray-500")}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{log.resource}</td>
                    <td className="px-4 py-2.5 text-muted font-mono text-[10px]">{log.resourceId ? log.resourceId.slice(0, 12) + "..." : "—"}</td>
                    <td className="px-4 py-2.5 text-muted">{log.ipAddress || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <CaretLeft size={14} />
              {t.prev}
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              {t.next}
              <CaretRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
