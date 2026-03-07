"use client";

import * as React from "react";
import { Tag, Receipt, Plus, CurrencyCircleDollar } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";

const rentalModules = [
  { href: "/dashboard/rentals/new", icon: Plus, label: { ar: "إنشاء عقد إيجار", en: "New Lease" }, desc: { ar: "إنشاء عقد إيجار جديد", en: "Create a new tenancy agreement" } },
  { href: "/dashboard/rentals/payments", icon: CurrencyCircleDollar, label: { ar: "تحصيل الإيجارات", en: "Rent Collection" }, desc: { ar: "متابعة الدفعات والتحصيل", en: "Track payments and collections" } },
];

export default function RentalsPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "إدارة الإيجارات" : "Rental Management"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة عقود الإيجار وتحصيل المدفوعات." : "Manage lease agreements and payment collections."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rentalModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <div className="bg-white rounded-md shadow-card border border-border p-8 hover:shadow-raised hover:border-primary/20 transition-all">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <mod.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-primary font-primary">{mod.label[lang]}</h3>
              <p className="text-xs text-neutral mt-2 font-primary">{mod.desc[lang]}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
