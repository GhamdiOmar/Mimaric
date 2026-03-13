"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  CurrencyCircleDollar,
  Clock,
  CheckCircle,
  Warning,
  IdentificationCard,
  Building,
  Spinner,
  Receipt,
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import {
  Button,
  Badge,
  SARAmount,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
import { getInstallments, recordPayment, markOverdueInstallments } from "../../../actions/installments";
import { formatDualDate } from "../../../../lib/hijri";

type Installment = {
  id: string;
  amount: number;
  dueDate: string | Date;
  status: string;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
  lease: {
    customer: { name: string; id: string };
    unit: { number: string; building: { name: string } };
  };
};

export default function RentCollectionPage() {
  const { lang } = useLanguage();
  const [installments, setInstallments] = React.useState<Installment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    try {
      await markOverdueInstallments().catch(() => {});
      const data = await getInstallments();
      setInstallments(data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const totalDue = installments.reduce((s, i) => s + Number(i.amount), 0);
  const collected = installments.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.amount), 0);
  const overdue = installments.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + Number(i.amount), 0);
  const pending = installments.filter((i) => i.status === "UNPAID").reduce((s, i) => s + Number(i.amount), 0);

  const handleRecordPayment = async (id: string) => {
    try {
      await recordPayment(id, { paymentMethod: "Bank Transfer" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "تحصيل الإيجارات" : "Rent Collection"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "متابعة دفعات المستأجرين، التحصيل المالي، والتدقيق المحاسبي." : "Monitor tenant payments, financial collection, and accounting audits."}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "إجمالي المستحق", en: "Total Due", value: totalDue, icon: CurrencyCircleDollar, color: "primary" },
          { label: "تم تحصيله", en: "Collected", value: collected, icon: CheckCircle, color: "secondary" },
          { label: "متأخرات", en: "Overdue", value: overdue, icon: Warning, color: "destructive" },
          { label: "قيد التحصيل", en: "Pending", value: pending, icon: Clock, color: "accent" },
        ].map((kpi, idx) => (
          <Card key={idx} className="p-6 group hover:shadow-raised transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? kpi.label : kpi.en}</span>
              <kpi.icon size={20} className={cn(
                kpi.color === "primary" ? "text-primary" :
                kpi.color === "secondary" ? "text-secondary" :
                kpi.color === "destructive" ? "text-destructive" : "text-accent"
              )} />
            </div>
            <h3 className="text-xl font-bold text-primary">
              {loading ? "—" : <SARAmount value={kpi.value} size={20} />}
            </h3>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin text-primary" />
          </div>
        ) : installments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral">
            <Receipt size={48} className="mb-4 text-muted" />
            <p className="text-sm font-primary">{lang === "ar" ? "لا توجد دفعات حالياً" : "No installments found"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "المستأجر" : "Tenant"}</TableHead>
                <TableHead>{lang === "ar" ? "الوحدة" : "Unit"}</TableHead>
                <TableHead>{lang === "ar" ? "المبلغ" : "Amount"}</TableHead>
                <TableHead>{lang === "ar" ? "الاستحقاق" : "Due Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-center">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                        <IdentificationCard size={18} />
                      </div>
                      <p className="text-sm font-bold text-primary">{p.lease.customer.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-neutral" />
                      <span className="text-xs font-semibold text-primary">{p.lease.unit.number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SARAmount value={Number(p.amount)} size={12} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-neutral font-dm-sans">
                      <Clock size={14} />
                      {formatDualDate(p.dueDate, lang)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      p.status === "PAID" ? "available" :
                      p.status === "OVERDUE" ? "overdue" :
                      "draft"
                    } className="text-[10px]">
                      {p.status === "PAID" ? (lang === "ar" ? "مدفوعة" : "Paid") :
                       p.status === "OVERDUE" ? (lang === "ar" ? "متأخرة" : "Overdue") :
                       (lang === "ar" ? "غير مدفوعة" : "Unpaid")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.status !== "PAID" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleRecordPayment(p.id)}
                      >
                        {lang === "ar" ? "تسجيل دفعة" : "Record Payment"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="p-4 bg-muted/10 border-t border-border flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral uppercase tracking-wider">
            {lang === "ar" ? `عرض ${installments.length} دفعة` : `Showing ${installments.length} payments`}
          </span>
        </div>
      </Card>
    </div>
  );
}
