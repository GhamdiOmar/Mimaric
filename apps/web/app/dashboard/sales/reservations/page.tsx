"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  Tag,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  User,
} from "lucide-react";
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
import { getReservations, updateReservationStatus } from "../../../actions/reservations";
import { formatDualDate } from "../../../../lib/hijri";

const statusConfig: Record<string, { label: { ar: string; en: string }; variant: string; icon: any }> = {
  PENDING: { label: { ar: "قيد الانتظار", en: "Pending" }, variant: "reserved", icon: Clock },
  CONFIRMED: { label: { ar: "مؤكد", en: "Confirmed" }, variant: "available", icon: CheckCircle2 },
  CANCELLED: { label: { ar: "ملغي", en: "Cancelled" }, variant: "sold", icon: XCircle },
  EXPIRED: { label: { ar: "منتهي", en: "Expired" }, variant: "sold", icon: AlertTriangle },
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
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "إدارة جميع حجوزات الوحدات العقارية" : "Manage all unit reservations"}
          </p>
        </div>
        <Link href="/dashboard/sales/reservations/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {lang === "ar" ? "حجز جديد" : "New Reservation"}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reservations.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">
            {lang === "ar" ? "لا توجد حجوزات" : "No Reservations"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "ابدأ بإنشاء حجز جديد لوحدة عقارية" : "Start by creating a new unit reservation"}
          </p>
          <Link href="/dashboard/sales/reservations/new">
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              {lang === "ar" ? "حجز جديد" : "New Reservation"}
            </Button>
          </Link>
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
                  {lang === "ar" ? "المبلغ" : "Amount"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "تاريخ الانتهاء" : "Expires"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "الحالة" : "Status"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "إجراءات" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res: any) => {
                const config = (statusConfig as any)[res.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                const isExpired = new Date(res.expiresAt) < new Date() && res.status === "PENDING";

                return (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs">
                          {res.customer?.name?.charAt(0) || <User className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{res.customer?.name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{res.customer?.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{res.unit?.number || "—"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{res.unit?.building?.name}</p>
                    </TableCell>
                    <TableCell>
                      <SARAmount value={Number(res.amount)} size={12} className="font-bold" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDualDate(res.expiresAt, lang)}
                      {isExpired && (
                        <span className="block text-red-500 text-[10px] font-bold mt-0.5">
                          {lang === "ar" ? "منتهي الصلاحية" : "Expired"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant as any} className="gap-1 text-xs">
                        <StatusIcon className="h-3 w-3" />
                        {config.label[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
