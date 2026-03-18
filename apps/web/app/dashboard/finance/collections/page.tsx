"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, CircleDollarSign, AlertTriangle, Users } from "lucide-react";
import { Button, Badge, Card, CardContent } from "@repo/ui";
import { useLanguage } from "../../../../components/LanguageProvider";
import { PaginationControls } from "../../../../components/pagination-controls";
import { getCollectionCases, getAgingReport } from "../../../actions/collections";

const LABELS = {
  ar: {
    title: "التحصيل",
    total: "إجمالي المتأخر",
    overdue: "عدد المتأخرات",
    contract: "العقد",
    customer: "العميل",
    outstanding: "المبلغ المعلق",
    status: "الحالة",
    assigned: "مُعين إلى",
    lastContact: "آخر تواصل",
    actions: "إجراءات",
    view: "عرض",
    noCases: "لا توجد حالات تحصيل",
    aging: "تقرير التقادم",
    current: "حالي",
    d30: "1-30 يوم",
    d60: "31-60 يوم",
    d90: "90+ يوم",
    statuses: {
      CURRENT: "حالي",
      FOLLOW_UP: "متابعة",
      PROMISE_TO_PAY: "وعد بالدفع",
      ESCALATED: "مصعّد",
      LEGAL: "قانوني",
      SETTLED: "مسوّى",
    },
  },
  en: {
    title: "Collections",
    total: "Total Overdue",
    overdue: "Overdue Count",
    contract: "Contract",
    customer: "Customer",
    outstanding: "Outstanding",
    status: "Status",
    assigned: "Assigned To",
    lastContact: "Last Contact",
    actions: "Actions",
    view: "View",
    noCases: "No collection cases",
    aging: "Aging Report",
    current: "Current",
    d30: "1-30 days",
    d60: "31-60 days",
    d90: "90+ days",
    statuses: {
      CURRENT: "Current",
      FOLLOW_UP: "Follow Up",
      PROMISE_TO_PAY: "Promise to Pay",
      ESCALATED: "Escalated",
      LEGAL: "Legal",
      SETTLED: "Settled",
    },
  },
};

const STATUS_COLORS: Record<string, string> = {
  CURRENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  FOLLOW_UP: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PROMISE_TO_PAY: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ESCALATED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  LEGAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  SETTLED: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

export default function CollectionsPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const router = useRouter();

  const [cases, setCases] = React.useState<any[]>([]);
  const [aging, setAging] = React.useState<any>(null);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [result, agingData] = await Promise.all([
        getCollectionCases({ status: statusFilter || undefined, page, pageSize }),
        getAgingReport(),
      ]);
      setCases(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setAging(agingData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      {/* Aging KPIs */}
      {aging && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{aging.totalOverdue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t.total} SAR</p>
            </CardContent>
          </Card>
          <Card><CardContent className="pt-4"><p className="text-lg font-bold text-green-600">{aging.current.toLocaleString()}</p><p className="text-xs text-muted-foreground">{t.current}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-lg font-bold text-amber-600">{aging.bucket30.toLocaleString()}</p><p className="text-xs text-muted-foreground">{t.d30}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-lg font-bold text-orange-600">{aging.bucket60.toLocaleString()}</p><p className="text-xs text-muted-foreground">{t.d60}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-lg font-bold text-red-600">{aging.bucket90Plus.toLocaleString()}</p><p className="text-xs text-muted-foreground">{t.d90}</p></CardContent></Card>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["", "CURRENT", "FOLLOW_UP", "PROMISE_TO_PAY", "ESCALATED", "LEGAL", "SETTLED"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "primary" : "ghost"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ display: "inline-flex" }}
          >
            {s ? (t.statuses as any)[s] : lang === "ar" ? "الكل" : "All"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : cases.length === 0 ? (
        <p className="text-muted-foreground">{t.noCases}</p>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium">{t.contract}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.outstanding}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.lastContact}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{c.contractId.slice(-8)}</td>
                    <td className="px-4 py-3">{Number(c.totalOutstanding).toLocaleString()} SAR</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[c.status] ?? ""}>
                        {(t.statuses as any)[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/finance/collections/${c.id}`)}
                        style={{ display: "inline-flex" }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
