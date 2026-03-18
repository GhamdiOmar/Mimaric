"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUp,
} from "lucide-react";
import { Button, Badge } from "@repo/ui";
import { useLanguage } from "../../../../../../components/LanguageProvider";
import { PaginationControls } from "../../../../../../components/pagination-controls";
import {
  getPriceChangeRequests,
  reviewPriceChangeRequest,
} from "../../../../../actions/price-approvals";

const LABELS = {
  ar: {
    title: "طلبات تغيير الأسعار",
    back: "عودة",
    item: "العنصر",
    current: "السعر الحالي",
    proposed: "السعر المقترح",
    variance: "النسبة",
    reason: "السبب",
    status: "الحالة",
    actions: "الإجراءات",
    approve: "اعتماد",
    reject: "رفض",
    noRequests: "لا توجد طلبات",
    statuses: {
      PENDING_PRICE_CHANGE: "قيد المراجعة",
      APPROVED_PRICE_CHANGE: "معتمد",
      REJECTED_PRICE_CHANGE: "مرفوض",
      ESCALATED_PRICE_CHANGE: "مصعّد",
    },
  },
  en: {
    title: "Price Change Requests",
    back: "Back",
    item: "Item",
    current: "Current",
    proposed: "Proposed",
    variance: "Variance",
    reason: "Reason",
    status: "Status",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    noRequests: "No price change requests",
    statuses: {
      PENDING_PRICE_CHANGE: "Pending",
      APPROVED_PRICE_CHANGE: "Approved",
      REJECTED_PRICE_CHANGE: "Rejected",
      ESCALATED_PRICE_CHANGE: "Escalated",
    },
  },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PRICE_CHANGE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED_PRICE_CHANGE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED_PRICE_CHANGE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ESCALATED_PRICE_CHANGE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function PriceChangeRequestsPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [data, setData] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPriceChangeRequests(projectId, { page, pageSize });
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, page, pageSize]);

  React.useEffect(() => { load(); }, [load]);

  const handleReview = async (id: string, decision: "APPROVED_PRICE_CHANGE" | "REJECTED_PRICE_CHANGE") => {
    try {
      await reviewPriceChangeRequest(id, decision);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)} style={{ display: "inline-flex" }}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">{t.noRequests}</p>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium">{t.item}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.current}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.proposed}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.variance}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.reason}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((req: any) => (
                  <tr key={req.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">
                      {req.inventoryItem?.itemNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">{Number(req.currentPrice).toLocaleString()} SAR</td>
                    <td className="px-4 py-3">{Number(req.proposedPrice).toLocaleString()} SAR</td>
                    <td className="px-4 py-3">
                      <span className={req.variancePct > 0 ? "text-green-600" : "text-red-600"}>
                        {req.variancePct > 0 ? "+" : ""}{req.variancePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{req.reason}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[req.status] ?? ""}>
                        {(t.statuses as any)[req.status] ?? req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {(req.status === "PENDING_PRICE_CHANGE" || req.status === "ESCALATED_PRICE_CHANGE") && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleReview(req.id, "APPROVED_PRICE_CHANGE")} style={{ display: "inline-flex" }}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReview(req.id, "REJECTED_PRICE_CHANGE")} style={{ display: "inline-flex" }}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
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
