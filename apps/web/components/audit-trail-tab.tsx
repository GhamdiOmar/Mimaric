"use client";

import * as React from "react";
import { Badge } from "@repo/ui";
import { useLanguage } from "./LanguageProvider";
import { PaginationControls } from "./pagination-controls";

interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  changeSnapshot?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  fieldChanges?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  ipAddress?: string;
  createdAt: string;
}

interface AuditTrailTabProps {
  /** Server action to fetch audit logs — called with resource & resourceId filter */
  fetchAuditLogs: (params: {
    resource: string;
    resourceId: string;
    page: number;
    pageSize: number;
  }) => Promise<{
    logs: AuditEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  resource: string;
  resourceId: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  READ: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  READ_PII: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  EXPORT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const LABELS = {
  ar: {
    title: "سجل التدقيق",
    noRecords: "لا توجد سجلات",
    by: "بواسطة",
    changes: "التغييرات",
    field: "الحقل",
    oldValue: "القيمة السابقة",
    newValue: "القيمة الجديدة",
    loading: "جاري التحميل...",
  },
  en: {
    title: "Audit Trail",
    noRecords: "No audit records found",
    by: "by",
    changes: "Changes",
    field: "Field",
    oldValue: "Old Value",
    newValue: "New Value",
    loading: "Loading...",
  },
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso);
  return d.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Per-record audit trail viewer component.
 * Renders a timeline of audit events filtered by resource + resourceId.
 * Shows field-level diffs when `fieldChanges` data is available.
 */
export function AuditTrailTab({ fetchAuditLogs, resource, resourceId }: AuditTrailTabProps) {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const [logs, setLogs] = React.useState<AuditEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAuditLogs({ resource, resourceId, page, pageSize });
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchAuditLogs, resource, resourceId, page, pageSize]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">{t.loading}</div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">{t.noRecords}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative space-y-0">
        {logs.map((log, idx) => (
          <div key={log.id} className="relative flex gap-4 pb-6">
            {/* Timeline line */}
            {idx < logs.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-[10px] w-[10px] rounded-full border-2 border-primary bg-background flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`text-xs font-medium ${ACTION_COLORS[log.action] ?? ACTION_COLORS.READ}`}
                >
                  {log.action}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t.by} {log.userEmail}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt, lang)}
                </span>
              </div>

              {/* Field-level changes (expandable) */}
              {log.fieldChanges && log.fieldChanges.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t.changes} ({log.fieldChanges.length})
                  </button>

                  {expandedId === log.id && (
                    <div className="mt-2 rounded-md border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-3 py-1.5 text-start font-medium">{t.field}</th>
                            <th className="px-3 py-1.5 text-start font-medium">{t.oldValue}</th>
                            <th className="px-3 py-1.5 text-start font-medium">{t.newValue}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {log.fieldChanges.map((fc, fi) => (
                            <tr key={fi} className="border-t">
                              <td className="px-3 py-1.5 font-mono">{fc.field}</td>
                              <td className="px-3 py-1.5 text-red-600 dark:text-red-400">
                                {formatValue(fc.oldValue)}
                              </td>
                              <td className="px-3 py-1.5 text-green-600 dark:text-green-400">
                                {formatValue(fc.newValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && !log.fieldChanges?.length && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {Object.entries(log.metadata)
                    .map(([k, v]) => `${k}: ${formatValue(v)}`)
                    .join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
