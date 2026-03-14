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
  Plus,
  X,
} from "@phosphor-icons/react";
import {
  SARAmount,
  RiyalIcon,
  Button,
  Badge,
  Card,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
import Link from "next/link";
import { getContracts, createContract } from "../../../actions/contracts";
import { getCustomers } from "../../../actions/customers";
import { getUnitsWithBuildings } from "../../../actions/units";
import { formatDualDate } from "../../../../lib/hijri";
import { usePermissions } from "../../../../hooks/usePermissions";

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

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

export default function ContractsPage() {
  const { lang } = useLanguage();
  const { can } = usePermissions();
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("");

  // Create contract dialog state
  const [showCreate, setShowCreate] = React.useState(false);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [newContract, setNewContract] = React.useState({
    customerId: "",
    unitId: "",
    type: "SALE" as "SALE" | "LEASE",
    amount: "",
    // Ejar (LEASE)
    startDate: "",
    endDate: "",
    paymentFrequency: "MONTHLY",
    securityDeposit: "",
    autoRenewal: true,
    maintenanceResponsibility: "LANDLORD",
    noticePeriodDays: "60",
    // Wafi (SALE)
    deliveryDate: "",
    wafiLicenseRef: "",
    // Shared
    notes: "",
  });

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

  async function openCreateDialog() {
    setShowCreate(true);
    try {
      const [c, u] = await Promise.all([getCustomers(), getUnitsWithBuildings()]);
      setCustomers(c);
      setUnits(u);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  async function handleCreate() {
    if (!newContract.customerId || !newContract.unitId || !newContract.amount) return;
    setCreating(true);
    try {
      await createContract({
        customerId: newContract.customerId,
        unitId: newContract.unitId,
        type: newContract.type,
        amount: parseFloat(newContract.amount),
        // Ejar fields
        ...(newContract.type === "LEASE" ? {
          startDate: newContract.startDate || undefined,
          endDate: newContract.endDate || undefined,
          paymentFrequency: newContract.paymentFrequency || undefined,
          securityDeposit: newContract.securityDeposit ? parseFloat(newContract.securityDeposit) : undefined,
          autoRenewal: newContract.autoRenewal,
          maintenanceResponsibility: newContract.maintenanceResponsibility || undefined,
          noticePeriodDays: newContract.noticePeriodDays ? parseInt(newContract.noticePeriodDays) : undefined,
        } : {}),
        // Wafi fields
        ...(newContract.type === "SALE" ? {
          deliveryDate: newContract.deliveryDate || undefined,
          wafiLicenseRef: newContract.wafiLicenseRef || undefined,
        } : {}),
        notes: newContract.notes || undefined,
      });
      setShowCreate(false);
      setNewContract({ customerId: "", unitId: "", type: "SALE", amount: "", startDate: "", endDate: "", paymentFrequency: "MONTHLY", securityDeposit: "", autoRenewal: true, maintenanceResponsibility: "LANDLORD", noticePeriodDays: "60", deliveryDate: "", wafiLicenseRef: "", notes: "" });
      loadContracts();
    } catch (err: any) {
      alert(lang === "ar" ? `فشل إنشاء العقد: ${err.message}` : `Failed to create contract: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  // Auto-fill amount when unit is selected
  const selectedUnit = units.find((u: any) => u.id === newContract.unitId);
  React.useEffect(() => {
    if (selectedUnit) {
      const price = selectedUnit.markupPrice ?? selectedUnit.price;
      if (price) setNewContract((prev) => ({ ...prev, amount: String(Number(price)) }));
    }
  }, [newContract.unitId]);

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
        {can("contracts:write") && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus size={16} weight="bold" />
            {lang === "ar" ? "عقد جديد" : "New Contract"}
          </Button>
        )}
      </div>

      {/* Create Contract Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-primary">{lang === "ar" ? "إنشاء عقد جديد" : "Create New Contract"}</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)} className="h-8 w-8 p-0 text-neutral hover:text-primary"><X size={20} /></Button>
            </div>

            <div className="space-y-4">
              {/* Contract Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "نوع العقد" : "Contract Type"}</label>
                <select
                  value={newContract.type}
                  onChange={(e) => setNewContract({ ...newContract, type: e.target.value as any })}
                  className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                >
                  <option value="SALE">{lang === "ar" ? "بيع" : "Sale"}</option>
                  <option value="LEASE">{lang === "ar" ? "إيجار" : "Lease"}</option>
                </select>
              </div>

              {/* Customer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "العميل" : "Customer"}</label>
                <select
                  value={newContract.customerId}
                  onChange={(e) => setNewContract({ ...newContract, customerId: e.target.value })}
                  className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                >
                  <option value="">{lang === "ar" ? "— اختر العميل —" : "— Select Customer —"}</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الوحدة" : "Unit"}</label>
                <select
                  value={newContract.unitId}
                  onChange={(e) => setNewContract({ ...newContract, unitId: e.target.value })}
                  className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none"
                >
                  <option value="">{lang === "ar" ? "— اختر الوحدة —" : "— Select Unit —"}</option>
                  {units.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.number} — {u.building?.name} ({u.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المبلغ (ر.س)" : "Amount (SAR)"}</label>
                <Input
                  type="number"
                  value={newContract.amount}
                  onChange={(e) => setNewContract({ ...newContract, amount: e.target.value })}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>

              {/* Ejar fields (LEASE) */}
              {newContract.type === "LEASE" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                      <Input type="date" value={newContract.startDate} onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                      <Input type="date" value={newContract.endDate} onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })} className="h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "دورية الدفع" : "Payment Frequency"}</label>
                      <select value={newContract.paymentFrequency} onChange={(e) => setNewContract({ ...newContract, paymentFrequency: e.target.value })} className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none">
                        <option value="MONTHLY">{lang === "ar" ? "شهري" : "Monthly"}</option>
                        <option value="QUARTERLY">{lang === "ar" ? "ربع سنوي" : "Quarterly"}</option>
                        <option value="SEMI_ANNUAL">{lang === "ar" ? "نصف سنوي" : "Semi-Annual"}</option>
                        <option value="ANNUAL">{lang === "ar" ? "سنوي" : "Annual"}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "مبلغ الضمان (ر.س)" : "Security Deposit (SAR)"}</label>
                      <Input type="number" value={newContract.securityDeposit} onChange={(e) => setNewContract({ ...newContract, securityDeposit: e.target.value })} placeholder={lang === "ar" ? "حد أقصى 5%" : "Max 5%"} className="h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "التجديد التلقائي" : "Auto-Renewal"}</label>
                      <select value={newContract.autoRenewal ? "true" : "false"} onChange={(e) => setNewContract({ ...newContract, autoRenewal: e.target.value === "true" })} className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none">
                        <option value="true">{lang === "ar" ? "نعم" : "Yes"}</option>
                        <option value="false">{lang === "ar" ? "لا" : "No"}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "مسؤولية الصيانة" : "Maintenance"}</label>
                      <select value={newContract.maintenanceResponsibility} onChange={(e) => setNewContract({ ...newContract, maintenanceResponsibility: e.target.value })} className="w-full h-11 px-4 bg-muted/20 border border-muted rounded-sm text-sm outline-none">
                        <option value="LANDLORD">{lang === "ar" ? "المؤجر" : "Landlord"}</option>
                        <option value="TENANT">{lang === "ar" ? "المستأجر" : "Tenant"}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Wafi fields (SALE) */}
              {newContract.type === "SALE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "تاريخ التسليم" : "Delivery Date"}</label>
                    <Input type="date" value={newContract.deliveryDate} onChange={(e) => setNewContract({ ...newContract, deliveryDate: e.target.value })} className="h-11" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رخصة وافي" : "Wafi License"}</label>
                    <Input type="text" value={newContract.wafiLicenseRef} onChange={(e) => setNewContract({ ...newContract, wafiLicenseRef: e.target.value })} placeholder={lang === "ar" ? "اختياري" : "Optional"} className="h-11" />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
                <textarea value={newContract.notes} onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })} rows={2} className="w-full px-4 py-2 bg-muted/20 border border-muted rounded-sm text-sm outline-none resize-none" placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."} />
              </div>

              {/* Selected unit summary */}
              {selectedUnit && (
                <div className="p-3 rounded-md bg-secondary/5 border border-secondary/20 text-sm">
                  <span className="text-neutral">{lang === "ar" ? "الوحدة:" : "Unit:"}</span>{" "}
                  <span className="font-bold text-primary">{selectedUnit.number}</span>
                  {" — "}
                  <span className="text-neutral">{selectedUnit.building?.name}</span>
                  {selectedUnit.markupPrice || selectedUnit.price ? (
                    <span className="text-secondary font-bold mx-2">
                      {fmt(Number(selectedUnit.markupPrice ?? selectedUnit.price))} <RiyalIcon size={10} className="inline" />
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newContract.customerId || !newContract.unitId || !newContract.amount}
                className="gap-2"
              >
                {creating && <Spinner className="h-4 w-4 animate-spin" />}
                {lang === "ar" ? "إنشاء العقد" : "Create Contract"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                        <p className="font-bold text-primary text-sm">{contract.customer?.name}</p>
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
