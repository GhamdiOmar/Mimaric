"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import { usePermissions } from "../../../../../hooks/usePermissions";
import * as React from "react";
import { useParams } from "next/navigation";
import { RiyalIcon } from "@repo/ui";
import {
  Clock,
  CheckCircle,
  XCircle,
  PaperPlaneTilt,
  PencilSimple,
  DownloadSimple,
  ShareNetwork,
  ShieldCheck,
  Buildings,
  User,
  CaretLeft,
  Spinner,
  Warning,
  CalendarBlank,
  CurrencyCircleDollar,
  ArrowsClockwise,
  Wrench,
  Bell,
  FileText,
  Truck,
  Certificate,
  Vault,
  Trash,
} from "@phosphor-icons/react";
import { Button, Badge, SARAmount, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
import Link from "next/link";
import { getContract, updateContractStatus, deleteContract } from "../../../../actions/contracts";
import { useRouter } from "next/navigation";
import { formatDualDate } from "../../../../../lib/hijri";
import { MimaricLogo } from "../../../../../components/brand/MimaricLogo";

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["SIGNED", "CANCELLED"],
  SIGNED: ["VOID"],
  CANCELLED: [],
  VOID: [],
};

const transitionLabels: Record<string, { ar: string; en: string; icon: any }> = {
  SENT: { ar: "إرسال للعميل", en: "Send to Client", icon: PaperPlaneTilt },
  SIGNED: { ar: "توقيع المستند", en: "Sign Document", icon: PencilSimple },
  CANCELLED: { ar: "إلغاء العقد", en: "Cancel Contract", icon: XCircle },
  VOID: { ar: "إبطال العقد", en: "Void Contract", icon: XCircle },
};

const frequencyLabels: Record<string, { ar: string; en: string }> = {
  MONTHLY: { ar: "شهري", en: "Monthly" },
  QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
  SEMI_ANNUAL: { ar: "نصف سنوي", en: "Semi-Annual" },
  ANNUAL: { ar: "سنوي", en: "Annual" },
};

const maintenanceLabels: Record<string, { ar: string; en: string }> = {
  LANDLORD: { ar: "المؤجر", en: "Landlord" },
  TENANT: { ar: "المستأجر", en: "Tenant" },
};

