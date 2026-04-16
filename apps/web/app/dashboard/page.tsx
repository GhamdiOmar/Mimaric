"use client";

import * as React from "react";
import {
  Building2,
  TrendingUp,
  FileText,
  Wrench,
  AlertTriangle,
  Handshake,
  CreditCard,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Circle,
} from "lucide-react";
import { KPICard, SARAmount, Card, CardHeader, CardTitle, CardContent, Button } from "@repo/ui";
import { useLanguage } from "../../components/LanguageProvider";
import { useSession } from "../../components/SimpleSessionProvider";
import {
  getDashboardV3Stats,
  getDashboardRecentDeals,
  getDashboardUpcomingPayments,
  getDashboardMaintenanceSummary,
} from "../actions/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type V3Stats = {
  totalProperties: number;
  activeDeals: number;
  signedContracts: number;
  pendingPayments: number;
  openMaintenance: number;
  monthlyRevenue: number;
};

type Deal = {
  id: string;
  status: string;
  customer: { id: string; name: string };
  unit: { id: string; number: string };
  createdAt: string;
};

type Installment = {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  contract: {
    customer: { id: string; name: string };
    unit: { id: string; number: string };
  };
};

type MaintenanceSummaryItem = { status: string; count: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string, lang: "ar" | "en") {
  const map: Record<string, { label: { ar: string; en: string }; cls: string }> = {
    PENDING:   { label: { ar: "معلق", en: "Pending" },     cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    CONFIRMED: { label: { ar: "مؤكد", en: "Confirmed" },   cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    SIGNED:    { label: { ar: "موقع", en: "Signed" },      cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    CANCELLED: { label: { ar: "ملغى", en: "Cancelled" },   cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  };
  const entry = map[status] ?? { label: { ar: status, en: status }, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.cls}`}>
      {entry.label[lang]}
    </span>
  );
}

function maintenanceStatusIcon(status: string) {
  if (status === "COMPLETED") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "IN_PROGRESS") return <Clock className="h-4 w-4 text-blue-500" />;
  return <Circle className="h-4 w-4 text-amber-500" />;
}

function maintenanceStatusLabel(status: string, lang: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    OPEN:        { ar: "مفتوح", en: "Open" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress" },
    COMPLETED:   { ar: "مكتمل", en: "Completed" },
    CANCELLED:   { ar: "ملغى", en: "Cancelled" },
  };
  return map[status]?.[lang] ?? status;
}

function formatRelativeDate(dateStr: string, lang: "ar" | "en"): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return lang === "ar" ? "اليوم" : "Today";
  if (days === 1) return lang === "ar" ? "أمس" : "Yesterday";
  if (days < 30) return lang === "ar" ? `منذ ${days} يوم` : `${days} days ago`;
  const months = Math.floor(days / 30);
  return lang === "ar" ? `منذ ${months} شهر` : `${months}mo ago`;
}

function formatDueDate(dateStr: string, lang: "ar" | "en"): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { lang } = useLanguage();
  const { data: session } = useSession();

  const [stats, setStats] = React.useState<V3Stats | null>(null);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [payments, setPayments] = React.useState<Installment[]>([]);
  const [maintenance, setMaintenance] = React.useState<MaintenanceSummaryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [s, d, p, m] = await Promise.all([
        getDashboardV3Stats(),
        getDashboardRecentDeals(),
        getDashboardUpcomingPayments(),
        getDashboardMaintenanceSummary(),
      ]);
      setStats(s);
      setDeals(d);
      setPayments(p);
      setMaintenance(m);
    } catch {
      setError(lang === "ar" ? "فشل تحميل بيانات لوحة المعلومات. يرجى المحاولة مرة أخرى." : "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (n: number) => n.toLocaleString("en-US");
  const userName = session?.user?.name ?? (lang === "ar" ? "مستخدم" : "User");

  const hour = new Date().getHours();
  const greeting =
    lang === "ar"
      ? hour < 12 ? "صباح الخير" : "مساء الخير"
      : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="glass rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}، {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={loadDashboard} style={{ display: "inline-flex" }}>
            {lang === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      )}

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي الوحدات" : "Total Properties"}
          value={loading ? "—" : formatNumber(stats?.totalProperties ?? 0)}
          subtitle={lang === "ar" ? "جميع وحدات المنشأة" : "All units in your organization"}
          icon={<Building2 className="h-[18px] w-[18px]" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "الصفقات النشطة" : "Active Deals"}
          value={loading ? "—" : formatNumber(stats?.activeDeals ?? 0)}
          subtitle={lang === "ar" ? "حجوزات معلقة أو مؤكدة" : "Pending or confirmed reservations"}
          icon={<Handshake className="h-[18px] w-[18px]" />}
          accentColor="info"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "العقود الموقعة" : "Signed Contracts"}
          value={loading ? "—" : formatNumber(stats?.signedContracts ?? 0)}
          subtitle={lang === "ar" ? "عقود مكتملة الإجراءات" : "Fully executed contracts"}
          icon={<FileText className="h-[18px] w-[18px]" />}
          accentColor="success"
          loading={loading}
        />
      </div>

      {/* KPI Cards — Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label={lang === "ar" ? "المدفوعات المعلقة" : "Pending Payments"}
          value={loading ? "—" : formatNumber(stats?.pendingPayments ?? 0)}
          subtitle={lang === "ar" ? "أقساط متأخرة غير مسددة" : "Overdue installments unpaid"}
          icon={<CreditCard className="h-[18px] w-[18px]" />}
          accentColor={stats && stats.pendingPayments > 0 ? "warning" : "primary"}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "طلبات الصيانة" : "Open Maintenance"}
          value={loading ? "—" : formatNumber(stats?.openMaintenance ?? 0)}
          subtitle={lang === "ar" ? "طلبات لم تُغلق بعد" : "Requests not yet completed"}
          icon={<Wrench className="h-[18px] w-[18px]" />}
          accentColor={stats && stats.openMaintenance > 10 ? "warning" : "info"}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"}
          value={loading ? "—" : <SARAmount value={stats?.monthlyRevenue ?? 0} compact size={20} />}
          subtitle={lang === "ar" ? "المدفوعات المحصلة هذا الشهر" : "Payments collected this month"}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          accentColor="secondary"
          loading={loading}
        />
      </div>

      {/* Activity Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              {lang === "ar" ? "آخر الصفقات" : "Recent Deals"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {lang === "ar" ? "لا توجد صفقات حتى الآن" : "No deals yet"}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {deal.customer.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-latin">
                          {lang === "ar" ? "وحدة" : "Unit"} {deal.unit.number}
                          {" · "}
                          {formatRelativeDate(deal.createdAt, lang)}
                        </p>
                      </div>
                    </div>
                    {statusBadge(deal.status, lang)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payment Deadlines */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {lang === "ar" ? "مواعيد الأقساط القادمة" : "Upcoming Payment Deadlines"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {lang === "ar" ? "لا توجد أقساط قادمة" : "No upcoming payments"}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {payments.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {inst.contract.customer.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-latin">
                        {lang === "ar" ? "وحدة" : "Unit"} {inst.contract.unit.number}
                        {" · "}
                        {formatDueDate(inst.dueDate, lang)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-card-foreground number-ltr shrink-0">
                      <SARAmount value={inst.amount} compact size={13} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              {lang === "ar" ? "حالة الصيانة" : "Maintenance Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : maintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {lang === "ar" ? "لا توجد طلبات صيانة" : "No maintenance requests"}
              </p>
            ) : (
              <div className="space-y-3">
                {maintenance.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {maintenanceStatusIcon(item.status)}
                      <span className="text-sm text-card-foreground">
                        {maintenanceStatusLabel(item.status, lang)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-card-foreground number-ltr">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
