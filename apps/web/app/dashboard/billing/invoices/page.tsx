"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  Receipt,
  DownloadSimple,
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Eye,
} from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import Link from "next/link";
import { getInvoices } from "../../../actions/billing";

export default function InvoicesPage() {
  const { lang } = useLanguage();
  const [data, setData] = React.useState<any>({ invoices: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getInvoices(page, 20);
        setData(result);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const t = translations[lang];

  const statusConfig: Record<string, { color: string; labelAr: string; labelEn: string }> = {
    DRAFT: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", labelAr: "مسودة", labelEn: "Draft" },
    ISSUED: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", labelAr: "صادرة", labelEn: "Issued" },
    PAID: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", labelAr: "مدفوعة", labelEn: "Paid" },
    OVERDUE: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", labelAr: "متأخرة", labelEn: "Overdue" },
    CANCELED: { color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", labelAr: "ملغاة", labelEn: "Canceled" },
    REFUNDED: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", labelAr: "مستردة", labelEn: "Refunded" },
  };

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <Link href="/dashboard/billing" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t.backToBilling}
        </Link>
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : data.invoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t.noInvoices}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.invoiceNumber}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.date}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.status}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.subtotal}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.vat}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.total}</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv: any) => {
                    const status = statusConfig[inv.status] ?? statusConfig.DRAFT!;
                    return (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {inv.issuedAt
                            ? new Date(inv.issuedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {lang === "ar" ? status.labelAr : status.labelEn}
                          </span>
                        </td>
                        <td className="px-4 py-3">{Number(inv.subtotal).toLocaleString()} {t.sar}</td>
                        <td className="px-4 py-3">{Number(inv.vatAmount).toLocaleString()} {t.sar}</td>
                        <td className="px-4 py-3 font-semibold">{Number(inv.total).toLocaleString()} {t.sar}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-md hover:bg-muted" title={t.view}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-muted" title={t.download}>
                              <DownloadSimple className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {t.showing} {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} {t.of} {data.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                   
                  >
                    {lang === "ar" ? <CaretRight className="w-4 h-4" /> : <CaretLeft className="w-4 h-4" />}
                  </Button>
                  <span className="text-sm">{page} / {data.totalPages}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                   
                  >
                    {lang === "ar" ? <CaretLeft className="w-4 h-4" /> : <CaretRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Translations ────────────────────────────────────────────────────────────

const translations = {
  ar: {
    title: "الفواتير",
    subtitle: "عرض وتحميل جميع فواتيرك",
    backToBilling: "العودة للفوترة",
    noInvoices: "لا توجد فواتير",
    invoiceNumber: "رقم الفاتورة",
    date: "التاريخ",
    status: "الحالة",
    subtotal: "المجموع الفرعي",
    vat: "ضريبة القيمة المضافة",
    total: "الإجمالي",
    actions: "إجراءات",
    sar: "ر.س",
    view: "عرض",
    download: "تحميل",
    showing: "عرض",
    of: "من",
  },
  en: {
    title: "Invoices",
    subtitle: "View and download all your invoices",
    backToBilling: "Back to Billing",
    noInvoices: "No invoices yet",
    invoiceNumber: "Invoice #",
    date: "Date",
    status: "Status",
    subtotal: "Subtotal",
    vat: "VAT (15%)",
    total: "Total",
    actions: "Actions",
    sar: "SAR",
    view: "View",
    download: "Download",
    showing: "Showing",
    of: "of",
  },
};
