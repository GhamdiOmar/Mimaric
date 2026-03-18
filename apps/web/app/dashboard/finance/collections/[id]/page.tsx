"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Spinner, Phone, Envelope, Chat, MapPin, Note, Handshake, ArrowUp } from "@phosphor-icons/react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useLanguage } from "../../../../../components/LanguageProvider";
import {
  getCollectionCaseDetail,
  logCollectionActivity,
  updateCollectionStatus,
} from "../../../../actions/collections";

const LABELS = {
  ar: {
    title: "تفاصيل حالة التحصيل",
    back: "عودة",
    outstanding: "المبلغ المعلق",
    status: "الحالة",
    escalation: "مستوى التصعيد",
    activities: "سجل النشاطات",
    logActivity: "تسجيل نشاط",
    type: "النوع",
    notes: "ملاحظات",
    nextAction: "الإجراء التالي",
    nextDate: "تاريخ المتابعة",
    submit: "إرسال",
    escalate: "تصعيد",
    settle: "تسوية",
    noActivities: "لا توجد نشاطات",
    activityTypes: {
      CALL: "مكالمة",
      EMAIL: "بريد إلكتروني",
      SMS: "رسالة نصية",
      VISIT: "زيارة",
      NOTE: "ملاحظة",
      PROMISE: "وعد بالدفع",
      ESCALATION: "تصعيد",
    },
  },
  en: {
    title: "Collection Case Detail",
    back: "Back",
    outstanding: "Outstanding",
    status: "Status",
    escalation: "Escalation Level",
    activities: "Activity Log",
    logActivity: "Log Activity",
    type: "Type",
    notes: "Notes",
    nextAction: "Next Action",
    nextDate: "Follow-up Date",
    submit: "Submit",
    escalate: "Escalate",
    settle: "Settle",
    noActivities: "No activities recorded",
    activityTypes: {
      CALL: "Call",
      EMAIL: "Email",
      SMS: "SMS",
      VISIT: "Visit",
      NOTE: "Note",
      PROMISE: "Promise to Pay",
      ESCALATION: "Escalation",
    },
  },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Envelope size={14} />,
  SMS: <Chat size={14} />,
  VISIT: <MapPin size={14} />,
  NOTE: <Note size={14} />,
  PROMISE: <Handshake size={14} />,
  ESCALATION: <ArrowUp size={14} />,
};

export default function CollectionCaseDetailPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [actType, setActType] = React.useState("CALL");
  const [actNotes, setActNotes] = React.useState("");
  const [actNextAction, setActNextAction] = React.useState("");
  const [actNextDate, setActNextDate] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCollectionCaseDetail(caseId);
      setCaseData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  React.useEffect(() => { load(); }, [load]);

  const handleLogActivity = async () => {
    try {
      await logCollectionActivity(caseId, {
        type: actType,
        notes: actNotes,
        nextAction: actNextAction || undefined,
        nextActionDate: actNextDate || undefined,
      });
      setShowForm(false);
      setActNotes("");
      setActNextAction("");
      setActNextDate("");
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateCollectionStatus(caseId, status);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/finance/collections")} style={{ display: "inline-flex" }}>
          <ArrowLeft size={16} /> {t.back}
        </Button>
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* Case Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t.outstanding}</p>
            <p className="text-2xl font-bold">{Number(caseData.totalOutstanding).toLocaleString()} SAR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t.status}</p>
            <Badge className="text-sm mt-1">{(t as any).activityTypes?.[caseData.status] ?? caseData.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t.escalation}</p>
            <p className="text-2xl font-bold">{caseData.escalationLevel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex" }}>
          {t.logActivity}
        </Button>
        {caseData.status !== "SETTLED" && caseData.status !== "LEGAL" && (
          <Button variant="ghost" onClick={() => handleStatusChange("ESCALATED")} style={{ display: "inline-flex" }}>
            <ArrowUp size={16} className="mr-1" /> {t.escalate}
          </Button>
        )}
        {caseData.status !== "SETTLED" && (
          <Button variant="ghost" onClick={() => handleStatusChange("SETTLED")} style={{ display: "inline-flex" }}>
            {t.settle}
          </Button>
        )}
      </div>

      {/* Activity Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">{t.type}</label>
              <select className="rounded-md border px-3 py-2 text-sm w-full" value={actType} onChange={(e) => setActType(e.target.value)}>
                {Object.entries(t.activityTypes).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t.notes}</label>
              <textarea className="rounded-md border px-3 py-2 text-sm w-full" rows={3} value={actNotes} onChange={(e) => setActNotes(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">{t.nextAction}</label>
                <input className="rounded-md border px-3 py-2 text-sm w-full" value={actNextAction} onChange={(e) => setActNextAction(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t.nextDate}</label>
                <input type="date" className="rounded-md border px-3 py-2 text-sm w-full" value={actNextDate} onChange={(e) => setActNextDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleLogActivity} style={{ display: "inline-flex" }}>{t.submit}</Button>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t.activities}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!caseData.activities || caseData.activities.length === 0) ? (
            <p className="text-muted-foreground text-sm">{t.noActivities}</p>
          ) : (
            <div className="space-y-0">
              {caseData.activities.map((act: any, idx: number) => (
                <div key={act.id} className="relative flex gap-4 pb-4">
                  {idx < caseData.activities.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className="relative z-10 mt-1.5 h-[10px] w-[10px] rounded-full border-2 border-primary bg-background flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {ACTIVITY_ICONS[act.type]}
                      <span className="text-sm font-medium">{(t.activityTypes as any)[act.type] ?? act.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(act.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
                      </span>
                    </div>
                    {act.notes && <p className="text-sm text-muted-foreground mt-1">{act.notes}</p>}
                    {act.nextAction && (
                      <p className="text-xs text-primary mt-1">
                        {t.nextAction}: {act.nextAction}
                        {act.nextActionDate && ` (${new Date(act.nextActionDate).toLocaleDateString()})`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
