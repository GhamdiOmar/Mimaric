"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
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
            <History className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
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
      <Card className="overflow-hidden rounded-xl">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">{t.timestamp}</TableHead>
              <TableHead className="font-medium">{t.user}</TableHead>
              <TableHead className="font-medium">{t.action}</TableHead>
              <TableHead className="font-medium">{t.resource}</TableHead>
              <TableHead className="font-medium">{t.resourceId}</TableHead>
              <TableHead className="font-medium">{t.ip}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  <div className="animate-pulse">Loading...</div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{t.noLogs}</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{log.userEmail}</div>
                    <div className="text-[10px] text-muted-foreground">{log.userRole}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", actionColors[log.action] || "bg-gray-500/10 text-gray-500")}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{log.resource}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-[10px]">{log.resourceId ? log.resourceId.slice(0, 12) + "..." : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{log.ipAddress || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
              {t.prev}
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              {t.next}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
