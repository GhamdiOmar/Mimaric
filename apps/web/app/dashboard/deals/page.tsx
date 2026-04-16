"use client";

import * as React from "react";
import {
  Plus,
  Loader2,
  Search,
  X,
  MoreHorizontal,
  ArrowRight,
  Ban,
  Eye,
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
import {
  getReservations,
  createReservation,
  updateReservationStatus,
} from "../../actions/reservations";
import { getCustomers } from "../../actions/customers";
import { getUnitsWithBuildings } from "../../actions/units";
import { toast } from "sonner";
import Link from "next/link";

const SAR = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  amount: number;
  depositAmount: number | null;
  expiresAt: string;
  createdAt: string;
  customer: { id: string; name: string };
  unit: {
    id: string;
    number: string;
    building: { name: string; project: { name: string } };
  };
};

type Customer = { id: string; name: string; phone?: string };
type Unit = { id: string; number: string; status: string; buildingId?: string };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: "قيد الانتظار", en: "Pending" },
  CONFIRMED: { ar: "مؤكد", en: "Confirmed" },
  EXPIRED: { ar: "منتهي", en: "Expired" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
};

export default function DealsPage() {
  const { lang, dir } = useLanguage();
  const { can } = usePermissions();

  const [deals, setDeals] = React.useState<Reservation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Create modal
  const [createOpen, setCreateOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [unitSearch, setUnitSearch] = React.useState("");
  const [form, setForm] = React.useState({
    customerId: "",
    customerName: "",
    unitId: "",
    unitNumber: "",
    amount: "",
    expiresAt: "",
    notes: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Details popover
  const [detailDeal, setDetailDeal] = React.useState<Reservation | null>(null);

  // Cancel confirm
  const [cancelDeal, setCancelDeal] = React.useState<Reservation | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  function loadDeals() {
    setLoading(true);
    getReservations()
      .then((data) => setDeals(data as Reservation[]))
      .catch(() => toast.error(lang === "ar" ? "تعذّر تحميل الصفقات" : "Failed to load deals"))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    loadDeals();
  }, []);

  // Filtered deals
  const filtered = React.useMemo(() => {
    return deals.filter((d) => {
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.customer.name.toLowerCase().includes(q) ||
        d.unit.number.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [deals, statusFilter, search]);

  // KPIs
  const total = deals.length;
  const active = deals.filter((d) => d.status === "PENDING" || d.status === "CONFIRMED").length;
  const confirmed = deals.filter((d) => d.status === "CONFIRMED").length;
  const expired = deals.filter((d) => d.status === "EXPIRED" || d.status === "CANCELLED").length;

  // Customer autocomplete
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [customers, customerSearch]);

  // Unit autocomplete — available only
  const filteredUnits = React.useMemo(() => {
    const available = units.filter((u) => u.status === "AVAILABLE");
    if (!unitSearch) return available.slice(0, 8);
    const q = unitSearch.toLowerCase();
    return available.filter((u) => u.number.toLowerCase().includes(q)).slice(0, 8);
  }, [units, unitSearch]);

  function openCreate() {
    setCreateOpen(true);
    getCustomers()
      .then((data) => setCustomers(data as Customer[]))
      .catch(() => {});
    getUnitsWithBuildings()
      .then((data) => setUnits(data as Unit[]))
      .catch(() => {});
  }

  async function handleCreate() {
    if (!form.customerId || !form.unitId || !form.amount || !form.expiresAt) {
      toast.error(lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createReservation({
        customerId: form.customerId,
        unitId: form.unitId,
        amount: parseFloat(form.amount),
        expiresAt: new Date(form.expiresAt),
      });
      toast.success(lang === "ar" ? "تم إنشاء الصفقة بنجاح" : "Deal created successfully");
      setCreateOpen(false);
      setForm({ customerId: "", customerName: "", unitId: "", unitNumber: "", amount: "", expiresAt: "", notes: "" });
      loadDeals();
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء الإنشاء" : "Failed to create deal"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelDeal) return;
    setCancelling(true);
    try {
      await updateReservationStatus(cancelDeal.id, "CANCELLED");
      toast.success(lang === "ar" ? "تم إلغاء الصفقة" : "Deal cancelled");
      setCancelDeal(null);
      loadDeals();
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء الإلغاء" : "Failed to cancel deal"));
    } finally {
      setCancelling(false);
    }
  }

  const statusTabs = [
    { key: "ALL", ar: "الكل", en: "All" },
    { key: "PENDING", ar: "قيد الانتظار", en: "Pending" },
    { key: "CONFIRMED", ar: "مؤكد", en: "Confirmed" },
    { key: "EXPIRED", ar: "منتهي", en: "Expired" },
    { key: "CANCELLED", ar: "ملغي", en: "Cancelled" },
  ];

  return (
    <div dir={dir} className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageIntro
          title={lang === "ar" ? "الصفقات" : "Deals"}
          description={
            lang === "ar"
              ? "إدارة الصفقات النشطة وحجوزات العقارات"
              : "Manage your active deals and property reservations"
          }
        />
        {can("deals:write") && (
          <Button
            onClick={openCreate}
            style={{ display: "inline-flex" }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {lang === "ar" ? "إنشاء صفقة" : "Create Deal"}
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={lang === "ar" ? "إجمالي الصفقات" : "Total Deals"}
          value={String(total)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "نشطة" : "Active"}
          value={String(active)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "مؤكدة" : "Confirmed"}
          value={String(confirmed)}
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "منتهية/ملغاة" : "Expired/Cancelled"}
          value={String(expired)}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                statusFilter === tab.key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {lang === "ar" ? tab.ar : tab.en}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "البحث باسم العميل أو رقم الوحدة" : "Search by client or unit number"}
            className="ps-9"
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
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <p className="text-sm">{lang === "ar" ? "لا توجد صفقات" : "No deals found"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "العميل" : "Client"}</TableHead>
                <TableHead>{lang === "ar" ? "العقار" : "Property"}</TableHead>
                <TableHead>{lang === "ar" ? "قيمة الصفقة" : "Deal Value"}</TableHead>
                <TableHead>{lang === "ar" ? "العربون" : "Deposit"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</TableHead>
                <TableHead>{lang === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{lang === "ar" ? "وحدة" : "Unit"} {deal.unit.number}</p>
                      <p className="text-gray-500 text-xs">{deal.unit.building?.project?.name ?? "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{SAR(deal.amount)}</TableCell>
                  <TableCell>
                    {deal.depositAmount ? SAR(deal.depositAmount) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status]}`}>
                      {lang === "ar" ? (STATUS_LABELS[deal.status]?.ar ?? deal.status) : (STATUS_LABELS[deal.status]?.en ?? deal.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(deal.expiresAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailDeal(deal)}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        title={lang === "ar" ? "عرض التفاصيل" : "View Details"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {deal.status === "CONFIRMED" && (
                        <Link
                          href={`/dashboard/contracts?dealId=${deal.id}`}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {lang === "ar" ? "تحويل لعقد" : "Convert to Contract"}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {can("deals:write") &&
                        (deal.status === "PENDING" || deal.status === "CONFIRMED") && (
                          <button
                            onClick={() => setCancelDeal(deal)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title={lang === "ar" ? "إلغاء الصفقة" : "Cancel Deal"}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Deal Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إنشاء صفقة جديدة" : "Create New Deal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer search */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "العميل" : "Customer"} *
              </label>
              <div className="relative">
                <Input
                  value={form.customerName || customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setForm((f) => ({ ...f, customerId: "", customerName: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن العميل..." : "Search customer..."}
                />
                {customerSearch && !form.customerId && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, customerId: c.id, customerName: c.name }));
                          setCustomerSearch(c.name);
                        }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Unit search */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "الوحدة" : "Unit"} *
              </label>
              <div className="relative">
                <Input
                  value={form.unitNumber || unitSearch}
                  onChange={(e) => {
                    setUnitSearch(e.target.value);
                    setForm((f) => ({ ...f, unitId: "", unitNumber: "" }));
                  }}
                  placeholder={lang === "ar" ? "ابحث عن وحدة متاحة..." : "Search available unit..."}
                />
                {unitSearch && !form.unitId && filteredUnits.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUnits.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, unitId: u.id, unitNumber: u.number }));
                          setUnitSearch(u.number);
                        }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {lang === "ar" ? "وحدة" : "Unit"} {u.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "قيمة الصفقة (ريال)" : "Deal Amount (SAR)"} *
              </label>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"} *
              </label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {lang === "ar" ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder={lang === "ar" ? "أي ملاحظات إضافية..." : "Any additional notes..."}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              style={{ display: "inline-flex" }}
              className="gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "ar" ? "إنشاء الصفقة" : "Create Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Details Modal */}
      <Dialog open={!!detailDeal} onOpenChange={(open) => !open && setDetailDeal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تفاصيل الصفقة" : "Deal Details"}</DialogTitle>
          </DialogHeader>
          {detailDeal && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "العميل" : "Client"}</p>
                  <p className="font-medium">{detailDeal.customer.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "الوحدة" : "Unit"}</p>
                  <p className="font-medium">{detailDeal.unit.number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "قيمة الصفقة" : "Deal Value"}</p>
                  <p className="font-medium">{SAR(detailDeal.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "العربون" : "Deposit"}</p>
                  <p className="font-medium">
                    {detailDeal.depositAmount ? SAR(detailDeal.depositAmount) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "الحالة" : "Status"}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[detailDeal.status]}`}>
                    {lang === "ar" ? (STATUS_LABELS[detailDeal.status]?.ar ?? detailDeal.status) : (STATUS_LABELS[detailDeal.status]?.en ?? detailDeal.status)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</p>
                  <p className="font-medium">
                    {new Date(detailDeal.expiresAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "المشروع" : "Project"}</p>
                  <p className="font-medium">{detailDeal.unit.building?.project?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{lang === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                  <p className="font-medium">
                    {new Date(detailDeal.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA")}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDeal(null)}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={!!cancelDeal} onOpenChange={(open) => !open && setCancelDeal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            {lang === "ar"
              ? `هل أنت متأكد من إلغاء الصفقة الخاصة بـ ${cancelDeal?.customer.name}؟ سيتم تحرير الوحدة وإتاحتها مجدداً.`
              : `Are you sure you want to cancel the deal for ${cancelDeal?.customer.name}? The unit will be released and made available again.`}
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDeal(null)}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "تراجع" : "Go Back"}
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelling}
              style={{ display: "inline-flex" }}
              className="gap-2"
            >
              {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "ar" ? "إلغاء الصفقة" : "Cancel Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
