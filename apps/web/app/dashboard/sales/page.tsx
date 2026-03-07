"use client";

import * as React from "react";
import { ChartLineUp, Users, Tag, Receipt, ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";

const salesModules = [
  { href: "/dashboard/sales/customers", icon: Users, label: { ar: "إدارة العملاء المحتملين", en: "Customer Management" }, desc: { ar: "تتبع وتحويل العملاء", en: "Track and convert customers" }, count: 156 },
  { href: "/dashboard/sales/reservations/new", icon: Tag, label: { ar: "الحجوزات", en: "Reservations" }, desc: { ar: "إدارة حجوزات الوحدات", en: "Manage unit reservations" }, count: 24 },
  { href: "/dashboard/sales/contracts/1", icon: Receipt, label: { ar: "العقود", en: "Contracts" }, desc: { ar: "عقود البيع والشراء", en: "Sales contracts" }, count: 42 },
];

export default function SalesPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "محرك المبيعات" : "Sales Engine"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة دورة المبيعات الكاملة من العميل المحتمل إلى العقد النهائي." : "Manage the full sales pipeline from customer to final contract."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <div className="bg-white rounded-md shadow-card border border-border p-8 hover:shadow-raised hover:border-secondary/30 transition-all h-full flex flex-col">
              <div className="h-12 w-12 rounded-md bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-all">
                <mod.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-primary font-primary">{mod.label[lang]}</h3>
              <p className="text-xs text-neutral mt-1 font-primary flex-1">{mod.desc[lang]}</p>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="available" className="bg-secondary/5 text-secondary border-secondary/20 text-[10px]">{mod.count} {lang === "ar" ? "سجل" : "records"}</Badge>
                <span className="text-xs text-neutral group-hover:text-secondary transition-colors font-primary">{lang === "ar" ? "عرض" : "View"} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
