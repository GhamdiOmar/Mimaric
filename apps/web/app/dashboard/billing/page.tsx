"use client";

import * as React from "react";
import {
  CreditCard,
  Receipt,
  AlertTriangle,
  ChevronRight,
  Crown,
  Loader2,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageIntro,
} from "@repo/ui";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageProvider";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getCurrentSubscription,
  getInvoices,
  getPaymentMethods,
} from "../../actions/billing";

export default function BillingDashboardPage() {
  const { can } = usePermissions();
  const { lang } = useLanguage();
  const [subscription, setSubscription] = React.useState<any>(null);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [changingPlan, setChangingPlan] = React.useState(false);
  const [updatingPayment, setUpdatingPayment] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const [sub, inv, pm] = await Promise.all([
          getCurrentSubscription(),
          getInvoices(1, 5),
          getPaymentMethods(),
        ]);
        setSubscription(sub);
        setInvoices(inv.invoices);
        setPaymentMethods(pm);
      } catch (err) {
        setError(lang === "ar" ? "فشل تحميل بيانات الفوترة" : "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const t = translations[lang];

  if (loading) {
    return (
      <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Skeleton header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        {/* Skeleton plan card */}
        <Card className="rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
                  <div className="h-6 w-36 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </Card>
        {/* Skeleton cards row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="h-5 w-40 bg-muted/50 rounded animate-pulse" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-muted/40 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const invoiceStatusColors: Record<string, string> = {
    PAID: "bg-success/10 text-success",
    OVERDUE: "bg-destructive/10 text-destructive",
    DRAFT: "bg-muted text-muted-foreground",
    SENT: "bg-primary/10 text-primary",
    VOID: "bg-muted text-muted-foreground",
  };

  const statusColors: Record<string, string> = {
    TRIALING: "bg-primary/10 text-primary",
    ACTIVE: "bg-success/10 text-success",
    PAST_DUE: "bg-warning/10 text-warning",
    UNPAID: "bg-destructive/10 text-destructive",
    CANCELED: "bg-muted text-muted-foreground",
    PAUSED: "bg-secondary/10 text-secondary",
  };

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <PageIntro
        title={t.title}
        description={t.subtitle}
        actions={
          can("billing:write") ? (
            <Link href="/dashboard/billing/plans">
              <Button style={{ display: "inline-flex" }} className="gap-1.5" disabled={changingPlan}>
                {changingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {t.changePlan}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grace Period Banner */}
      {subscription?.status === "PAST_DUE" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t.pastDueBanner}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t.pastDueDescription}</p>
          </div>
          <Button variant="secondary" size="sm" style={{ display: "inline-flex" }} className="gap-1.5" disabled={updatingPayment}>
            {updatingPayment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t.updatePayment}
          </Button>
        </div>
      )}

      {/* Current Plan Card */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t.currentPlan}</CardTitle>
          </div>
          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t.plan}</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {lang === "ar" ? subscription.plan.nameAr : subscription.plan.nameEn}
                </p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[subscription.status] ?? ""}`}>
                  {t.statuses[subscription.status as keyof typeof t.statuses] ?? subscription.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.billingCycle}</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {t.cycles[subscription.billingCycle as keyof typeof t.cycles] ?? subscription.billingCycle}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.nextBilling}: {subscription.nextBillingDate
                    ? new Date(subscription.nextBillingDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.price}</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {Number(subscription.priceAtRenewal ?? 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} {t.sar}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.billingCycle === "ANNUAL" ? t.year : t.month}
                  </span>
                </p>
                {subscription.trialEndsAt && subscription.status === "TRIALING" && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {t.trialEnds}: {new Date(subscription.trialEndsAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t.noSubscription}</p>
              <Link href="/dashboard/billing/plans">
                <Button className="mt-4" style={{ display: "inline-flex" }}>{t.choosePlan}</Button>
              </Link>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Payment Methods + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.paymentMethods}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((pm: any) => (
                  <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {pm.brand?.toUpperCase()} •••• {pm.lastFourDigits}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.expires} {pm.expiryMonth}/{pm.expiryYear}
                        </p>
                      </div>
                    </div>
                    {pm.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {t.default}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.noPaymentMethods}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.recentInvoices}</CardTitle>
            </div>
            <Link href="/dashboard/billing/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t.viewAll} <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US") : "—"}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-foreground">
                        {Number(inv.total).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} {t.sar}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColors[inv.status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.noInvoices}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Translations ────────────────────────────────────────────────────────────

const translations = {
  ar: {
    title: "الاشتراك والفوترة",
    subtitle: "إدارة خطة الاشتراك والمدفوعات والفواتير",
    changePlan: "تغيير الخطة",
    currentPlan: "الخطة الحالية",
    plan: "الخطة",
    billingCycle: "دورة الفوترة",
    nextBilling: "الفوترة التالية",
    price: "السعر",
    sar: "ر.س",
    month: "شهر",
    year: "سنة",
    trialEnds: "ينتهي التجربة",
    noSubscription: "لا يوجد اشتراك نشط",
    choosePlan: "اختر خطة",
    paymentMethods: "طرق الدفع",
    expires: "تنتهي",
    default: "افتراضي",
    noPaymentMethods: "لم تتم إضافة طرق دفع",
    recentInvoices: "آخر الفواتير",
    viewAll: "عرض الكل",
    noInvoices: "لا توجد فواتير",
    pastDueBanner: "الدفع متأخر",
    pastDueDescription: "يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.",
    updatePayment: "تحديث الدفع",
    statuses: {
      TRIALING: "تجربة مجانية",
      ACTIVE: "نشط",
      PAST_DUE: "متأخر",
      UNPAID: "غير مدفوع",
      CANCELED: "ملغى",
      PAUSED: "متوقف",
    },
    cycles: {
      MONTHLY: "شهري",
      QUARTERLY: "ربع سنوي",
      SEMI_ANNUAL: "نصف سنوي",
      ANNUAL: "سنوي",
    },
  },
  en: {
    title: "Billing & Subscription",
    subtitle: "Manage your subscription plan, payments, and invoices",
    changePlan: "Change Plan",
    currentPlan: "Current Plan",
    plan: "Plan",
    billingCycle: "Billing Cycle",
    nextBilling: "Next billing",
    price: "Price",
    sar: "SAR",
    month: "month",
    year: "year",
    trialEnds: "Trial ends",
    noSubscription: "No active subscription",
    choosePlan: "Choose a Plan",
    paymentMethods: "Payment Methods",
    expires: "Expires",
    default: "Default",
    noPaymentMethods: "No payment methods added",
    recentInvoices: "Recent Invoices",
    viewAll: "View All",
    noInvoices: "No invoices yet",
    pastDueBanner: "Payment past due",
    pastDueDescription: "Please update your payment method to avoid service interruption.",
    updatePayment: "Update Payment",
    statuses: {
      TRIALING: "Free Trial",
      ACTIVE: "Active",
      PAST_DUE: "Past Due",
      UNPAID: "Unpaid",
      CANCELED: "Canceled",
      PAUSED: "Paused",
    },
    cycles: {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual",
    },
  },
};
