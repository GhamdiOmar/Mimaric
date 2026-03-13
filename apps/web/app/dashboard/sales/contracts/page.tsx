"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
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
import {
  SARAmount,
  Button,
  Badge,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
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
  const { lang } = useLanguage();
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
        <Card className="p-12 text-center">
          <Receipt size={48} className="text-neutral mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد عقود" : "No Contracts"}
          </h3>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "لم يتم إنشاء أي عقود بعد" : "No contracts have been created yet"}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {lang === "ar" ? "العميل" : "Customer"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "الوحدة" : "Unit"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "النوع" : "Type"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "المبلغ" : "Amount"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "التاريخ" : "Date"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "الحالة" : "Status"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "عرض" : "View"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract: any) => {
                const config = (statusConfig as any)[contract.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;
                const typeLabel = typeLabels[contract.type] || { ar: contract.type, en: contract.type };

                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs">
                          {contract.customer?.name?.charAt(0) || <User size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{contract.customer?.name}</p>
                          <p className="text-xs text-neutral" dir="ltr">{contract.customer?.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Buildings size={14} className="text-neutral" />
                        <span className="text-sm">{contract.unit?.number || "—"}</span>
                      </div>
                      <p className="text-xs text-neutral">{contract.unit?.building?.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={"draft" as any} className="text-xs">
                        {typeLabel[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SARAmount value={Number(contract.amount)} size={12} className="font-bold" />
                    </TableCell>
                    <TableCell className="text-xs text-neutral">
                      {formatDualDate(contract.createdAt, lang)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config!.variant as any} className="gap-1 text-xs">
                        <StatusIcon size={12} />
                        {config.label[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sales/contracts/${contract.id}`}>
                        <Button size="sm" variant="secondary" className="text-xs h-7 px-2 gap-1 hover:text-secondary hover:border-secondary/50">
                          <Eye size={14} />
                          {lang === "ar" ? "عرض" : "View"}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
