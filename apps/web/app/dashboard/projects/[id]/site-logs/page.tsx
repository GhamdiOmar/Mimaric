"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Spinner, CheckCircle, ClipboardText } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
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
  const [lang] = React.useState<"ar" | "en">("ar");
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
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${id}`)} style={{ display: "inline-flex" }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">{lang === "ar" ? "سجلات الموقع" : "Site Logs"}</h1>
          <p className="text-sm text-neutral mt-0.5">{lang === "ar" ? "تفتيشات، ملاحظات، وسجلات يومية" : "Inspections, snags, and daily logs"}</p>
        </div>
        <div className="flex-1" />
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)} style={{ display: "inline-flex" }}>
          <Plus size={16} />{lang === "ar" ? "إضافة سجل" : "Add Log"}
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
        <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-md shadow-card border border-border p-12 text-center">
          <ClipboardText size={48} className="text-neutral mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد سجلات" : "No Logs"}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-card rounded-md shadow-card border border-border p-5 hover:shadow-raised transition-all">
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
                      <Badge variant="available" className="text-xs gap-1"><CheckCircle size={10} />{lang === "ar" ? "تم الحل" : "Resolved"}</Badge>
                    ) : (
                      <Badge variant="reserved" className="text-xs">{lang === "ar" ? "مفتوح" : "Open"}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-primary font-medium">{log.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral">
                    <span>{formatDualDate(log.date, lang)}</span>
                    {log.reportedBy && <span>{lang === "ar" ? "بواسطة" : "By"}: {log.reportedBy}</span>}
                  </div>
                </div>
                {!log.resolvedAt && (
                  <Button size="sm" variant="secondary" className="text-xs gap-1" onClick={() => handleResolve(log.id)} style={{ display: "inline-flex" }}>
                    <CheckCircle size={12} />{lang === "ar" ? "حل" : "Resolve"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddLogModal
          lang={lang}
          projectId={id as string}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadLogs(); }}
        />
      )}
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "إضافة سجل موقع" : "Add Site Log"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "التاريخ" : "Date"}</label>
              <input type="date" required value={form.date} onChange={set("date")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={form.type} onChange={set("type")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الوصف *" : "Description *"}</label>
            <textarea required value={form.description} onChange={set("description")} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الخطورة" : "Severity"}</label>
              <select value={form.severity} onChange={set("severity")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                <option value="">—</option>
                {Object.entries(severityLabels).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المُبلِّغ" : "Reported By"}</label>
              <input value={form.reportedBy} onChange={set("reportedBy")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} style={{ display: "inline-flex" }}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving} style={{ display: "inline-flex" }}>
              {saving ? <Spinner size={14} className="animate-spin" /> : null}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
