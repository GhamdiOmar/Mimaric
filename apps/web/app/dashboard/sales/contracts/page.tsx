"use client";

import * as React from "react";
import {
  Receipt,
  Clock,
  Send,
  Check,
  X,
  Building2,
  User,
  Eye,
  Plus,
  Loader2,
  Download,
} from "lucide-react";
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
  PageIntro,
  FilterBar,
  StatusBadge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@repo/ui";
import Link from "next/link";
import { useLanguage } from "../../../../components/LanguageProvider";
import { getContracts, createContract } from "../../../actions/contracts";
import { getCustomers } from "../../../actions/customers";
import { getUnitsWithBuildings } from "../../../actions/units";
import { formatDualDate } from "../../../../lib/hijri";
import { usePermissions } from "../../../../hooks/usePermissions";

const statusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SENT: { ar: "مُرسل", en: "Sent" },
  SIGNED: { ar: "موقّع", en: "Signed" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
  VOID: { ar: "لاغٍ", en: "Void" },
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

  const filterOptions = [
    { value: "", label: lang === "ar" ? "الكل" : "All" },
    { value: "DRAFT", label: lang === "ar" ? "مسودة" : "Draft" },
    { value: "SENT", label: lang === "ar" ? "مُرسل" : "Sent" },
    { value: "SIGNED", label: lang === "ar" ? "موقّع" : "Signed" },
    { value: "CANCELLED", label: lang === "ar" ? "ملغي" : "Cancelled" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageIntro
        title={lang === "ar" ? "العقود" : "Contracts"}
        description={lang === "ar" ? "إدارة العقود والمتابعة من المسودة إلى التنفيذ والتسليم" : "Manage contracts from draft through execution and handover"}
        actions={
          <>
            {can("contracts:write") && (
              <Button onClick={openCreateDialog} className="gap-2" style={{ display: "inline-flex" }}>
                <Plus className="h-4 w-4" />
                {lang === "ar" ? "عقد جديد" : "New Contract"}
              </Button>
            )}
            <Button variant="outline" className="gap-2" style={{ display: "inline-flex" }}>
              <Download className="h-4 w-4" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {/* Create Contract Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إنشاء عقد جديد" : "Create New Contract"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "أدخل تفاصيل العقد الجديد" : "Enter the details for the new contract"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Contract Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "نوع العقد" : "Contract Type"}</label>
              <select
                value={newContract.type}
                onChange={(e) => setNewContract({ ...newContract, type: e.target.value as any })}
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
              >
                <option value="SALE">{lang === "ar" ? "بيع" : "Sale"}</option>
                <option value="LEASE">{lang === "ar" ? "إيجار" : "Lease"}</option>
              </select>
            </div>

            {/* Customer */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "العميل" : "Customer"}</label>
              <select
                value={newContract.customerId}
                onChange={(e) => setNewContract({ ...newContract, customerId: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
              >
                <option value="">{lang === "ar" ? "-- اختر العميل --" : "-- Select Customer --"}</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "الوحدة" : "Unit"}</label>
              <select
                value={newContract.unitId}
                onChange={(e) => setNewContract({ ...newContract, unitId: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
              >
                <option value="">{lang === "ar" ? "-- اختر الوحدة --" : "-- Select Unit --"}</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.number} — {u.building?.name} ({u.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "المبلغ (ر.س)" : "Amount (SAR)"}</label>
              <Input
                type="number"
                value={newContract.amount}
                onChange={(e) => setNewContract({ ...newContract, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* Ejar fields (LEASE) */}
            {newContract.type === "LEASE" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                    <Input type="date" value={newContract.startDate} onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                    <Input type="date" value={newContract.endDate} onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "دورية الدفع" : "Payment Frequency"}</label>
                    <select value={newContract.paymentFrequency} onChange={(e) => setNewContract({ ...newContract, paymentFrequency: e.target.value })} className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
                      <option value="MONTHLY">{lang === "ar" ? "شهري" : "Monthly"}</option>
                      <option value="QUARTERLY">{lang === "ar" ? "ربع سنوي" : "Quarterly"}</option>
                      <option value="SEMI_ANNUAL">{lang === "ar" ? "نصف سنوي" : "Semi-Annual"}</option>
                      <option value="ANNUAL">{lang === "ar" ? "سنوي" : "Annual"}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "مبلغ الضمان (ر.س)" : "Security Deposit (SAR)"}</label>
                    <Input type="number" value={newContract.securityDeposit} onChange={(e) => setNewContract({ ...newContract, securityDeposit: e.target.value })} placeholder={lang === "ar" ? "حد أقصى 5%" : "Max 5%"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "التجديد التلقائي" : "Auto-Renewal"}</label>
                    <select value={newContract.autoRenewal ? "true" : "false"} onChange={(e) => setNewContract({ ...newContract, autoRenewal: e.target.value === "true" })} className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
                      <option value="true">{lang === "ar" ? "نعم" : "Yes"}</option>
                      <option value="false">{lang === "ar" ? "لا" : "No"}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{lang === "ar" ? "مسؤولية الصيانة" : "Maintenance"}</label>
                    <select value={newContract.maintenanceResponsibility} onChange={(e) => setNewContract({ ...newContract, maintenanceResponsibility: e.target.value })} className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{lang === "ar" ? "تاريخ التسليم" : "Delivery Date"}</label>
                  <Input type="date" value={newContract.deliveryDate} onChange={(e) => setNewContract({ ...newContract, deliveryDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{lang === "ar" ? "رخصة وافي" : "Wafi License"}</label>
                  <Input type="text" value={newContract.wafiLicenseRef} onChange={(e) => setNewContract({ ...newContract, wafiLicenseRef: e.target.value })} placeholder={lang === "ar" ? "اختياري" : "Optional"} />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "ملاحظات" : "Notes"}</label>
              <textarea value={newContract.notes} onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors" placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."} />
            </div>

            {/* Selected unit summary */}
            {selectedUnit && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                <span className="text-muted-foreground">{lang === "ar" ? "الوحدة:" : "Unit:"}</span>{" "}
                <span className="font-semibold text-foreground">{selectedUnit.number}</span>
                {" — "}
                <span className="text-muted-foreground">{selectedUnit.building?.name}</span>
                {(selectedUnit.markupPrice || selectedUnit.price) && (
                  <span className="font-semibold text-primary mx-2">
                    {fmt(Number(selectedUnit.markupPrice ?? selectedUnit.price))} <RiyalIcon className="h-2.5 w-2.5 inline" />
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newContract.customerId || !newContract.unitId || !newContract.amount}
              className="gap-2"
              style={{ display: "inline-flex" }}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "ar" ? "إنشاء العقد" : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <FilterBar
        filters={filterOptions}
        activeFilter={filter}
        onFilterChange={(value) => setFilter(value)}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contracts.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            {lang === "ar" ? "لا توجد عقود" : "No Contracts"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "لم يتم إنشاء أي عقود بعد" : "No contracts have been created yet"}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "العميل" : "Customer"}</TableHead>
                <TableHead>{lang === "ar" ? "الوحدة" : "Unit"}</TableHead>
                <TableHead>{lang === "ar" ? "النوع" : "Type"}</TableHead>
                <TableHead>{lang === "ar" ? "المبلغ" : "Amount"}</TableHead>
                <TableHead>{lang === "ar" ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "عرض" : "View"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract: any) => {
                const typeLabel = typeLabels[contract.type] || { ar: contract.type, en: contract.type };
                const statusLabel = statusLabels[contract.status];

                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xs">
                          {contract.customer?.name?.charAt(0) || <User className="h-3.5 w-3.5" />}
                        </div>
                        <p className="font-medium text-foreground text-sm">{contract.customer?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{contract.unit?.number || "—"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{contract.unit?.building?.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={"draft" as any} className="text-xs">
                        {typeLabel[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SARAmount value={Number(contract.amount)} size={12} className="font-semibold" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDualDate(contract.createdAt, lang)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        entityType="contract"
                        status={contract.status}
                        label={statusLabel ? statusLabel[lang] : undefined}
                        className="text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sales/contracts/${contract.id}`}>
                        <Button size="sm" variant="secondary" className="text-xs h-7 px-2 gap-1" style={{ display: "inline-flex" }}>
                          <Eye className="h-3.5 w-3.5" />
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
