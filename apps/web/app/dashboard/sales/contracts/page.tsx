"use client";

import * as React from "react";
import {
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  PaperPlaneTilt,
  Spinner,
  Buildings,
  User,
  Eye,
} from "@phosphor-icons/react";
import { SARAmount } from "@repo/ui";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
import { getContracts } from "../../../actions/contracts";
import { formatDualDate } from "../../../../lib/hijri";

const statusConfig: Record<string, { label: { ar: string; en: string }; variant: string; icon: any }> = {
  DRAFT: { label: { ar: "مسودة", en: "Draft" }, variant: "reserved", icon: Clock },
  SENT: { label: { ar: "مُرسل", en: "Sent" }, variant: "reserved", icon: PaperPlaneTilt },
  SIGNED: { label: { ar: "موقّع", en: "Signed" }, variant: "available", icon: CheckCircle },
  CANCELLED: { label: { ar: "ملغي", en: "Cancelled" }, variant: "sold", icon: XCircle },
  VOID: { label: { ar: "لاغٍ", en: "Void" }, variant: "sold", icon: XCircle },
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  SALE: { ar: "بيع", en: "Sale" },
  LEASE: { ar: "إيجار", en: "Lease" },
};

export default function ContractsPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("");

  React.useEffect(() => {
    loadContracts();
  }, [filter]);

  async function loadContracts() {
    setLoading(true);
    try {
      const filters: any = {};
      if (filter) filters.status = filter;
      const data = await getContracts(filters);
      setContracts(data);
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "العقود" : "Contracts"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "إدارة عقود البيع والإيجار" : "Manage sales and lease contracts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "", label: { ar: "الكل", en: "All" } },
          { value: "DRAFT", label: { ar: "مسودة", en: "Draft" } },
          { value: "SENT", label: { ar: "مُرسل", en: "Sent" } },
          { value: "SIGNED", label: { ar: "موقّع", en: "Signed" } },
          { value: "CANCELLED", label: { ar: "ملغي", en: "Cancelled" } },
        ].map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "primary" : "secondary"}
            className="text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label[lang]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="animate-spin text-primary" size={32} />
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-md shadow-card border border-border p-12 text-center">
          <Receipt size={48} className="text-neutral mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد عقود" : "No Contracts"}
          </h3>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "لم يتم إنشاء أي عقود بعد" : "No contracts have been created yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "العميل" : "Customer"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "الوحدة" : "Unit"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "النوع" : "Type"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "المبلغ" : "Amount"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "التاريخ" : "Date"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "عرض" : "View"}
                </th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract: any) => {
                const config = (statusConfig as any)[contract.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;
                const typeLabel = typeLabels[contract.type] || { ar: contract.type, en: contract.type };

                return (
                  <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs">
                          {contract.customer?.name?.charAt(0) || <User size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{contract.customer?.name}</p>
                          <p className="text-xs text-neutral" dir="ltr">{contract.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Buildings size={14} className="text-neutral" />
                        <span className="text-sm">{contract.unit?.number || "—"}</span>
                      </div>
                      <p className="text-xs text-neutral">{contract.unit?.building?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={"draft" as any} className="text-xs">
                        {typeLabel[lang]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <SARAmount value={Number(contract.amount)} size={12} className="font-bold" />
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral">
                      {formatDualDate(contract.createdAt, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={config!.variant as any} className="gap-1 text-xs">
                        <StatusIcon size={12} />
                        {config.label[lang]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/sales/contracts/${contract.id}`}>
                        <Button size="sm" variant="secondary" className="text-xs h-7 px-2 gap-1 hover:text-secondary hover:border-secondary/50">
                          <Eye size={14} />
                          {lang === "ar" ? "عرض" : "View"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
