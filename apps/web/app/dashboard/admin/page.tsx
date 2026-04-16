"use client";

import * as React from "react";
import {
  Building2, Users, Home, FileText, CheckCircle, Clock, AlertCircle,
  XCircle, Receipt, BadgeDollarSign, TrendingUp, Ticket,
  ListChecks, Tag, SearchCheck, Settings, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageProvider";
import { adminGetPlatformStats } from "../../actions/admin-stats";

type Stats = Awaited<ReturnType<typeof adminGetPlatformStats>>;

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: { ar: string; en: string };
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  const { lang } = useLanguage();
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 shadow-sm">
      <div className={`h-11 w-11 rounded-md flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label[lang]}</p>
      </div>
    </div>
  );
}

const quickLinks = [
  {
    href: "/dashboard/admin/plans",
    icon: ListChecks,
    label: { ar: "إدارة الخطط", en: "Plans" },
    desc: { ar: "خطط الاشتراك والأسعار", en: "Subscription plans & pricing" },
  },
  {
    href: "/dashboard/admin/subscriptions",
    icon: Users,
    label: { ar: "الاشتراكات", en: "Subscriptions" },
    desc: { ar: "اشتراكات المنظمات وحالتها", en: "Organization subscriptions" },
  },
  {
    href: "/dashboard/admin/coupons",
    icon: Tag,
    label: { ar: "الكوبونات", en: "Coupons" },
    desc: { ar: "أكواد الخصم والعروض", en: "Discount codes & promotions" },
  },
  {
    href: "/dashboard/admin/payments",
    icon: Receipt,
    label: { ar: "الفواتير والمدفوعات", en: "Invoices & Payments" },
    desc: { ar: "جميع الفواتير والمعاملات", en: "All invoices & transactions" },
  },
  {
    href: "/dashboard/admin/seo",
    icon: SearchCheck,
    label: { ar: "إعدادات SEO", en: "SEO Settings" },
    desc: { ar: "ميتاداتا وروبوتس والتحليلات", en: "Metadata, robots & analytics" },
  },
  {
    href: "/dashboard/admin/tickets",
    icon: Ticket,
    label: { ar: "تذاكر الدعم", en: "Support Tickets" },
    desc: { ar: "إدارة طلبات الدعم", en: "Manage support requests" },
  },
];

export default function SystemAdminPage() {
  const { lang } = useLanguage();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    adminGetPlatformStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ar" ? "إدارة المنصة" : "Platform Administration"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "ar" ? "نظرة عامة على الإحصاءات والوصول إلى أدوات الإدارة" : "Platform-wide statistics and management tools"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 h-[88px] animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <>
          {/* Row 1: Platform Scale */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {lang === "ar" ? "حجم المنصة" : "Platform Scale"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={{ ar: "المنظمات العميلة", en: "Client Orgs" }} value={fmt(stats.orgCount)} icon={Building2} color="bg-primary/10 text-primary" />
              <StatCard label={{ ar: "إجمالي المستخدمين", en: "Total Users" }} value={fmt(stats.userCount)} icon={Users} color="bg-blue-500/10 text-blue-500" />
              <StatCard label={{ ar: "إجمالي الوحدات", en: "Total Properties" }} value={fmt(stats.propertyCount)} icon={Home} color="bg-indigo-500/10 text-indigo-500" />
              <StatCard label={{ ar: "إجمالي العقود", en: "Total Contracts" }} value={fmt(stats.contractCount)} icon={FileText} color="bg-violet-500/10 text-violet-500" />
            </div>
          </section>

          {/* Row 2: Subscription Health */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {lang === "ar" ? "صحة الاشتراكات" : "Subscription Health"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={{ ar: "اشتراكات نشطة", en: "Active" }} value={fmt(stats.activeSubscriptions)} icon={CheckCircle} color="bg-green-500/10 text-green-500" />
              <StatCard label={{ ar: "فترة تجريبية", en: "Trialing" }} value={fmt(stats.trialingSubscriptions)} icon={Clock} color="bg-blue-500/10 text-blue-500" />
              <StatCard label={{ ar: "متأخرة الدفع", en: "Past Due" }} value={fmt(stats.pastDueSubscriptions)} icon={AlertCircle} color="bg-amber-500/10 text-amber-500" />
              <StatCard label={{ ar: "ملغاة", en: "Canceled" }} value={fmt(stats.canceledSubscriptions)} icon={XCircle} color="bg-muted text-muted-foreground" />
            </div>
          </section>

          {/* Row 3: Billing Health */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {lang === "ar" ? "صحة الفوترة" : "Billing Health"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={{ ar: "فواتير مدفوعة", en: "Paid Invoices" }} value={fmt(stats.paidInvoices)} icon={BadgeDollarSign} color="bg-green-500/10 text-green-500" />
              <StatCard label={{ ar: "فواتير غير مدفوعة", en: "Unpaid Invoices" }} value={fmt(stats.unpaidInvoices)} icon={TrendingUp} color="bg-amber-500/10 text-amber-500" />
              <StatCard label={{ ar: "فواتير متأخرة", en: "Overdue Invoices" }} value={fmt(stats.overdueInvoices)} icon={AlertCircle} color="bg-red-500/10 text-red-500" />
              <StatCard label={{ ar: "تذاكر مفتوحة", en: "Open Tickets" }} value={fmt(stats.openTickets + stats.inProgressTickets)} icon={Ticket} color="bg-orange-500/10 text-orange-500" />
            </div>
          </section>
        </>
      )}

      {/* Quick Links */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {lang === "ar" ? "أدوات الإدارة" : "Management Tools"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200 shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{item.label[lang]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc[lang]}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
