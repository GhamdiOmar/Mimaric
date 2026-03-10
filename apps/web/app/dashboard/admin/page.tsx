"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  ListChecks,
  Users,
  Tag,
  Receipt,
  CaretRight,
  GearSix,
} from "@phosphor-icons/react";
import Link from "next/link";

const sections = [
  {
    href: "/dashboard/admin/plans",
    icon: ListChecks,
    label: { ar: "إدارة الخطط", en: "Plans Management" },
    desc: {
      ar: "إدارة خطط الاشتراك والأسعار والميزات",
      en: "Manage subscription plans, pricing, and features",
    },
  },
  {
    href: "/dashboard/admin/subscriptions",
    icon: Users,
    label: { ar: "الاشتراكات", en: "Subscriptions" },
    desc: {
      ar: "عرض جميع اشتراكات المنظمات وحالتها",
      en: "View all organization subscriptions and their status",
    },
  },
  {
    href: "/dashboard/admin/coupons",
    icon: Tag,
    label: { ar: "الكوبونات", en: "Coupons" },
    desc: {
      ar: "إنشاء وإدارة أكواد الخصم والعروض الترويجية",
      en: "Create and manage discount codes and promotions",
    },
  },
  {
    href: "/dashboard/admin/payments",
    icon: Receipt,
    label: { ar: "الفواتير والمدفوعات", en: "Invoices & Payments" },
    desc: {
      ar: "عرض جميع الفواتير والمعاملات المالية",
      en: "View all invoices and payment transactions",
    },
  },
];

export default function SystemAdminPage() {
  const { lang } = useLanguage();

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <GearSix size={28} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary font-primary">
              {lang === "ar" ? "إدارة المنصة" : "Platform Administration"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-primary">
              {lang === "ar"
                ? "إدارة الخطط والاشتراكات والكوبونات"
                : "Manage plans, subscriptions, and coupons"}
            </p>
          </div>
        </div>
      </div>

      {/* Section Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <div className="bg-card rounded-md shadow-card border border-border p-8 hover:shadow-raised hover:border-primary/30 hover:scale-[1.01] transition-all duration-200 h-full flex flex-col">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  <section.icon size={32} weight="duotone" />
                </div>
                <CaretRight
                  size={20}
                  className="text-muted-foreground group-hover:text-primary transition-colors duration-200 rtl:rotate-180"
                />
              </div>
              <h3 className="text-lg font-bold text-foreground font-primary mt-6">
                {section.label[lang]}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 font-primary flex-1 leading-relaxed">
                {section.desc[lang]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
