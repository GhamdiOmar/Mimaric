"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@repo/ui";
import { getSiteLogs, createSiteLog, resolveSiteLog } from "../../../../actions/site-logs";
import { formatDualDate } from "../../../../../lib/hijri";

const typeLabels: Record<string, { ar: string; en: string; color: string }> = {
  DAILY_LOG: { ar: "سجل يومي", en: "Daily Log", color: "available" },
  INSPECTION: { ar: "تفتيش", en: "Inspection", color: "reserved" },
  SNAG: { ar: "ملاحظة", en: "Snag", color: "sold" },
  SAFETY: { ar: "سلامة", en: "Safety", color: "sold" },
  WEATHER: { ar: "طقس", en: "Weather", color: "draft" },
};

const severityLabels: Record<string, { ar: string; en: string }> = {
  LOW: { ar: "منخفض", en: "Low" },
  MEDIUM: { ar: "متوسط", en: "Medium" },
  HIGH: { ar: "عالي", en: "High" },
  CRITICAL: { ar: "حرج", en: "Critical" },
};

export default function SiteLogsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("");

  React.useEffect(() => { loadLogs(); }, [typeFilter, severityFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter) filters.type = typeFilter;
      if (severityFilter) filters.severity = severityFilter;
      const data = await getSiteLogs(id as string, filters);
      setLogs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleResolve(logId: string) {
    await resolveSiteLog(logId);
    loadLogs();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${id}`)}>
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">{lang === "ar" ? "سجلات الموقع" : "Site Logs"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lang === "ar" ? "تفتيشات، ملاحظات، وسجلات يومية" : "Inspections, snags, and daily logs"}</p>
        </div>
        <div className="flex-1" />
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />{lang === "ar" ? "إضافة سجل" : "Add Log"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-card">
          <option value="">{lang === "ar" ? "كل الأنواع" : "All Types"}</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm bg-card">
          <option value="">{lang === "ar" ? "كل الأولويات" : "All Severities"}</option>
          {Object.entries(severityLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد سجلات" : "No Logs"}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-card rounded-md shadow-card border border-border p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={(typeLabels[log.type]?.color ?? "draft") as any} className="text-xs">
                      {typeLabels[log.type]?.[lang] ?? log.type}
                    </Badge>
                    {log.severity && (
                      <Badge variant={log.severity === "CRITICAL" || log.severity === "HIGH" ? "sold" : "reserved" as any} className="text-xs">
                        {severityLabels[log.severity]?.[lang] ?? log.severity}
                      </Badge>
                    )}
                    {log.resolvedAt ? (
                      <Badge variant="available" className="text-xs gap-1"><CheckCircle2 className="h-2.5 w-2.5" />{lang === "ar" ? "تم الحل" : "Resolved"}</Badge>
                    ) : (
                      <Badge variant="reserved" className="text-xs">{lang === "ar" ? "مفتوح" : "Open"}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-primary font-medium">{log.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                    <span>{formatDualDate(log.date, lang)}</span>
                    {log.reportedBy && <span>{lang === "ar" ? "بواسطة" : "By"}: {log.reportedBy}</span>}
                  </div>
                </div>
                {!log.resolvedAt && (
                  <Button size="sm" variant="secondary" className="text-xs gap-1" onClick={() => handleResolve(log.id)}>
                    <CheckCircle2 className="h-3 w-3" />{lang === "ar" ? "حل" : "Resolve"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <AddLogModal
          lang={lang}
          projectId={id as string}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadLogs(); }}
        />
      </Dialog>
    </div>
  );
}

function AddLogModal({ lang, projectId, onClose, onSuccess }: { lang: "ar" | "en"; projectId: string; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ date: new Date().toISOString().split("T")[0] ?? "", type: "DAILY_LOG", description: "", severity: "", reportedBy: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createSiteLog({ projectId, ...form, severity: form.severity || undefined, reportedBy: form.reportedBy || undefined });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{lang === "ar" ? "إضافة سجل موقع" : "Add Site Log"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "التاريخ" : "Date"}</label>
              <input type="date" required value={form.date} onChange={set("date")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الوصف *" : "Description *"}</label>
            <textarea required value={form.description} onChange={set("description")} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الخطورة" : "Severity"}</label>
              <select value={form.severity} onChange={set("severity")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                <option value="">—</option>
                {Object.entries(severityLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المُبلِّغ" : "Reported By"}</label>
              <input value={form.reportedBy} onChange={set("reportedBy")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
        <DialogFooter>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" size="sm" disabled={saving} loading={saving}>
            {lang === "ar" ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
