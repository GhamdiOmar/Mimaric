"use client";

import * as React from "react";
import {
  Plus,
  Loader2,
  Search,
  X,
  FileText,
  Calendar,
} from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageIntro,
  KPICard,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui";
import { useLanguage } from "../../../components/LanguageProvider";
import { usePermissions } from "../../../hooks/usePermissions";
import { getContracts, createContract } from "../../actions/contracts";
import { getCustomers } from "../../actions/customers";
import { getUnitsWithBuildings } from "../../actions/units";
import { getReservationById } from "../../actions/reservations";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SAR = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

type Contract = {
  id: string;
  contractNumber: string | null;
  type: "SALE" | "LEASE";
  status: "DRAFT" | "SENT" | "SIGNED" | "CANCELLED" | "VOID";
  amount: number;
  signedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  unit: { id: string; number: string; building: { name: string } };
  lease?: { id: string; startDate: string; endDate: string; status: string } | null;
};

type Customer = { id: string; name: string };
type Unit = { id: string; number: string; status: string };

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  VOID: "bg-orange-100 text-orange-700",
};

const CONTRACT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SENT: { ar: "مُرسل", en: "Sent" },
  SIGNED: { ar: "موقّع", en: "Signed" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
  VOID: { ar: "لاغٍ", en: "Void" },
};

