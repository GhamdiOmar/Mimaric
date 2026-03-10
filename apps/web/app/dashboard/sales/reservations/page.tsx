"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  Tag,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Warning,
  Spinner,
  Buildings,
  User,
} from "@phosphor-icons/react";
import { SARAmount } from "@repo/ui";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
import { getReservations, updateReservationStatus } from "../../../actions/reservations";
import { formatDualDate } from "../../../../lib/hijri";

const statusConfig: Record<string, { label: { ar: string; en: string }; variant: string; icon: any }> = {
  PENDING: { label: { ar: "قيد الانتظار", en: "Pending" }, variant: "reserved", icon: Clock },
  CONFIRMED: { label: { ar: "مؤكد", en: "Confirmed" }, variant: "available", icon: CheckCircle },
  CANCELLED: { label: { ar: "ملغي", en: "Cancelled" }, variant: "sold", icon: XCircle },
  EXPIRED: { label: { ar: "منتهي", en: "Expired" }, variant: "sold", icon: Warning },
};

export default function ReservationsPage() {
  const { lang } = useLanguage();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (err) {
      console.error("Failed to load reservations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: "CONFIRMED" | "CANCELLED" | "EXPIRED") {
    try {
      await updateReservationStatus(id, status);
      await loadReservations();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "الحجوزات" : "Reservations"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "إدارة جميع حجوزات الوحدات العقارية" : "Manage all unit reservations"}
          </p>
        </div>
        <Link href="/dashboard/sales/reservations/new">
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            {lang === "ar" ? "حجز جديد" : "New Reservation"}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="animate-spin text-primary" size={32} />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
          <Tag size={48} className="text-neutral mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد حجوزات" : "No Reservations"}
          </h3>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar" ? "ابدأ بإنشاء حجز جديد لوحدة عقارية" : "Start by creating a new unit reservation"}
          </p>
          <Link href="/dashboard/sales/reservations/new">
            <Button className="mt-4 gap-2">
              <Plus size={16} />
              {lang === "ar" ? "حجز جديد" : "New Reservation"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-md shadow-card border border-border overflow-x-auto">
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
                  {lang === "ar" ? "المبلغ" : "Amount"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "تاريخ الانتهاء" : "Expires"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">
                  {lang === "ar" ? "إجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res: any) => {
                const config = (statusConfig as any)[res.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                const isExpired = new Date(res.expiresAt) < new Date() && res.status === "PENDING";

                return (
                  <tr key={res.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs">
                          {res.customer?.name?.charAt(0) || <User size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{res.customer?.name}</p>
                          <p className="text-xs text-neutral" dir="ltr">{res.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Buildings size={14} className="text-neutral" />
                        <span className="text-sm">{res.unit?.number || "—"}</span>
                      </div>
                      <p className="text-xs text-neutral">{res.unit?.building?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SARAmount value={Number(res.amount)} size={12} className="font-bold" />
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral">
                      {formatDualDate(res.expiresAt, lang)}
                      {isExpired && (
                        <span className="block text-red-500 text-[10px] font-bold mt-0.5">
                          {lang === "ar" ? "منتهي الصلاحية" : "Expired"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={config.variant as any} className="gap-1 text-xs">
                        <StatusIcon size={12} />
                        {config.label[lang]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {res.status === "PENDING" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-7 px-2"
                            onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                          >
                            {lang === "ar" ? "تأكيد" : "Confirm"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleStatusChange(res.id, "CANCELLED")}
                          >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      )}
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
