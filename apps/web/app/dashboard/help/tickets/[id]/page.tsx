"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import * as React from "react";
import {
  ArrowRight,
  PaperPlaneTilt,
  Clock,
  User,
  ShieldCheck,
  CaretLeft,
} from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasPermission } from "../../../../../lib/permissions";
import {
  getTicketWithMessages,
  addTicketMessage,
  updateTicketStatus,
} from "../../../../actions/support-tickets";

const STATUS_OPTIONS = [
  { value: "OPEN", label: { ar: "مفتوحة", en: "Open" } },
  { value: "IN_PROGRESS", label: { ar: "قيد المعالجة", en: "In Progress" } },
  { value: "WAITING_ON_USER", label: { ar: "بانتظار الرد", en: "Waiting on User" } },
  { value: "RESOLVED", label: { ar: "تم الحل", en: "Resolved" } },
  { value: "CLOSED", label: { ar: "مغلقة", en: "Closed" } },
];

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  BUG_REPORT: { ar: "بلاغ خطأ", en: "Bug Report" },
  FEATURE_REQUEST: { ar: "طلب ميزة", en: "Feature Request" },
  ACCOUNT_ISSUE: { ar: "مشكلة حساب", en: "Account Issue" },
  BILLING: { ar: "فوترة", en: "Billing" },
  TECHNICAL_SUPPORT: { ar: "دعم فني", en: "Technical Support" },
  GENERAL_INQUIRY: { ar: "استفسار عام", en: "General Inquiry" },
};

