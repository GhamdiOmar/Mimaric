"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Receipt,
  CurrencyCircleDollar,
  CheckCircle,
  Warning,
  CaretLeft,
  CaretRight,
  FileText,
} from "@phosphor-icons/react";
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
import Link from "next/link";
import { adminGetAllInvoices } from "../../../actions/billing";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELED";
  billingCycle: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  organization: { id: string; name: string; nameArabic: string | null } | null;
  subscription: { plan: { nameEn: string; nameAr: string } } | null;
};

const statusConfig: Record<
  string,
  { label: { ar: string; en: string }; className: string }
> = {
  PAID: {
    label: { ar: "مدفوعة", en: "Paid" },
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  ISSUED: {
    label: { ar: "صادرة", en: "Issued" },
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  OVERDUE: {
    label: { ar: "متأخرة", en: "Overdue" },
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  DRAFT: {
    label: { ar: "مسودة", en: "Draft" },
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300",
  },
  CANCELED: {
    label: { ar: "ملغاة", en: "Canceled" },
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};

function formatCurrency(amount: number, lang: "ar" | "en"): string {
  const formatted = Number(amount).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === "ar" ? `${formatted} ر.س` : `SAR ${formatted}`;
}

function formatDate(dateStr: string | null, lang: "ar" | "en"): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPaymentsPage() {
  const { lang } = useLanguage();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 50;

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await adminGetAllInvoices(page, pageSize);
        if (active) {
          setInvoices(data.invoices);
          setTotalPages(data.totalPages);
          setTotal(data.total);
          setPage(data.page);
        }
      } catch {
        // Permission or fetch error — leave empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page]);

  // Computed stats
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;
  const overdueCount = invoices.filter(
    (inv) => inv.status === "OVERDUE"
  ).length;

  const stats = [
    {
      label: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
      value: formatCurrency(totalRevenue, lang),
      icon: CurrencyCircleDollar,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: { ar: "إجمالي الفواتير", en: "Total Invoices" },
      value: total.toString(),
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: { ar: "مدفوعة", en: "Paid" },
      value: paidCount.toString(),
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: { ar: "متأخرة", en: "Overdue" },
      value: overdueCount.toString(),
      icon: Warning,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Back link */}
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-primary"
      >
        <BackArrow size={16} />
        {lang === "ar" ? "إدارة المنصة" : "Platform Administration"}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Receipt size={28} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary font-primary">
              {lang === "ar" ? "الفواتير والمدفوعات" : "Invoices & Payments"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-primary">
              {lang === "ar"
                ? "عرض جميع الفواتير والمعاملات المالية عبر جميع المنظمات"
                : "View all invoices and payment transactions across all organizations"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="p-5 flex items-center gap-4"
          >
            <div
              className={`h-11 w-11 rounded-md ${stat.bg} flex items-center justify-center ${stat.color}`}
            >
              <stat.icon size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-primary">
                {stat.label[lang]}
              </p>
              <p className="text-xl font-bold text-foreground font-primary mt-0.5">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Receipt size={48} weight="duotone" className="mb-4 opacity-40" />
            <p className="font-primary">
              {lang === "ar" ? "لا توجد فواتير" : "No invoices found"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-primary">
                  {lang === "ar" ? "رقم الفاتورة" : "Invoice #"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "المنظمة" : "Organization"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "الخطة" : "Plan"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "الحالة" : "Status"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "المبلغ" : "Subtotal"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "الضريبة" : "VAT"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "الإجمالي" : "Total"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "تاريخ الإصدار" : "Issued"}
                </TableHead>
                <TableHead className="font-primary">
                  {lang === "ar" ? "تاريخ الاستحقاق" : "Due Date"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const sc = statusConfig[invoice.status] ?? { label: { ar: "مسودة", en: "Draft" }, className: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300" };
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs text-foreground">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-primary text-foreground">
                      {lang === "ar"
                        ? invoice.organization?.nameArabic ||
                          invoice.organization?.name ||
                          "-"
                        : invoice.organization?.name ||
                          invoice.organization?.nameArabic ||
                          "-"}
                    </TableCell>
                    <TableCell className="font-primary text-foreground">
                      {lang === "ar"
                        ? invoice.subscription?.plan?.nameAr ?? "-"
                        : invoice.subscription?.plan?.nameEn ?? "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-primary ${sc.className}`}
                      >
                        {sc.label[lang]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {formatCurrency(invoice.subtotal, lang)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {formatCurrency(invoice.vatAmount, lang)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {formatCurrency(invoice.total, lang)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-primary text-xs">
                      {formatDate(invoice.issuedAt, lang)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-primary text-xs">
                      {formatDate(invoice.dueDate, lang)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground font-primary">
              {lang === "ar"
                ? `صفحة ${page} من ${totalPages} (${total} فاتورة)`
                : `Page ${page} of ${totalPages} (${total} invoices)`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}

              >
                <CaretLeft size={16} className="rtl:rotate-180" />
                {lang === "ar" ? "السابق" : "Previous"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}

              >
                {lang === "ar" ? "التالي" : "Next"}
                <CaretRight size={16} className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
