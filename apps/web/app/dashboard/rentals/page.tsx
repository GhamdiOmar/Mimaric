"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { Tag, Plus, CircleDollarSign, Building2, Download } from "lucide-react";
import {
  SARAmount,
  Button,
  Card,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageIntro,
  FilterBar,
  StatusBadge,
} from "@repo/ui";
import Link from "next/link";
import { getLeases } from "../../actions/leases";
import { formatDualDate } from "../../../lib/hijri";

type FilterValue = "all" | "ACTIVE" | "PENDING" | "EXPIRED" | "TERMINATED";

const rentalModules = [
  {
    href: "/dashboard/rentals/new",
    icon: Plus,
    label: { ar: "إنشاء عقد إيجار", en: "New Lease" },
    desc: { ar: "إنشاء عقد إيجار جديد", en: "Create a new tenancy agreement" },
  },
  {
    href: "/dashboard/rentals/payments",
    icon: CircleDollarSign,
    label: { ar: "تحصيل الإيجارات", en: "Rent Collection" },
    desc: { ar: "متابعة الدفعات والتحصيل", en: "Track payments and collections" },
  },
];

export default function RentalsPage() {
  const { lang } = useLanguage();
  const [leases, setLeases] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<FilterValue>("all");

  React.useEffect(() => {
    getLeases()
      .then((data) => setLeases(data as any))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeLeases = leases.filter((l) => l.status === "ACTIVE");
  const totalRent = activeLeases.reduce((s, l) => s + Number(l.totalAmount), 0);

  const filteredLeases =
    activeFilter === "all"
      ? leases
      : leases.filter((l) => l.status === activeFilter);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of leases) {
      counts[l.status] = (counts[l.status] || 0) + 1;
    }
    return counts;
  }, [leases]);

  const filters = React.useMemo(
    () => [
      {
        label: lang === "ar" ? "الكل" : "All",
        value: "all",
        count: leases.length,
      },
      {
        label: lang === "ar" ? "نشط" : "Active",
        value: "ACTIVE",
        count: statusCounts["ACTIVE"] || 0,
      },
      {
        label: lang === "ar" ? "معلّق" : "Pending",
        value: "PENDING",
        count: statusCounts["PENDING"] || 0,
      },
      {
        label: lang === "ar" ? "منتهي" : "Expired",
        value: "EXPIRED",
        count: statusCounts["EXPIRED"] || 0,
      },
      {
        label: lang === "ar" ? "ملغي" : "Terminated",
        value: "TERMINATED",
        count: statusCounts["TERMINATED"] || 0,
      },
    ],
    [lang, leases.length, statusCounts]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Page Header */}
      <PageIntro
        title={lang === "ar" ? "الإيجارات" : "Leases"}
        description={
          lang === "ar"
            ? "إدارة عقود الإيجار والدفعات والتجديدات"
            : "Manage lease agreements, payments, and renewals"
        }
        actions={
          <>
            <Link href="/dashboard/rentals/new">
              <Button className="gap-2" style={{ display: "inline-flex" }}>
                <Plus className="h-4 w-4" />
                {lang === "ar" ? "عقد إيجار جديد" : "New Lease"}
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" style={{ display: "inline-flex" }}>
              <Download className="h-4 w-4" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          label={lang === "ar" ? "عقود نشطة" : "Active Leases"}
          value={loading ? "—" : activeLeases.length}
          subtitle={lang === "ar" ? "العقود السارية حالياً" : "Currently active agreements"}
          icon={<Tag className="h-5 w-5" />}
          accentColor="success"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "إجمالي الإيجار السنوي" : "Total Annual Rent"}
          value={loading ? "—" : <SARAmount value={totalRent} size={20} />}
          subtitle={lang === "ar" ? "مجموع الإيجارات للعقود النشطة" : "Sum of rent for active leases"}
          icon={<CircleDollarSign className="h-5 w-5" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "إجمالي العقود" : "Total Leases"}
          value={loading ? "—" : leases.length}
          subtitle={lang === "ar" ? "جميع العقود بكل الحالات" : "All leases across all statuses"}
          icon={<Building2 className="h-5 w-5" />}
          accentColor="info"
          loading={loading}
        />
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rentalModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <Card className="p-8 hover:shadow-lg hover:border-primary/20 transition-all">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <mod.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{mod.label[lang]}</h3>
              <p className="text-xs text-muted-foreground mt-2">{mod.desc[lang]}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Filter Bar + Leases Table */}
      {!loading && leases.length > 0 && (
        <div className="space-y-4">
          <FilterBar
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={(v) => setActiveFilter(v as FilterValue)}
          />

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">
                    {lang === "ar" ? "المستأجر" : "Tenant"}
                  </TableHead>
                  <TableHead className="px-6">
                    {lang === "ar" ? "الوحدة" : "Unit"}
                  </TableHead>
                  <TableHead className="px-6">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </TableHead>
                  <TableHead className="px-6">
                    {lang === "ar" ? "القيمة" : "Amount"}
                  </TableHead>
                  <TableHead className="px-6">
                    {lang === "ar" ? "الفترة" : "Period"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeases.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="px-6 text-sm font-medium text-foreground">
                      {l.customer.name}
                    </TableCell>
                    <TableCell className="px-6 text-sm text-foreground">
                      {l.unit.number}
                    </TableCell>
                    <TableCell className="px-6">
                      <StatusBadge entityType="lease" status={l.status} />
                    </TableCell>
                    <TableCell className="px-6 text-sm font-medium text-foreground">
                      <SARAmount value={Number(l.totalAmount)} size={12} />
                    </TableCell>
                    <TableCell className="px-6 text-xs text-muted-foreground font-mono tabular-nums">
                      {formatDualDate(l.startDate, lang)} — {formatDualDate(l.endDate, lang)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {lang === "ar" ? "لا توجد عقود في هذه الفئة" : "No leases in this category"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
