"use client";

import * as React from "react";
import { Plus, FileText, UserPlus, Receipt } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import Link from "next/link";
import { useLanguage } from "../LanguageProvider";

const actions = [
  { label: { ar: "مشروع جديد", en: "New Project" }, icon: Plus, href: "/dashboard/projects/new", color: "text-primary bg-primary/10" },
  { label: { ar: "عقد جديد", en: "New Contract" }, icon: FileText, href: "/dashboard/sales/contracts", color: "text-secondary bg-secondary/10" },
  { label: { ar: "إضافة عميل", en: "Add Customer" }, icon: UserPlus, href: "/dashboard/sales/customers", color: "text-info bg-info/10" },
  { label: { ar: "إنشاء فاتورة", en: "Create Invoice" }, icon: Receipt, href: "/dashboard/finance", color: "text-amber-500 bg-amber-500/10" },
];

export function QuickActions() {
  const { lang } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{lang === "ar" ? "إجراءات سريعة" : "Quick Actions"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:bg-muted/30 hover:border-border"
            >
              <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", action.color)}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label[lang]}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
