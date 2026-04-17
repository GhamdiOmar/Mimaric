"use client";

import * as React from "react";
import {
  Loader2,
  Search,
  X,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageIntro,
  KPICard,
  ResponsiveDialog,
} from "@repo/ui";
import { useLanguage } from "../../../components/LanguageProvider";
import { usePermissions } from "../../../hooks/usePermissions";
import { getInstallments, recordPayment } from "../../actions/installments";
import { getPaymentPlan, recordInstallmentPayment } from "../../actions/payment-plans";
import { toast } from "sonner";

const SAR = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

// ─── Types ───────────────────────────────────────────────────────────────────

type RentInstallment = {
  id: string;
  dueDate: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE" | "PARTIALLY_PAID";
  paidAt: string | null;
  paymentMethod: string | null;
  leaseId: string;
  lease: {
    customer: { id: string; name: string };
    unit: { number: string; building: { name: string } };
  };
};

type PaymentEntry = {
  id: string;
  type: "rent";
  clientName: string;
  propertyLabel: string;
  amount: number;
  dueDate: string;
  status: "PAID" | "UNPAID" | "OVERDUE" | "PARTIALLY_PAID";
  raw: RentInstallment;
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-amber-100 text-amber-800",
  OVERDUE: "bg-red-100 text-red-800",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  PAID: { ar: "مدفوع", en: "Paid" },
  UNPAID: { ar: "غير مدفوع", en: "Upcoming" },
  OVERDUE: { ar: "متأخر", en: "Overdue" },
  PARTIALLY_PAID: { ar: "مدفوع جزئياً", en: "Partially Paid" },
};

