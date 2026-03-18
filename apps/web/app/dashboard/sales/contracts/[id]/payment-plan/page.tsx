"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useLanguage } from "../../../../../../components/LanguageProvider";
import {
  getPaymentPlan,
  getPaymentPlanSummary,
  recordInstallmentPayment,
} from "../../../../../actions/payment-plans";

const LABELS = {
  ar: {
    title: "خطة الدفع",
    back: "عودة",
    summary: "ملخص",
    totalPaid: "المدفوع",
    remaining: "المتبقي",
    nextDue: "الدفعة التالية",
    overdue: "متأخرة",
    installments: "الأقساط",
    number: "#",
    amount: "المبلغ",
    dueDate: "تاريخ الاستحقاق",
    paid: "المدفوع",
    status: "الحالة",
    action: "إجراء",
    recordPayment: "تسجيل دفع",
    paymentAmount: "مبلغ الدفع",
    method: "طريقة الدفع",
    reference: "رقم المرجع",
    confirm: "تأكيد",
    cancel: "إلغاء",
    noPlan: "لا توجد خطة دفع",
    statuses: {
      UNPAID: "غير مدفوع",
      PARTIALLY_PAID: "مدفوع جزئياً",
      PAID: "مدفوع",
      OVERDUE: "متأخر",
    },
  },
  en: {
    title: "Payment Plan",
    back: "Back",
    summary: "Summary",
    totalPaid: "Total Paid",
    remaining: "Remaining",
    nextDue: "Next Due",
    overdue: "Overdue",
    installments: "Installments",
    number: "#",
    amount: "Amount",
    dueDate: "Due Date",
    paid: "Paid",
    status: "Status",
    action: "Action",
    recordPayment: "Record Payment",
    paymentAmount: "Payment Amount",
    method: "Payment Method",
    reference: "Reference #",
    confirm: "Confirm",
    cancel: "Cancel",
    noPlan: "No payment plan found",
    statuses: {
      UNPAID: "Unpaid",
      PARTIALLY_PAID: "Partial",
      PAID: "Paid",
      OVERDUE: "Overdue",
    },
  },
};

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function PaymentPlanPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [plan, setPlan] = React.useState<any>(null);
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("");
  const [payRef, setPayRef] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getPaymentPlan(contractId),
        getPaymentPlanSummary(contractId),
      ]);
      setPlan(p);
      setSummary(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  React.useEffect(() => { load(); }, [load]);

  const handlePayment = async () => {
    if (!payingId || !payAmount) return;
    try {
      await recordInstallmentPayment(payingId, {
        amount: Number(payAmount),
        paymentMethod: payMethod || undefined,
        referenceNumber: payRef || undefined,
      });
      setPayingId(null);
      setPayAmount("");
      setPayMethod("");
      setPayRef("");
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

  if (!plan) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} style={{ display: "inline-flex" }}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
        <p className="text-muted-foreground">{t.noPlan}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} style={{ display: "inline-flex" }}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalPaid.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t.totalPaid} SAR</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalRemaining.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t.remaining} SAR</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {summary.nextDue ? new Date(summary.nextDue.dueDate).toLocaleDateString() : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.nextDue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.overdueCount}</p>
                  <p className="text-xs text-muted-foreground">{t.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Installments table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.installments}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium">{t.number}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.dueDate}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.paid}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {plan.installments?.map((inst: any) => (
                  <tr key={inst.id} className="border-t">
                    <td className="px-4 py-3">{inst.installmentNumber}</td>
                    <td className="px-4 py-3">{Number(inst.amount).toLocaleString()} SAR</td>
                    <td className="px-4 py-3">{new Date(inst.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{Number(inst.paidAmount ?? 0).toLocaleString()} SAR</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[inst.status] ?? ""}>
                        {(t.statuses as any)[inst.status] ?? inst.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {inst.status !== "PAID" && (
                        payingId === inst.id ? (
                          <div className="flex gap-2 items-end">
                            <input
                              type="number"
                              className="w-24 rounded-md border px-2 py-1 text-sm"
                              placeholder={t.paymentAmount}
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                            />
                            <Button size="sm" onClick={handlePayment} disabled={!payAmount} style={{ display: "inline-flex" }}>
                              {t.confirm}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setPayingId(null)} style={{ display: "inline-flex" }}>
                              {t.cancel}
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => { setPayingId(inst.id); setPayAmount(String(Number(inst.amount) - Number(inst.paidAmount ?? 0))); }} style={{ display: "inline-flex" }}>
                            {t.recordPayment}
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
