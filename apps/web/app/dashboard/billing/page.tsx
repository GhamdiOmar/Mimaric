"use client";

import * as React from "react";
import {
  CreditCard,
  Receipt,
  AlertTriangle,
  ChevronRight,
  Crown,
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
      } catch (error) {
        console.error("Failed to load billing data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const t = translations[lang];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    TRIALING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    PAST_DUE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    UNPAID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    CANCELED: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300",
    PAUSED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
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
              <Button style={{ display: "inline-flex" }}>
                <Crown className="w-4 h-4 me-2" />
                {t.changePlan}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Grace Period Banner */}
      {subscription?.status === "PAST_DUE" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t.pastDueBanner}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t.pastDueDescription}</p>
          </div>
          <Button variant="secondary" size="sm" style={{ display: "inline-flex" }}>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === "PAID" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                        inv.status === "OVERDUE" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300"
                      }`}>
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