const PAYMENT_METHODS = [
  { value: "CASH", ar: "نقد", en: "Cash" },
  { value: "BANK_TRANSFER", ar: "تحويل بنكي", en: "Bank Transfer" },
  { value: "CHECK", ar: "شيك", en: "Check" },
  { value: "CARD", ar: "بطاقة", en: "Card" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { lang, dir } = useLanguage();
  const { can } = usePermissions();

  const [rentInstallments, setRentInstallments] = React.useState<RentInstallment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "SALE" | "RENT">("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  // Record payment modal
  const [paymentTarget, setPaymentTarget] = React.useState<PaymentEntry | null>(null);
  const [payForm, setPayForm] = React.useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    referenceNumber: "",
    notes: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  function loadData() {
    setLoading(true);
    getInstallments()
      .then((data) => setRentInstallments(data as RentInstallment[]))
      .catch(() => toast.error(lang === "ar" ? "تعذّر تحميل المدفوعات" : "Failed to load payments"))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    loadData();
  }, []);

  // Combine rent installments into unified payment entries
  const allEntries: PaymentEntry[] = React.useMemo(() => {
    return rentInstallments.map((inst) => ({
      id: inst.id,
      type: "rent" as const,
      clientName: inst.lease.customer.name,
      propertyLabel: `${lang === "ar" ? "وحدة" : "Unit"} ${inst.lease.unit.number} — ${inst.lease.unit.building.name}`,
      amount: Number(inst.amount),
      dueDate: inst.dueDate,
      status: inst.status,
      raw: inst,
    }));
  }, [rentInstallments, lang]);

  const filtered = React.useMemo(() => {
    return allEntries.filter((e) => {
      const matchType = typeFilter === "ALL" || (typeFilter === "RENT" && e.type === "rent");
      const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || e.clientName.toLowerCase().includes(q) || e.propertyLabel.toLowerCase().includes(q);
      return matchType && matchStatus && matchSearch;
    });
  }, [allEntries, typeFilter, statusFilter, search]);

  // KPIs
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const collectedThisMonth = allEntries
    .filter((e) => e.status === "PAID" && e.raw.paidAt && new Date(e.raw.paidAt) >= thisMonthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOverdue = allEntries
    .filter((e) => e.status === "OVERDUE")
    .reduce((sum, e) => sum + e.amount, 0);

  const expectedNext30 = allEntries
    .filter((e) => {
      const due = new Date(e.dueDate);
      return (e.status === "UNPAID" || e.status === "PARTIALLY_PAID") && due >= now && due <= next30Days;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  function openPayModal(entry: PaymentEntry) {
    setPaymentTarget(entry);
    setPayForm({
      amount: String(entry.amount),
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
    });
  }

  async function handleRecordPayment() {
    if (!paymentTarget) return;
    if (!payForm.amount || !payForm.paymentDate || !payForm.paymentMethod) {
      toast.error(lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      if (paymentTarget.type === "rent") {
        await recordPayment(paymentTarget.id, {
          paymentMethod: payForm.paymentMethod,
          amount: parseFloat(payForm.amount),
        });
      }
      toast.success(lang === "ar" ? "تم تسجيل الدفعة بنجاح" : "Payment recorded successfully");
      setPaymentTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء التسجيل" : "Failed to record payment"));
    } finally {
      setSubmitting(false);
    }
  }

  const typeTabs = [
    { key: "ALL", ar: "الكل", en: "All" },
    { key: "SALE", ar: "أقساط البيع", en: "Sale Installments" },
    { key: "RENT", ar: "دفعات الإيجار", en: "Rent Payments" },
  ];

  const statusTabs = [
    { key: "ALL", ar: "الكل", en: "All" },
    { key: "OVERDUE", ar: "متأخر", en: "Overdue" },
    { key: "UNPAID", ar: "قادم", en: "Upcoming" },
    { key: "PAID", ar: "مدفوع", en: "Paid" },
  ];

  return (
    <div dir={dir} className="p-6 space-y-6">
      <PageIntro
        title={lang === "ar" ? "المدفوعات" : "Payments"}
        description={
          lang === "ar"
            ? "تتبع مدفوعات الأقساط والإيجارات في مكان واحد"
            : "Track sale installments and rent payments in one place"
        }
      />

      {/* KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{lang === "ar" ? "المُحصَّل هذا الشهر" : "Collected This Month"}</p>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mt-1 text-gray-400" />
            ) : (
              <p className="text-xl font-bold text-gray-900 mt-0.5">{SAR(collectedThisMonth)}</p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{lang === "ar" ? "إجمالي المتأخرات" : "Total Overdue"}</p>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mt-1 text-gray-400" />
            ) : (
              <p className="text-xl font-bold text-red-700 mt-0.5">{SAR(totalOverdue)}</p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{lang === "ar" ? "المتوقع خلال 30 يوماً" : "Expected Next 30 Days"}</p>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mt-1 text-gray-400" />
            ) : (
              <p className="text-xl font-bold text-gray-900 mt-0.5">{SAR(expectedNext30)}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-2">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key as typeof typeFilter)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                typeFilter === tab.key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {lang === "ar" ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {/* Status + Search row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={[
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                  statusFilter === tab.key
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                ].join(" ")}
              >
                {lang === "ar" ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          <div className="relative ms-auto">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "بحث بالاسم أو العقار..." : "Search by client or property..."}
              className="ps-9 w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <CreditCard className="w-8 h-8 text-gray-300" />
            <p className="text-sm">{lang === "ar" ? "لا توجد مدفوعات" : "No payments found"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "العميل" : "Client"}</TableHead>
                <TableHead>{lang === "ar" ? "العقار" : "Property"}</TableHead>
                <TableHead>{lang === "ar" ? "النوع" : "Type"}</TableHead>
                <TableHead>{lang === "ar" ? "المبلغ" : "Amount (SAR)"}</TableHead>
                <TableHead>{lang === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.clientName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.propertyLabel}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {entry.type === "rent"
                        ? lang === "ar" ? "إيجار" : "Rent"
                        : lang === "ar" ? "بيع" : "Sale"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{SAR(entry.amount)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(entry.dueDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                      {lang === "ar" ? (STATUS_LABELS[entry.status]?.ar ?? entry.status) : (STATUS_LABELS[entry.status]?.en ?? entry.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {can("payments:write") && entry.status !== "PAID" && (
                      <button
                        onClick={() => openPayModal(entry)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
                      >
                        {lang === "ar" ? "تسجيل دفعة" : "Record Payment"}
                      </button>
                    )}
                    {entry.status === "PAID" && (
                      <span className="text-xs text-gray-400">{lang === "ar" ? "مُسدَّد" : "Settled"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Record Payment Modal */}
      <ResponsiveDialog
        open={!!paymentTarget}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
        title={lang === "ar" ? "تسجيل دفعة" : "Record Payment"}
        contentClassName="sm:max-w-[640px]"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setPaymentTarget(null)}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              form="record-payment-form"
              disabled={submitting}
              style={{ display: "inline-flex" }}
              className="gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "ar" ? "تسجيل الدفعة" : "Record Payment"}
            </Button>
          </div>
        }
      >
        {paymentTarget && (
          <form
            id="record-payment-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleRecordPayment();
            }}
            className="space-y-4 py-2"
          >
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-gray-500">{lang === "ar" ? "العميل" : "Client"}: <span className="text-gray-900 font-medium">{paymentTarget.clientName}</span></p>
              <p className="text-gray-500">{lang === "ar" ? "العقار" : "Property"}: <span className="text-gray-900 font-medium">{paymentTarget.propertyLabel}</span></p>
              <p className="text-gray-500">{lang === "ar" ? "المبلغ المستحق" : "Due Amount"}: <span className="text-gray-900 font-medium">{SAR(paymentTarget.amount)}</span></p>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "المبلغ المدفوع (ريال)" : "Payment Amount (SAR)"} *
              </label>
              <Input
                type="number"
                min={0}
                max={paymentTarget.amount}
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "تاريخ الدفع" : "Payment Date"} *
              </label>
              <Input
                type="date"
                value={payForm.paymentDate}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "طريقة الدفع" : "Payment Method"} *
              </label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {lang === "ar" ? m.ar : m.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Number */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "رقم المرجع" : "Reference Number"}
              </label>
              <Input
                value={payForm.referenceNumber}
                onChange={(e) => setPayForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                placeholder={lang === "ar" ? "رقم التحويل أو الشيك..." : "Transfer or check number..."}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </form>
        )}
      </ResponsiveDialog>
    </div>
  );
}
