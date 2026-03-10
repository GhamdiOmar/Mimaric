"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  ArrowLeft,
  CreditCard,
  CaretLeft,
  CaretRight,
  Users,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  Pause,
  Receipt,
} from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import Link from "next/link";
import { adminGetAllSubscriptions } from "../../../actions/billing";

// ─── Types ──────────────────────────────────────────────────────────────────

type Subscription = {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  priceAtRenewal: number | string | null;
  plan: {
    nameEn: string;
    nameAr: string;
    slug: string;
  };
  organization: {
    id: string;
    name: string;
    nameArabic: string | null;
    crNumber: string | null;
  };
};

type SubscriptionsResult = {
  subscriptions: Subscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Status Colors ──────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  TRIALING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAST_DUE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PAUSED: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  TRIALING: <Clock size={14} />,
  ACTIVE: <CheckCircle size={14} />,
  PAST_DUE: <Warning size={14} />,
  CANCELED: <XCircle size={14} />,
  UNPAID: <XCircle size={14} />,
  PAUSED: <Pause size={14} />,
};

// ─── Translations ───────────────────────────────────────────────────────────

const translations = {
  ar: {
    back: "العودة للوحة الإدارة",
    title: "اشتراكات المنظمات",
    subtitle: "عرض وإدارة جميع اشتراكات المنظمات على المنصة",
    total: "الإجمالي",
    active: "نشط",
    trialing: "تجربة",
    pastDue: "متأخر",
    canceled: "ملغى",
    organization: "المنظمة",
    plan: "الخطة",
    status: "الحالة",
    billingCycle: "دورة الفوترة",
    price: "السعر",
    periodEnd: "نهاية الفترة",
    sar: "ر.س",
    noSubscriptions: "لا توجد اشتراكات حالياً",
    noSubscriptionsDesc: "لم يتم تسجيل أي اشتراكات بعد",
    page: "صفحة",
    of: "من",
    prev: "السابق",
    next: "التالي",
    loading: "جاري التحميل...",
    crNumber: "س.ت",
    statuses: {
      TRIALING: "تجربة مجانية",
      ACTIVE: "نشط",
      PAST_DUE: "متأخر",
      CANCELED: "ملغى",
      UNPAID: "غير مدفوع",
      PAUSED: "متوقف",
    } as Record<string, string>,
    cycles: {
      MONTHLY: "شهري",
      QUARTERLY: "ربع سنوي",
      SEMI_ANNUAL: "نصف سنوي",
      ANNUAL: "سنوي",
    } as Record<string, string>,
  },
  en: {
    back: "Back to Admin",
    title: "Organization Subscriptions",
    subtitle: "View and manage all organization subscriptions on the platform",
    total: "Total",
    active: "Active",
    trialing: "Trialing",
    pastDue: "Past Due",
    canceled: "Canceled",
    organization: "Organization",
    plan: "Plan",
    status: "Status",
    billingCycle: "Billing Cycle",
    price: "Price",
    periodEnd: "Period End",
    sar: "SAR",
    noSubscriptions: "No subscriptions yet",
    noSubscriptionsDesc: "No subscriptions have been recorded",
    page: "Page",
    of: "of",
    prev: "Previous",
    next: "Next",
    loading: "Loading...",
    crNumber: "CR",
    statuses: {
      TRIALING: "Trialing",
      ACTIVE: "Active",
      PAST_DUE: "Past Due",
      CANCELED: "Canceled",
      UNPAID: "Unpaid",
      PAUSED: "Paused",
    } as Record<string, string>,
    cycles: {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual",
    } as Record<string, string>,
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const { lang } = useLanguage();
  const [data, setData] = React.useState<SubscriptionsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await adminGetAllSubscriptions(page, pageSize);
        setData(result);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const t = translations[lang];

  // ─── Computed stats ─────────────────────────────────────────────────────

  const stats = React.useMemo(() => {
    if (!data) return { total: 0, active: 0, trialing: 0, pastDue: 0, canceled: 0 };
    const subs = data.subscriptions;
    return {
      total: data.total,
      active: subs.filter((s) => s.status === "ACTIVE").length,
      trialing: subs.filter((s) => s.status === "TRIALING").length,
      pastDue: subs.filter((s) => s.status === "PAST_DUE").length,
      canceled: subs.filter((s) => s.status === "CANCELED").length,
    };
  }, [data]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString(
      lang === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const formatPrice = (price: number | string | null) => {
    if (price == null) return "--";
    return `${Number(price).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} ${t.sar}`;
  };

  const getOrgDisplayName = (org: Subscription["organization"]) => {
    if (lang === "ar" && org.nameArabic) return org.nameArabic;
    return org.name;
  };

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const subscriptions = data?.subscriptions ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Back Link + Language Toggle */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t.back}
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t.total}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-muted-foreground">{t.active}</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-muted-foreground">{t.trialing}</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.trialing}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Warning size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-muted-foreground">{t.pastDue}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pastDue}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-xs text-muted-foreground">{t.canceled}</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.canceled}</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.organization}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.plan}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.status}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.billingCycle}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.price}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-start">
                  {t.periodEnd}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      {t.loading}
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Receipt size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">{t.noSubscriptions}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.noSubscriptionsDesc}</p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Organization */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {getOrgDisplayName(sub.organization)}
                      </div>
                      {sub.organization.crNumber && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.crNumber}: {sub.organization.crNumber}
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {lang === "ar" ? sub.plan.nameAr : sub.plan.nameEn}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[sub.status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300"}`}
                      >
                        {statusIcons[sub.status]}
                        {t.statuses[sub.status] ?? sub.status}
                      </span>
                    </td>

                    {/* Billing Cycle */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.cycles[sub.billingCycle] ?? sub.billingCycle}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatPrice(sub.priceAtRenewal)}
                    </td>

                    {/* Period End */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(sub.currentPeriodEnd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
             
            >
              <CaretLeft size={14} className="me-1" />
              {t.prev}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
             
            >
              {t.next}
              <CaretRight size={14} className="ms-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