export default function ContractsPage() {
  const { lang, dir } = useLanguage();
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  const prefillDealId = searchParams.get("dealId");

  const [tab, setTab] = React.useState<"SALE" | "LEASE">("SALE");
  const [allContracts, setAllContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Create modals
  const [saleModalOpen, setSaleModalOpen] = React.useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // Sale form
  const [saleForm, setSaleForm] = React.useState({
    customerId: "",
    customerName: "",
    customerSearch: "",
    unitId: "",
    unitNumber: "",
    unitSearch: "",
    amount: "",
    notes: "",
  });

  // Lease form
  const [leaseForm, setLeaseForm] = React.useState({
    customerId: "",
    customerName: "",
    customerSearch: "",
    unitId: "",
    unitNumber: "",
    unitSearch: "",
    startDate: "",
    endDate: "",
    amount: "",
    paymentFrequency: "MONTHLY",
    notes: "",
  });

  function loadContracts() {
    setLoading(true);
    getContracts()
      .then((data) => setAllContracts(data as Contract[]))
      .catch(() => toast.error(lang === "ar" ? "تعذّر تحميل العقود" : "Failed to load contracts"))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    loadContracts();
  }, []);

  // Auto-open sale modal and pre-fill from reservation if dealId in URL
  React.useEffect(() => {
    if (!prefillDealId) return;
    openSaleModal();
    getReservationById(prefillDealId)
      .then((reservation) => {
        if (!reservation) return;
        setSaleForm((f) => ({
          ...f,
          customerId: reservation.customer.id,
          customerName: reservation.customer.name,
          customerSearch: reservation.customer.name,
          unitId: reservation.unit.id,
          unitNumber: reservation.unit.number,
          unitSearch: reservation.unit.number,
          amount: String(reservation.amount),
        }));
      })
      .catch(() => {});
  }, [prefillDealId]);

  const saleContracts = allContracts.filter((c) => c.type === "SALE");
  const leaseContracts = allContracts.filter((c) => c.type === "LEASE");
  const displayed = tab === "SALE" ? saleContracts : leaseContracts;

  const filtered = React.useMemo(() => {
    if (!search) return displayed;
    const q = search.toLowerCase();
    return displayed.filter(
      (c) =>
        c.customer.name.toLowerCase().includes(q) ||
        c.unit.number.toLowerCase().includes(q) ||
        (c.contractNumber ?? "").toLowerCase().includes(q)
    );
  }, [displayed, search]);

  // KPIs across all contracts
  const totalCount = allContracts.length;
  const activeCount = allContracts.filter((c) => c.status === "SIGNED").length;
  const draftCount = allContracts.filter((c) => c.status === "DRAFT").length;
  const totalValue = allContracts
    .filter((c) => c.status === "SIGNED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  function loadLookups() {
    getCustomers()
      .then((data) => setCustomers(data as Customer[]))
      .catch(() => {});
    getUnitsWithBuildings()
      .then((data) => setUnits(data as Unit[]))
      .catch(() => {});
  }

  function openSaleModal() {
    setSaleModalOpen(true);
    loadLookups();
  }

  function openLeaseModal() {
    setLeaseModalOpen(true);
    loadLookups();
  }

  // Filtered autocomplete helpers
  const saleCustomerOptions = React.useMemo(() => {
    const q = saleForm.customerSearch.toLowerCase();
    return customers.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [customers, saleForm.customerSearch]);

  const saleUnitOptions = React.useMemo(() => {
    const q = saleForm.unitSearch.toLowerCase();
    return units
      .filter((u) => (u.status === "AVAILABLE" || u.status === "RESERVED") && (!q || u.number.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [units, saleForm.unitSearch]);

  const leaseCustomerOptions = React.useMemo(() => {
    const q = leaseForm.customerSearch.toLowerCase();
    return customers.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [customers, leaseForm.customerSearch]);

  const leaseUnitOptions = React.useMemo(() => {
    const q = leaseForm.unitSearch.toLowerCase();
    return units
      .filter((u) => u.status === "AVAILABLE" && (!q || u.number.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [units, leaseForm.unitSearch]);

  async function handleCreateSale() {
    if (!saleForm.customerId || !saleForm.unitId || !saleForm.amount) {
      toast.error(lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createContract({
        customerId: saleForm.customerId,
        unitId: saleForm.unitId,
        type: "SALE",
        amount: parseFloat(saleForm.amount),
        notes: saleForm.notes || undefined,
      });
      toast.success(lang === "ar" ? "تم إنشاء عقد البيع بنجاح" : "Sale contract created successfully");
      setSaleModalOpen(false);
      setSaleForm({ customerId: "", customerName: "", customerSearch: "", unitId: "", unitNumber: "", unitSearch: "", amount: "", notes: "" });
      loadContracts();
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء الإنشاء" : "Failed to create contract"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateLease() {
    if (!leaseForm.customerId || !leaseForm.unitId || !leaseForm.amount || !leaseForm.startDate || !leaseForm.endDate) {
      toast.error(lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createContract({
        customerId: leaseForm.customerId,
        unitId: leaseForm.unitId,
        type: "LEASE",
        amount: parseFloat(leaseForm.amount),
        startDate: leaseForm.startDate,
        endDate: leaseForm.endDate,
        paymentFrequency: leaseForm.paymentFrequency,
        notes: leaseForm.notes || undefined,
      });
      toast.success(lang === "ar" ? "تم إنشاء عقد الإيجار بنجاح" : "Lease contract created successfully");
      setLeaseModalOpen(false);
      setLeaseForm({ customerId: "", customerName: "", customerSearch: "", unitId: "", unitNumber: "", unitSearch: "", startDate: "", endDate: "", amount: "", paymentFrequency: "MONTHLY", notes: "" });
      loadContracts();
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء الإنشاء" : "Failed to create contract"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir={dir} className="p-6 space-y-6">
      <PageIntro
        title={lang === "ar" ? "العقود" : "Contracts"}
        description={
          lang === "ar"
            ? "إدارة عقود البيع وعقود الإيجار في مكان واحد"
            : "Manage sale and lease contracts in one place"
        }
      />

      {/* KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي العقود" : "Total Contracts"}
          value={String(totalCount)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "موقّعة" : "Active (Signed)"}
          value={String(activeCount)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "مسودة" : "Draft"}
          value={String(draftCount)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "إجمالي القيمة" : "Total Value"}
          value={SAR(totalValue)}
          loading={loading}
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setTab("SALE")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === "SALE"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {lang === "ar" ? "عقود البيع" : "Sale Contracts"}
            <span className="ms-2 text-xs opacity-70">({saleContracts.length})</span>
          </button>
          <button
            onClick={() => setTab("LEASE")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors border-s border-gray-200",
              tab === "LEASE"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {lang === "ar" ? "عقود الإيجار" : "Lease Contracts"}
            <span className="ms-2 text-xs opacity-70">({leaseContracts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "بحث..." : "Search..."}
              className="ps-9 w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {can("contracts:write") && (
            <Button
              onClick={tab === "SALE" ? openSaleModal : openLeaseModal}
              style={{ display: "inline-flex" }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {tab === "SALE"
                ? lang === "ar" ? "عقد بيع جديد" : "New Sale Contract"
                : lang === "ar" ? "عقد إيجار جديد" : "New Lease Contract"}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <FileText className="w-8 h-8 text-gray-300" />
            <p className="text-sm">
              {lang === "ar" ? "لا توجد عقود" : "No contracts found"}
            </p>
          </div>
        ) : tab === "SALE" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "رقم العقد" : "Contract #"}</TableHead>
                <TableHead>{lang === "ar" ? "العميل" : "Client"}</TableHead>
                <TableHead>{lang === "ar" ? "العقار" : "Property"}</TableHead>
                <TableHead>{lang === "ar" ? "المبلغ" : "Amount (SAR)"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "تاريخ التوقيع" : "Signed Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {c.contractNumber ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{c.customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{lang === "ar" ? "وحدة" : "Unit"} {c.unit.number}</p>
                      <p className="text-gray-500 text-xs">{c.unit.building.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{SAR(Number(c.amount))}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>
                      {lang === "ar" ? (CONTRACT_STATUS_LABELS[c.status]?.ar ?? c.status) : (CONTRACT_STATUS_LABELS[c.status]?.en ?? c.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {c.signedAt
                      ? new Date(c.signedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {lang === "ar" ? "عرض" : "View"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "رقم العقد" : "Contract #"}</TableHead>
                <TableHead>{lang === "ar" ? "المستأجر" : "Tenant"}</TableHead>
                <TableHead>{lang === "ar" ? "العقار" : "Property"}</TableHead>
                <TableHead>{lang === "ar" ? "الإيجار السنوي" : "Annual Rent (SAR)"}</TableHead>
                <TableHead>{lang === "ar" ? "تاريخ البداية" : "Start Date"}</TableHead>
                <TableHead>{lang === "ar" ? "تاريخ النهاية" : "End Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {c.contractNumber ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{c.customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{lang === "ar" ? "وحدة" : "Unit"} {c.unit.number}</p>
                      <p className="text-gray-500 text-xs">{c.unit.building.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{SAR(Number(c.amount))}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {c.lease?.startDate
                      ? new Date(c.lease.startDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {c.lease?.endDate
                      ? new Date(c.lease.endDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>
                      {lang === "ar" ? (CONTRACT_STATUS_LABELS[c.status]?.ar ?? c.status) : (CONTRACT_STATUS_LABELS[c.status]?.en ?? c.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {lang === "ar" ? "عرض" : "View"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* New Sale Contract Modal */}
      <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "عقد بيع جديد" : "New Sale Contract"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "العميل" : "Customer"} *
              </label>
              <div className="relative">
                <Input
                  value={saleForm.customerName || saleForm.customerSearch}
                  onChange={(e) => {
                    setSaleForm((f) => ({ ...f, customerSearch: e.target.value, customerId: "", customerName: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن العميل..." : "Search customer..."}
                />
                {saleForm.customerSearch && !saleForm.customerId && saleCustomerOptions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {saleCustomerOptions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSaleForm((f) => ({ ...f, customerId: c.id, customerName: c.name, customerSearch: c.name }))}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "الوحدة" : "Unit"} *
              </label>
              <div className="relative">
                <Input
                  value={saleForm.unitNumber || saleForm.unitSearch}
                  onChange={(e) => {
                    setSaleForm((f) => ({ ...f, unitSearch: e.target.value, unitId: "", unitNumber: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن وحدة..." : "Search unit..."}
                />
                {saleForm.unitSearch && !saleForm.unitId && saleUnitOptions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {saleUnitOptions.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSaleForm((f) => ({ ...f, unitId: u.id, unitNumber: u.number, unitSearch: u.number }))}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {lang === "ar" ? "وحدة" : "Unit"} {u.number}
                        <span className="ms-2 text-xs text-gray-400">{u.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "مبلغ العقد (ريال)" : "Contract Amount (SAR)"} *
              </label>
              <Input
                type="number"
                min={0}
                value={saleForm.amount}
                onChange={(e) => setSaleForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={saleForm.notes}
                onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaleModalOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateSale} disabled={submitting} style={{ display: "inline-flex" }} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "ar" ? "إنشاء العقد" : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Lease Contract Modal */}
      <Dialog open={leaseModalOpen} onOpenChange={setLeaseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "عقد إيجار جديد" : "New Lease Contract"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Tenant */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "المستأجر" : "Tenant/Customer"} *
              </label>
              <div className="relative">
                <Input
                  value={leaseForm.customerName || leaseForm.customerSearch}
                  onChange={(e) => {
                    setLeaseForm((f) => ({ ...f, customerSearch: e.target.value, customerId: "", customerName: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن المستأجر..." : "Search tenant..."}
                />
                {leaseForm.customerSearch && !leaseForm.customerId && leaseCustomerOptions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {leaseCustomerOptions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setLeaseForm((f) => ({ ...f, customerId: c.id, customerName: c.name, customerSearch: c.name }))}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "الوحدة" : "Unit"} *
              </label>
              <div className="relative">
                <Input
                  value={leaseForm.unitNumber || leaseForm.unitSearch}
                  onChange={(e) => {
                    setLeaseForm((f) => ({ ...f, unitSearch: e.target.value, unitId: "", unitNumber: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن وحدة متاحة..." : "Search available unit..."}
                />
                {leaseForm.unitSearch && !leaseForm.unitId && leaseUnitOptions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {leaseForm.unitSearch && !leaseForm.unitId && leaseUnitOptions.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setLeaseForm((f) => ({ ...f, unitId: u.id, unitNumber: u.number, unitSearch: u.number }))}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {lang === "ar" ? "وحدة" : "Unit"} {u.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {lang === "ar" ? "تاريخ البداية" : "Start Date"} *
                </label>
                <Input
                  type="date"
                  value={leaseForm.startDate}
                  onChange={(e) => setLeaseForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {lang === "ar" ? "تاريخ النهاية" : "End Date"} *
                </label>
                <Input
                  type="date"
                  value={leaseForm.endDate}
                  min={leaseForm.startDate}
                  onChange={(e) => setLeaseForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "إجمالي الإيجار (ريال)" : "Total Amount (SAR)"} *
              </label>
              <Input
                type="number"
                min={0}
                value={leaseForm.amount}
                onChange={(e) => setLeaseForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Payment Frequency */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "دورية الدفع" : "Payment Frequency"}
              </label>
              <select
                value={leaseForm.paymentFrequency}
                onChange={(e) => setLeaseForm((f) => ({ ...f, paymentFrequency: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="MONTHLY">{lang === "ar" ? "شهري" : "Monthly"}</option>
                <option value="QUARTERLY">{lang === "ar" ? "ربع سنوي" : "Quarterly"}</option>
                <option value="SEMI_ANNUAL">{lang === "ar" ? "نصف سنوي" : "Semi-Annual"}</option>
                <option value="ANNUAL">{lang === "ar" ? "سنوي" : "Annual"}</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={leaseForm.notes}
                onChange={(e) => setLeaseForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLeaseModalOpen(false)} style={{ display: "inline-flex" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateLease} disabled={submitting} style={{ display: "inline-flex" }} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "ar" ? "إنشاء العقد" : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
