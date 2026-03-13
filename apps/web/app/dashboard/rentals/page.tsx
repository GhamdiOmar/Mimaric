"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { Tag, Plus, CurrencyCircleDollar, Buildings } from "@phosphor-icons/react";
import {
  SARAmount,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
import Link from "next/link";
import { getLeases } from "../../actions/leases";
import { formatDualDate } from "../../../lib/hijri";

const rentalModules = [
  { href: "/dashboard/rentals/new", icon: Plus, label: { ar: "إنشاء عقد إيجار", en: "New Lease" }, desc: { ar: "إنشاء عقد إيجار جديد", en: "Create a new tenancy agreement" } },
  { href: "/dashboard/rentals/payments", icon: CurrencyCircleDollar, label: { ar: "تحصيل الإيجارات", en: "Rent Collection" }, desc: { ar: "متابعة الدفعات والتحصيل", en: "Track payments and collections" } },
];

export default function RentalsPage() {
  const { lang } = useLanguage();
  const [leases, setLeases] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getLeases()
      .then((data) => setLeases(data as any))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeLeases = leases.filter((l) => l.status === "ACTIVE");
  const totalRent = activeLeases.reduce((s, l) => s + Number(l.totalAmount), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="px-2">
        <h1 className="text-2xl font-bold text-primary font-primary">
          {lang === "ar" ? "إدارة الإيجارات" : "Rental Management"}
        </h1>
        <p className="text-sm text-neutral mt-1 font-primary">
          {lang === "ar" ? "إدارة عقود الإيجار وتحصيل المدفوعات." : "Manage lease agreements and payment collections."}
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "عقود نشطة" : "Active Leases"}</span>
            <Tag size={20} className="text-secondary" />
          </div>
          <h3 className="text-2xl font-bold text-primary">{loading ? "—" : activeLeases.length}</h3>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "إجمالي الإيجار السنوي" : "Total Annual Rent"}</span>
            <CurrencyCircleDollar size={20} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-primary">
            {loading ? "—" : <SARAmount value={totalRent} size={20} />}
          </h3>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "إجمالي العقود" : "Total Leases"}</span>
            <Buildings size={20} className="text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-primary">{loading ? "—" : leases.length}</h3>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rentalModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <Card className="p-8 hover:shadow-raised hover:border-primary/20 transition-all">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <mod.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-primary font-primary">{mod.label[lang]}</h3>
              <p className="text-xs text-neutral mt-2 font-primary">{mod.desc[lang]}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Leases Table */}
      {!loading && activeLeases.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-primary">{lang === "ar" ? "العقود النشطة" : "Active Leases"}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">{lang === "ar" ? "المستأجر" : "Tenant"}</TableHead>
                <TableHead className="px-6">{lang === "ar" ? "الوحدة" : "Unit"}</TableHead>
                <TableHead className="px-6">{lang === "ar" ? "القيمة" : "Amount"}</TableHead>
                <TableHead className="px-6">{lang === "ar" ? "الفترة" : "Period"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLeases.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="px-6 text-sm font-bold text-primary">{l.customer.name}</TableCell>
                  <TableCell className="px-6 text-sm text-primary">{l.unit.number}</TableCell>
                  <TableCell className="px-6 text-sm font-bold text-primary"><SARAmount value={Number(l.totalAmount)} size={12} /></TableCell>
                  <TableCell className="px-6 text-xs text-neutral font-latin">
                    {formatDualDate(l.startDate, lang)} — {formatDualDate(l.endDate, lang)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