const PRIORITY_LABELS: Record<string, { ar: string; en: string }> = {
  LOW: { ar: "منخفضة", en: "Low" },
  MEDIUM: { ar: "متوسطة", en: "Medium" },
  HIGH: { ar: "عالية", en: "High" },
  URGENT: { ar: "عاجلة", en: "Urgent" },
};

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role ?? "USER";
  const userId = (session?.user as any)?.id;
  const isAdmin = hasPermission(userRole, "help:manage_tickets");
  const { lang } = useLanguage();

  const [ticket, setTicket] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  async function loadTicket() {
    try {
      const t = await getTicketWithMessages(ticketId);
      setTicket(t);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load ticket");
    }
    setLoading(false);
  }

  React.useEffect(() => {
    loadTicket();
  }, [ticketId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  async function handleSendMessage() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await addTicketMessage(ticketId, replyText.trim());
      setReplyText("");
      await loadTicket();
    } catch (e: any) {
      alert(e.message);
    }
    setSending(false);
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(ticketId, status);
      await loadTicket();
    } catch (e: any) {
      alert(e.message);
    }
    setUpdatingStatus(false);
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      OPEN: "bg-gray-100 text-gray-700",
      IN_PROGRESS: "bg-blue-50 text-blue-700",
      WAITING_ON_USER: "bg-amber-50 text-amber-700",
      RESOLVED: "bg-green-50 text-green-700",
      CLOSED: "bg-primary/10 text-primary",
    };
    const labels: Record<string, { ar: string; en: string }> = {
      OPEN: { ar: "مفتوحة", en: "Open" },
      IN_PROGRESS: { ar: "قيد المعالجة", en: "In Progress" },
      WAITING_ON_USER: { ar: "بانتظار الرد", en: "Waiting" },
      RESOLVED: { ar: "تم الحل", en: "Resolved" },
      CLOSED: { ar: "مغلقة", en: "Closed" },
    };
    const label = labels[status] ?? { ar: status, en: status };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", map[status] ?? "bg-gray-100 text-gray-700")}>
        {lang === "ar" ? label.ar : label.en}
      </span>
    );
  }

  function priorityBadge(priority: string) {
    const map: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-600",
      MEDIUM: "bg-blue-50 text-blue-700",
      HIGH: "bg-orange-50 text-orange-700",
      URGENT: "bg-red-50 text-red-700",
    };
    const label = PRIORITY_LABELS[priority] ?? { ar: priority, en: priority };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", map[priority] ?? "bg-gray-100 text-gray-600")}>
        {lang === "ar" ? label.ar : label.en}
      </span>
    );
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
          {error || (lang === "ar" ? "التذكرة غير موجودة" : "Ticket not found")}
        </div>
        <div className="mt-4 text-center">
          <Link href="/dashboard/help" className="text-primary hover:underline text-sm">
            {lang === "ar" ? "← العودة لمركز المساعدة" : "← Back to Help Center"}
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="p-4 md:p-6 space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/help"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          {lang === "ar" ? (
            <>
              مركز المساعدة
              <ArrowRight size={14} />
            </>
          ) : (
            <>
              <CaretLeft size={14} />
              Help Center
            </>
          )}
        </Link>
      </div>

      {/* Ticket Header */}
      <div className="bg-card rounded-xl border border-gray-100 p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                {statusBadge(ticket.status)}
                {priorityBadge(ticket.priority)}
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{ticket.subject}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User size={12} />
              {ticket.user?.name ?? ticket.user?.email}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(ticket.createdAt)}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              "bg-gray-50 text-gray-600"
            )}>
              {lang === "ar"
                ? (CATEGORY_LABELS[ticket.category]?.ar ?? ticket.category)
                : (CATEGORY_LABELS[ticket.category]?.en ?? ticket.category)}
            </span>
            {ticket.assignee && (
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} />
                {lang === "ar" ? "المسؤول:" : "Assigned:"} {ticket.assignee.name ?? ticket.assignee.email}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-card rounded-xl border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500">
              {lang === "ar" ? "إجراءات المسؤول:" : "Admin Actions:"}
            </span>
            <select
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-card focus:ring-1 focus:ring-primary/20 focus:border-primary"
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "ar" ? opt.label.ar : opt.label.en}
                </option>
              ))}
            </select>
            {updatingStatus && (
              <span className="text-xs text-gray-400">
                {lang === "ar" ? "جارٍ التحديث..." : "Updating..."}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="bg-card rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            {lang === "ar" ? "المحادثة" : "Conversation"}
            {ticket.messages?.length > 0 && (
              <span className="text-xs font-normal text-gray-400 ms-2">
                ({ticket.messages.length})
              </span>
            )}
          </h2>
        </div>

        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {(!ticket.messages || ticket.messages.length === 0) && (
            <div className="text-center text-gray-400 text-sm py-8">
              {lang === "ar"
                ? "لا توجد رسائل بعد. كن أول من يرد."
                : "No messages yet. Be the first to reply."}
            </div>
          )}

          {ticket.messages?.map((msg: any) => {
            const isOwn = msg.userId === userId;
            const isStaff = msg.isStaffReply;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isOwn ? (lang === "ar" ? "ms-auto" : "ms-auto") : ""
                )}
              >
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    isStaff
                      ? "bg-blue-50 border border-blue-100 text-gray-800"
                      : isOwn
                        ? "bg-primary/5 border border-primary/10 text-gray-800"
                        : "bg-gray-50 border border-gray-100 text-gray-800"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-600">
                      {msg.user?.name ?? msg.user?.email}
                    </span>
                    {isStaff && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        {lang === "ar" ? "فريق الدعم" : "Staff"}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                  <div className="text-[10px] text-gray-400 mt-1.5">
                    {formatDate(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        {!isClosed ? (
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <textarea
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary resize-none"
                rows={2}
                placeholder={lang === "ar" ? "اكتب ردك هنا..." : "Type your reply..."}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!replyText.trim() || sending}
                className="self-end"
               
              >
                <PaperPlaneTilt size={16} className={lang === "ar" ? "rotate-180" : ""} />
                <span className="ms-1.5 text-sm">
                  {sending
                    ? (lang === "ar" ? "إرسال..." : "Sending...")
                    : (lang === "ar" ? "إرسال" : "Send")}
                </span>
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {lang === "ar" ? "Ctrl+Enter للإرسال السريع" : "Ctrl+Enter to send"}
            </p>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              {lang === "ar"
                ? "هذه التذكرة مغلقة. لا يمكن إضافة ردود جديدة."
                : "This ticket is closed. No new replies can be added."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