const installmentStatusConfig: Record<string, { label: { ar: string; en: string }; variant: string }> = {
  UNPAID: { label: { ar: "غير مدفوع", en: "Unpaid" }, variant: "reserved" },
  PAID: { label: { ar: "مدفوع", en: "Paid" }, variant: "available" },
  OVERDUE: { label: { ar: "متأخر", en: "Overdue" }, variant: "sold" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

export default function ContractDetailPage() {
  const { lang } = useLanguage();
  const { can } = usePermissions();
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [contract, setContract] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadContract();
  }, [contractId]);

  async function loadContract() {
    setLoading(true);
    setError(null);
    try {
      const data = await getContract(contractId);
      setContract(data);
    } catch (err: any) {
      setError(err.message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!confirm(lang === "ar"
      ? `هل أنت متأكد من تغيير حالة العقد إلى "${(statusConfig[newStatus]?.label || {})[lang] || newStatus}"؟`
      : `Are you sure you want to change contract status to "${(statusConfig[newStatus]?.label || {})[lang] || newStatus}"?`
    )) return;

    setUpdating(true);
    try {
      await updateContractStatus(contractId, newStatus as any);
      await loadContract();
    } catch (err: any) {
      alert(lang === "ar" ? `فشل التحديث: ${err.message}` : `Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(lang === "ar"
      ? "هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء."
      : "Are you sure you want to delete this contract? This action cannot be undone."
    )) return;

    setUpdating(true);
    try {
      await deleteContract(contractId);
      router.push("/dashboard/sales/contracts");
    } catch (err: any) {
      alert(lang === "ar" ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`);
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <Warning size={48} className="text-neutral" />
        <p className="text-primary font-bold">{lang === "ar" ? "لم يتم العثور على العقد" : "Contract not found"}</p>
        <Link href="/dashboard/sales/contracts">
          <Button variant="secondary" size="sm">{lang === "ar" ? "العودة للعقود" : "Back to Contracts"}</Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[contract.status] ?? statusConfig.DRAFT!;
  const StatusIcon = config!.icon;
  const typeLabel = typeLabels[contract.type] || { ar: contract.type, en: contract.type };
  const nextStatuses = VALID_TRANSITIONS[contract.status] || [];

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral">
          <Link href="/dashboard/sales/contracts" className="hover:text-primary transition-colors">
            {lang === "ar" ? "العقود" : "Contracts"}
          </Link>
          <span className="text-border">/</span>
          <span className="text-primary truncate max-w-[200px]">
            {contract.contractNumber || `${contract.type}-${new Date(contract.createdAt).getFullYear()}-${contract.id.slice(-4).toUpperCase()}`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextStatuses.map((s) => {
            const tl = transitionLabels[s];
            if (!tl) return null;
            const Icon = tl.icon;
            const isDestructive = s === "CANCELLED" || s === "VOID";
            // Destructive actions require contracts:delete, others require contracts:write
            const requiredPerm = isDestructive ? "contracts:delete" : "contracts:write";
            if (!can(requiredPerm)) return null;
            return (
              <Button
                key={s}
                size="sm"
                variant={isDestructive ? "secondary" : "primary"}
                className={`gap-2 ${isDestructive ? "hover:text-red-500 hover:border-red-500/50" : ""}`}
                onClick={() => handleStatusChange(s)}
                disabled={updating}
              >
                {updating ? <Spinner className="h-4 w-4 animate-spin" /> : <Icon size={16} />}
                {tl[lang]}
              </Button>
            );
          })}
          {contract.status === "SIGNED" && (
            <Link href={`/dashboard/sales/contracts/${contract.id}/payment-plan`}>
              <Button size="sm" variant="secondary" className="gap-2" style={{ display: "inline-flex" }}>
                <CurrencyCircleDollar size={16} />
                {lang === "ar" ? "خطة الدفع" : "Payment Plan"}
              </Button>
            </Link>
          )}
          {can("contracts:delete") && contract.status === "DRAFT" && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-2 hover:text-red-500 hover:border-red-500/50"
              onClick={handleDelete}
              disabled={updating}
            >
              {updating ? <Spinner className="h-4 w-4 animate-spin" /> : <Trash size={16} />}
              {lang === "ar" ? "حذف العقد" : "Delete Contract"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Document Viewer */}
        <div className="xl:col-span-3">
          <div className="bg-card rounded-md shadow-card border border-border min-h-[800px] p-12 md:p-20 overflow-hidden relative" dir={lang === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
              <div className="flex items-center gap-3">
                <MimaricLogo width={100} />
                <div>
                  <h1 className="text-lg font-bold text-primary tracking-tight">Mimaric PropTech</h1>
                  <p className="text-[10px] text-neutral font-dm-sans leading-none uppercase mt-1">Real Estate Development & Solution</p>
                </div>
              </div>
              <div className="text-end">
                <h2 className="text-xl font-bold text-primary">
                  {contract.type === "SALE"
                    ? (lang === "ar" ? "عقد بيع وحدة عقارية" : "Sales Purchase Agreement")
                    : (lang === "ar" ? "عقد إيجار وحدة عقارية" : "Lease Agreement")}
                </h2>
                <p className="text-xs text-neutral mt-1">
                  Ref: {contract.contractNumber || `${contract.type}-${new Date(contract.createdAt).getFullYear()}-${contract.id.slice(-4).toUpperCase()}`}
                </p>
              </div>
            </div>

            {/* Contract Body */}
            <div className="space-y-10 text-sm leading-relaxed text-primary">
              {/* Parties */}
              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                  {lang === "ar" ? "1. أطراف العقد" : "1. Parties to the Agreement"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
                  <div className="space-y-2 p-4 bg-muted/20 rounded border border-muted border-dashed">
                    <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">
                      {contract.type === "LEASE"
                        ? (lang === "ar" ? "الطرف الأول (المؤجر)" : "First Party (Lessor)")
                        : (lang === "ar" ? "الطرف الأول (البائع)" : "First Party (Seller)")}
                    </p>
                    <p className="font-bold">
                      {contract.unit?.building?.project?.name || (lang === "ar" ? "المالك" : "Owner")}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 bg-muted/20 rounded border border-muted border-dashed">
                    <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">
                      {contract.type === "LEASE"
                        ? (lang === "ar" ? "الطرف الثاني (المستأجر)" : "Second Party (Lessee)")
                        : (lang === "ar" ? "الطرف الثاني (المشتري)" : "Second Party (Buyer)")}
                    </p>
                    <p className="font-bold">{contract.customer?.name}</p>
                  </div>
                </div>
              </section>

              {/* Subject */}
              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                  {lang === "ar" ? "2. موضوع التعاقد" : "2. Subject of Agreement"}
                </h3>
                <div className="p-4 bg-muted/20 rounded border border-muted border-dashed space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral">{lang === "ar" ? "الوحدة" : "Unit"}</span>
                    <span className="font-bold">{contract.unit?.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">{lang === "ar" ? "المبنى" : "Building"}</span>
                    <span className="font-bold">{contract.unit?.building?.name}</span>
                  </div>
                  {contract.unit?.area && (
                    <div className="flex justify-between">
                      <span className="text-neutral">{lang === "ar" ? "المساحة" : "Area"}</span>
                      <span className="font-bold">{contract.unit.area} {lang === "ar" ? "م²" : "m²"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral">{lang === "ar" ? "نوع العقد" : "Contract Type"}</span>
                    <Badge variant="draft" className="text-xs">{typeLabel[lang]}</Badge>
                  </div>
                </div>
              </section>

              {/* Financial */}
              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                  {lang === "ar" ? "3. القيمة المالية" : "3. Financial Value"}
                </h3>
                <div className="p-4 bg-muted/20 rounded border border-muted border-dashed">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral font-bold">{lang === "ar" ? "إجمالي قيمة العقد" : "Total Contract Value"}</span>
                    <span className="text-xl font-bold text-secondary flex items-center gap-1">
                      {fmt(Number(contract.amount))} <RiyalIcon size={16} />
                    </span>
                  </div>
                </div>
              </section>

              {/* Lease Terms (LEASE only) */}
              {contract.type === "LEASE" && (
                <section>
                  <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                    {lang === "ar" ? "4. شروط الإيجار (إيجار)" : "4. Lease Terms (Ejar)"}
                  </h3>
                  <div className="p-4 bg-muted/20 rounded border border-muted border-dashed space-y-2">
                    {contract.lease?.startDate && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "فترة الإيجار" : "Lease Period"}</span>
                        <span className="font-bold">
                          {formatDualDate(contract.lease.startDate, lang)} — {formatDualDate(contract.lease.endDate, lang)}
                        </span>
                      </div>
                    )}
                    {contract.paymentFrequency && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "دورية الدفع" : "Payment Frequency"}</span>
                        <span className="font-bold">{(frequencyLabels[contract.paymentFrequency] || { ar: contract.paymentFrequency, en: contract.paymentFrequency })[lang]}</span>
                      </div>
                    )}
                    {contract.securityDeposit != null && Number(contract.securityDeposit) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "مبلغ الضمان" : "Security Deposit"}</span>
                        <span className="font-bold flex items-center gap-1">{fmt(Number(contract.securityDeposit))} <RiyalIcon size={12} /></span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral">{lang === "ar" ? "التجديد التلقائي" : "Auto-Renewal"}</span>
                      <span className="font-bold">{contract.autoRenewal ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")}</span>
                    </div>
                    {contract.maintenanceResponsibility && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "مسؤولية الصيانة" : "Maintenance"}</span>
                        <span className="font-bold">{(maintenanceLabels[contract.maintenanceResponsibility] || { ar: contract.maintenanceResponsibility, en: contract.maintenanceResponsibility })[lang]}</span>
                      </div>
                    )}
                    {contract.noticePeriodDays != null && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "فترة الإشعار" : "Notice Period"}</span>
                        <span className="font-bold">{contract.noticePeriodDays} {lang === "ar" ? "يوم" : "days"}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Sale Terms (SALE only) */}
              {contract.type === "SALE" && (contract.deliveryDate || contract.wafiLicenseRef || contract.escrowAccountRef) && (
                <section>
                  <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                    {lang === "ar" ? "4. شروط البيع (وافي)" : "4. Sale Terms (Wafi)"}
                  </h3>
                  <div className="p-4 bg-muted/20 rounded border border-muted border-dashed space-y-2">
                    {contract.deliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "تاريخ التسليم" : "Delivery Date"}</span>
                        <span className="font-bold">{formatDualDate(contract.deliveryDate, lang)}</span>
                      </div>
                    )}
                    {contract.wafiLicenseRef && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "رخصة وافي" : "Wafi License"}</span>
                        <span className="font-bold">{contract.wafiLicenseRef}</span>
                      </div>
                    )}
                    {contract.escrowAccountRef && (
                      <div className="flex justify-between">
                        <span className="text-neutral">{lang === "ar" ? "حساب الضمان" : "Escrow Account"}</span>
                        <span className="font-bold">{contract.escrowAccountRef}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Payment Schedule (LEASE with installments) */}
              {contract.type === "LEASE" && contract.lease?.installments?.length > 0 && (
                <section>
                  <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                    {lang === "ar" ? "5. جدول الدفعات" : "5. Payment Schedule"}
                  </h3>
                  <div className="rounded border border-muted overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">{lang === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</TableHead>
                          <TableHead className="text-xs">{lang === "ar" ? "المبلغ" : "Amount"}</TableHead>
                          <TableHead className="text-xs">{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.lease.installments.map((inst: any, idx: number) => {
                          const instConfig = installmentStatusConfig[inst.status] ?? installmentStatusConfig.UNPAID!;
                          return (
                            <TableRow key={inst.id}>
                              <TableCell className="text-xs font-bold text-neutral">{idx + 1}</TableCell>
                              <TableCell className="text-xs">{formatDualDate(inst.dueDate, lang)}</TableCell>
                              <TableCell><SARAmount value={Number(inst.amount)} size={11} /></TableCell>
                              <TableCell>
                                <Badge variant={instConfig!.variant as any} className="text-[10px]">
                                  {instConfig!.label[lang]}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              {/* Notes */}
              {contract.notes && (
                <section>
                  <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">
                    {lang === "ar" ? (contract.type === "LEASE" ? "6. ملاحظات" : "5. ملاحظات") : (contract.type === "LEASE" ? "6. Notes" : "5. Notes")}
                  </h3>
                  <div className="p-4 bg-muted/20 rounded border border-muted border-dashed">
                    <p className="whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                </section>
              )}

              {/* Watermark for non-signed */}
              {contract.status !== "SIGNED" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none">
                  <span className="text-primary font-black text-9xl">{contract.status}</span>
                </div>
              )}
            </div>

            {/* Signature section */}
            <div className="mt-24 pt-12 border-t-2 border-primary/5 flex justify-between items-center px-8">
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-neutral uppercase">
                  {lang === "ar" ? "توقيع البائع" : "Seller Signature"}
                </p>
                <div className="h-16 w-32 border-b-2 border-primary/20 flex items-center justify-center italic text-primary/50 text-base font-dm-sans">
                  {contract.status === "SIGNED" ? "Mimaric" : "—"}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-neutral uppercase">
                  {lang === "ar" ? "توقيع المشتري" : "Buyer Signature"}
                </p>
                <div className={`h-16 w-48 border-b-2 border-primary/20 flex items-center justify-center transition-all ${
                  contract.status === "SIGNED" ? "text-secondary text-xl font-bold" : "text-muted-foreground/30 text-xs"
                }`}>
                  {contract.status === "SIGNED"
                    ? contract.customer?.name
                    : (lang === "ar" ? "بانتظار التوقيع" : "Awaiting signature")}
                </div>
                {contract.signedAt && (
                  <span className="text-[10px] text-secondary">
                    {lang === "ar" ? "تم التوقيع:" : "Signed:"} {formatDualDate(contract.signedAt, lang)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Status Card */}
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">
              {lang === "ar" ? "حالة المستند" : "Document Status"}
            </h3>
            <Badge variant={config!.variant as any} className="px-3 py-1 text-xs gap-1 mb-4">
              <StatusIcon size={14} />
              {config!.label[lang]}
            </Badge>

            <div className="space-y-3 mt-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">{lang === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                  <p className="text-[10px] text-neutral mt-0.5">{formatDualDate(contract.createdAt, lang)}</p>
                </div>
              </div>
              {contract.signedAt && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <ShieldCheck size={18} weight="fill" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">{lang === "ar" ? "تاريخ التوقيع" : "Signed"}</p>
                    <p className="text-[10px] text-neutral mt-0.5">{formatDualDate(contract.signedAt, lang)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Entities */}
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">
              {lang === "ar" ? "البيانات المرتبطة" : "Related Entities"}
            </h3>
            <div className="space-y-3">
              <Link href="/dashboard/units" className="flex items-center justify-between p-3 rounded bg-muted/30 group hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Buildings size={18} className="text-neutral group-hover:text-primary" />
                  <div>
                    <span className="text-xs font-bold text-primary">{contract.unit?.number}</span>
                    <p className="text-[10px] text-neutral">{contract.unit?.building?.name}</p>
                  </div>
                </div>
                <CaretLeft size={14} className="text-neutral group-hover:text-primary icon-directional" />
              </Link>
              <Link href="/dashboard/sales/customers" className="flex items-center justify-between p-3 rounded bg-muted/30 group hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-neutral group-hover:text-primary" />
                  <span className="text-xs font-bold text-primary">{contract.customer?.name}</span>
                </div>
                <CaretLeft size={14} className="text-neutral group-hover:text-primary icon-directional" />
              </Link>
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">
              {lang === "ar" ? "بيانات العقد" : "Contract Info"}
            </h3>
            <div className="space-y-3">
              {contract.contractNumber && (
                <div>
                  <p className="text-[10px] text-neutral">{lang === "ar" ? "رقم العقد" : "Contract No."}</p>
                  <p className="text-sm font-bold text-primary font-dm-sans">{contract.contractNumber}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-neutral">{lang === "ar" ? "قيمة العقد" : "Contract Value"}</p>
                <SARAmount value={Number(contract.amount)} size={18} className="font-bold" />
              </div>
              {contract.type === "LEASE" && (
                <div>
                  <p className="text-[10px] text-neutral">{lang === "ar" ? "معرف إيجار" : "Ejar ID"}</p>
                  <p className="text-sm text-neutral italic">{lang === "ar" ? "بانتظار التسجيل" : "Pending registration"}</p>
                </div>
              )}
              {contract.type === "SALE" && contract.wafiLicenseRef && (
                <div>
                  <p className="text-[10px] text-neutral">{lang === "ar" ? "رخصة وافي" : "Wafi License"}</p>
                  <p className="text-sm font-bold text-primary font-dm-sans">{contract.wafiLicenseRef}</p>
                </div>
              )}
              {contract.type === "SALE" && contract.escrowAccountRef && (
                <div>
                  <p className="text-[10px] text-neutral">{lang === "ar" ? "حساب الضمان" : "Escrow Ref"}</p>
                  <p className="text-sm font-bold text-primary font-dm-sans">{contract.escrowAccountRef}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
