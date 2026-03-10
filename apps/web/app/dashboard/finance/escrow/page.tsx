"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import { Bank, ArrowsClockwise, CaretLeft } from "@phosphor-icons/react";
import { Button, Badge, KPICard, EmptyState } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { useRouter } from "next/navigation";

export default function EscrowDashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/finance")}>
            <CaretLeft size={16} className="icon-directional" />
            {lang === "ar" ? "عودة للمالية" : "Back to Finance"}
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {lang === "ar" ? "لوحة حسابات الضمان" : "Escrow Dashboard"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={lang === "ar" ? "إجمالي حسابات الضمان" : "Total Escrow Accounts"} value="0" accentColor="primary" icon={<Bank size={20} />} />
        <KPICard label={lang === "ar" ? "إجمالي الأرصدة" : "Total Balance"} value="0 ر.س" accentColor="success" />
        <KPICard label={lang === "ar" ? "معاملات معلقة" : "Pending Transactions"} value="0" accentColor="warning" />
        <KPICard label={lang === "ar" ? "إجمالي الاحتفاظ" : "Total Retention"} value="0 ر.س" accentColor="info" />
      </div>

      <EmptyState
        icon={<Bank size={48} weight="duotone" />}
        title={lang === "ar" ? "لا توجد حسابات ضمان" : "No Escrow Accounts"}
        description={lang === "ar" ? "أنشئ حسابات ضمان من صفحات المشاريع الفردية" : "Create escrow accounts from individual project pages"}
      />
    </div>
  );
}
