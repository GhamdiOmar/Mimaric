"use client";

import { useLanguage } from "../../../../../../components/LanguageProvider";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Spinner, Plus, Trash, GridFour, RoadHorizon as RoadIcon,
  Lightning, Drop, TreeStructure,
} from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import {
  getSubdivisionPlanDetail,
  createBlock, createPlot, createRoad, createUtilityCorridor,
  deleteBlock, deletePlot, deleteRoad, deleteUtilityCorridor,
} from "../../../../../actions/subdivision";

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

const ROAD_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  PRIMARY: { ar: "رئيسي", en: "Primary" },
  SECONDARY: { ar: "فرعي", en: "Secondary" },
  LOCAL: { ar: "محلي", en: "Local" },
  SERVICE: { ar: "خدمي", en: "Service" },
  CUL_DE_SAC: { ar: "طريق مسدود", en: "Cul-de-sac" },
};

const UTILITY_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  ELECTRICITY: { ar: "كهرباء", en: "Electricity" },
  WATER: { ar: "مياه", en: "Water" },
  SEWAGE: { ar: "صرف صحي", en: "Sewage" },
  TELECOM: { ar: "اتصالات", en: "Telecom" },
  GAS: { ar: "غاز", en: "Gas" },
  STORMWATER: { ar: "تصريف أمطار", en: "Stormwater" },
  MULTI: { ar: "متعدد", en: "Multi" },
};

const PLOT_STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  PLANNED: { ar: "مخطط", en: "Planned", color: "bg-muted text-neutral" },
  APPROVED: { ar: "معتمد", en: "Approved", color: "bg-info/15 text-info" },
  AVAILABLE_FOR_SALE: { ar: "متاح للبيع", en: "Available", color: "bg-secondary/15 text-secondary" },
  RESERVED: { ar: "محجوز", en: "Reserved", color: "bg-accent/15 text-amber-700" },
  SOLD: { ar: "مباع", en: "Sold", color: "bg-primary/15 text-primary" },
  HELD: { ar: "محتجز", en: "Held", color: "bg-warning/15 text-warning" },
};

type SubTab = "plots" | "blocks" | "roads" | "corridors";

export default function SubdivisionPlanDetailPage() {
  const { id: projectId, planId } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [plan, setPlan] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [subTab, setSubTab] = React.useState<SubTab>("plots");
  const [showAddPlot, setShowAddPlot] = React.useState(false);
  const [showAddBlock, setShowAddBlock] = React.useState(false);
  const [showAddRoad, setShowAddRoad] = React.useState(false);
  const [showAddCorridor, setShowAddCorridor] = React.useState(false);

  React.useEffect(() => { load(); }, [planId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getSubdivisionPlanDetail(planId as string);
      setPlan(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>;
  if (!plan) return <div className="text-center py-20 text-neutral">{lang === "ar" ? "لم يتم العثور على المخطط" : "Subdivision plan not found"}</div>;

  const subTabs = [
    { key: "plots" as const, label: { ar: `القطع (${plan.plots?.length ?? 0})`, en: `Plots (${plan.plots?.length ?? 0})` } },
    { key: "blocks" as const, label: { ar: `البلكات (${plan.blocks?.length ?? 0})`, en: `Blocks (${plan.blocks?.length ?? 0})` } },
    { key: "roads" as const, label: { ar: `الطرق (${plan.roads?.length ?? 0})`, en: `Roads (${plan.roads?.length ?? 0})` } },
    { key: "corridors" as const, label: { ar: `ممرات المرافق (${plan.utilityCorridors?.length ?? 0})`, en: `Corridors (${plan.utilityCorridors?.length ?? 0})` } },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{plan.name}</h1>
          <p className="text-sm text-neutral mt-0.5">
            {lang === "ar" ? "مخطط تقسيم" : "Subdivision Plan"} · v{plan.version}
            {plan.nameArabic && ` · ${plan.nameArabic}`}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: lang === "ar" ? "القطع" : "Plots", value: plan.plots?.length ?? 0 },
          { label: lang === "ar" ? "البلكات" : "Blocks", value: plan.blocks?.length ?? 0 },
          { label: lang === "ar" ? "الطرق" : "Roads", value: plan.roads?.length ?? 0 },
          { label: lang === "ar" ? "المساحة الكلية" : "Total Area", value: plan.totalAreaSqm ? `${fmt(plan.totalAreaSqm)} م²` : "—" },
          { label: lang === "ar" ? "القابلة للتطوير" : "Developable", value: plan.developableAreaSqm ? `${fmt(plan.developableAreaSqm)} م²` : "—" },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-md shadow-card border border-border p-4">
            <span className="text-[10px] font-bold uppercase text-neutral">{item.label}</span>
            <p className="text-lg font-bold text-primary mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="bg-card rounded-md shadow-card border border-border">
        <div className="flex border-b border-border overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                subTab === tab.key ? "border-primary text-primary" : "border-transparent text-neutral hover:text-primary"
              }`}
            >
              {tab.label[lang]}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Plots ── */}
          {subTab === "plots" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "القطع" : "Plots"}</h4>
                <Button size="sm" className="gap-1 text-xs" onClick={() => setShowAddPlot(true)}>
                  <Plus size={14} />{lang === "ar" ? "إضافة قطعة" : "Add Plot"}
                </Button>
              </div>
              {plan.plots.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  <GridFour size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{lang === "ar" ? "لا توجد قطع" : "No plots"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="px-3 py-2 text-start text-[10px] font-bold uppercase text-neutral">#</th>
                        <th className="px-3 py-2 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "المساحة" : "Area"}</th>
                        <th className="px-3 py-2 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "المرحلة" : "Phase"}</th>
                        <th className="px-3 py-2 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "النوع" : "Product"}</th>
                        <th className="px-3 py-2 text-start text-[10px] font-bold uppercase text-neutral">{lang === "ar" ? "الحالة" : "Status"}</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.plots.map((p: any) => {
                        const sc = (PLOT_STATUS_CONFIG[p.status] ?? PLOT_STATUS_CONFIG["PLANNED"])!;
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                            <td className="px-3 py-2 font-bold text-primary">{p.plotNumber}</td>
                            <td className="px-3 py-2">{p.areaSqm ? `${fmt(p.areaSqm)} م²` : "—"}</td>
                            <td className="px-3 py-2">{p.phase ?? "—"}</td>
                            <td className="px-3 py-2 text-xs">{p.productType ?? "—"}</td>
                            <td className="px-3 py-2"><Badge className={`text-[10px] ${sc.color}`}>{sc[lang]}</Badge></td>
                            <td className="px-3 py-2">
                              <button onClick={async () => { await deletePlot(p.id); load(); }} className="text-neutral hover:text-destructive">
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {showAddPlot && (
                <AddPlotForm lang={lang} planId={planId as string} blocks={plan.blocks} onClose={() => setShowAddPlot(false)} onSuccess={() => { setShowAddPlot(false); load(); }} />
              )}
            </div>
          )}

          {/* ── Blocks ── */}
          {subTab === "blocks" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "البلكات" : "Blocks"}</h4>
                <Button size="sm" className="gap-1 text-xs" onClick={() => setShowAddBlock(true)}>
                  <Plus size={14} />{lang === "ar" ? "إضافة بلك" : "Add Block"}
                </Button>
              </div>
              {plan.blocks.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  <TreeStructure size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{lang === "ar" ? "لا توجد بلكات" : "No blocks"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {plan.blocks.map((b: any) => (
                    <div key={b.id} className="border border-border rounded-md p-4 hover:bg-muted/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-primary">{lang === "ar" ? "بلك" : "Block"} {b.blockNumber}</p>
                          <p className="text-xs text-neutral mt-1">{b.areaSqm ? `${fmt(b.areaSqm)} م²` : "—"} · {b.numberOfPlots ?? 0} {lang === "ar" ? "قطعة" : "plots"}</p>
                        </div>
                        <button onClick={async () => { await deleteBlock(b.id); load(); }} className="text-neutral hover:text-destructive">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showAddBlock && (
                <AddBlockForm lang={lang} planId={planId as string} onClose={() => setShowAddBlock(false)} onSuccess={() => { setShowAddBlock(false); load(); }} />
              )}
            </div>
          )}

          {/* ── Roads ── */}
          {subTab === "roads" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "الطرق" : "Roads"}</h4>
                <Button size="sm" className="gap-1 text-xs" onClick={() => setShowAddRoad(true)}>
                  <Plus size={14} />{lang === "ar" ? "إضافة طريق" : "Add Road"}
                </Button>
              </div>
              {plan.roads.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  <RoadIcon size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{lang === "ar" ? "لا توجد طرق" : "No roads"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plan.roads.map((r: any) => {
                    const typeLabel = ROAD_TYPE_LABELS[r.type]?.[lang] ?? r.type;
                    return (
                      <div key={r.id} className="flex items-center justify-between border border-border rounded-md p-3">
                        <div className="flex items-center gap-3">
                          <RoadIcon size={16} className="text-neutral" />
                          <span className="text-sm font-medium text-primary">{r.name || typeLabel}</span>
                          <Badge className="text-[10px] bg-muted text-neutral">{typeLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral">
                          {r.widthMeters && <span>{r.widthMeters}م عرض</span>}
                          {r.lengthMeters && <span>{fmt(r.lengthMeters)}م طول</span>}
                          <button onClick={async () => { await deleteRoad(r.id); load(); }} className="text-neutral hover:text-destructive">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {showAddRoad && (
                <AddRoadForm lang={lang} planId={planId as string} onClose={() => setShowAddRoad(false)} onSuccess={() => { setShowAddRoad(false); load(); }} />
              )}
            </div>
          )}

          {/* ── Utility Corridors ── */}
          {subTab === "corridors" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-primary">{lang === "ar" ? "ممرات المرافق" : "Utility Corridors"}</h4>
                <Button size="sm" className="gap-1 text-xs" onClick={() => setShowAddCorridor(true)}>
                  <Plus size={14} />{lang === "ar" ? "إضافة ممر" : "Add Corridor"}
                </Button>
              </div>
              {plan.utilityCorridors.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  <Lightning size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{lang === "ar" ? "لا توجد ممرات مرافق" : "No utility corridors"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plan.utilityCorridors.map((c: any) => {
                    const typeLabel = UTILITY_TYPE_LABELS[c.utilityType]?.[lang] ?? c.utilityType;
                    return (
                      <div key={c.id} className="flex items-center justify-between border border-border rounded-md p-3">
                        <div className="flex items-center gap-3">
                          <Lightning size={16} className="text-neutral" />
                          <span className="text-sm font-medium text-primary">{c.name || typeLabel}</span>
                          <Badge className="text-[10px] bg-muted text-neutral">{typeLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral">
                          {c.widthMeters && <span>{c.widthMeters}م عرض</span>}
                          {c.lengthMeters && <span>{fmt(c.lengthMeters)}م طول</span>}
                          <button onClick={async () => { await deleteUtilityCorridor(c.id); load(); }} className="text-neutral hover:text-destructive">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {showAddCorridor && (
                <AddCorridorForm lang={lang} planId={planId as string} onClose={() => setShowAddCorridor(false)} onSuccess={() => { setShowAddCorridor(false); load(); }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Forms ───────────────────────────────────────────────────────── */

function AddPlotForm({ lang, planId, blocks, onClose, onSuccess }: {
  lang: "ar" | "en"; planId: string; blocks: any[]; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ plotNumber: "", areaSqm: "", phase: "", blockId: "", productType: "" });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPlot({
        subdivisionPlanId: planId,
        plotNumber: form.plotNumber,
        areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : undefined,
        phase: form.phase ? parseInt(form.phase) : undefined,
        blockId: form.blockId || undefined,
        productType: form.productType || undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-4 border border-secondary/30 bg-secondary/5 rounded-md p-4 space-y-3">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input required value={form.plotNumber} onChange={set("plotNumber")} placeholder={lang === "ar" ? "رقم القطعة *" : "Plot # *"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input type="number" value={form.areaSqm} onChange={set("areaSqm")} placeholder={lang === "ar" ? "المساحة (م²)" : "Area (sqm)"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input type="number" value={form.phase} onChange={set("phase")} placeholder={lang === "ar" ? "المرحلة" : "Phase"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <select value={form.blockId} onChange={set("blockId")} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          <option value="">{lang === "ar" ? "بلك (اختياري)" : "Block (optional)"}</option>
          {blocks.map((b: any) => <option key={b.id} value={b.id}>{b.blockNumber}</option>)}
        </select>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Spinner size={14} className="animate-spin" /> : <Plus size={14} />}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </form>
    </div>
  );
}

function AddBlockForm({ lang, planId, onClose, onSuccess }: {
  lang: "ar" | "en"; planId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ blockNumber: "", areaSqm: "", numberOfPlots: "" });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createBlock({
        subdivisionPlanId: planId,
        blockNumber: form.blockNumber,
        areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : undefined,
        numberOfPlots: form.numberOfPlots ? parseInt(form.numberOfPlots) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-4 border border-secondary/30 bg-secondary/5 rounded-md p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <input required value={form.blockNumber} onChange={set("blockNumber")} placeholder={lang === "ar" ? "رقم البلك *" : "Block # *"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input type="number" value={form.areaSqm} onChange={set("areaSqm")} placeholder={lang === "ar" ? "المساحة (م²)" : "Area (sqm)"} className="border border-border rounded-md px-3 py-2 text-sm w-32" />
        <input type="number" value={form.numberOfPlots} onChange={set("numberOfPlots")} placeholder={lang === "ar" ? "عدد القطع" : "Plot count"} className="border border-border rounded-md px-3 py-2 text-sm w-28" />
        <Button type="submit" size="sm" disabled={saving}>{saving ? <Spinner size={14} className="animate-spin" /> : <Plus size={14} />}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </form>
    </div>
  );
}

function AddRoadForm({ lang, planId, onClose, onSuccess }: {
  lang: "ar" | "en"; planId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", type: "PRIMARY", widthMeters: "", lengthMeters: "" });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createRoad({
        subdivisionPlanId: planId,
        name: form.name || undefined,
        type: form.type,
        widthMeters: form.widthMeters ? parseFloat(form.widthMeters) : undefined,
        lengthMeters: form.lengthMeters ? parseFloat(form.lengthMeters) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-4 border border-secondary/30 bg-secondary/5 rounded-md p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
        <input value={form.name} onChange={set("name")} placeholder={lang === "ar" ? "اسم الطريق" : "Road name"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <select value={form.type} onChange={set("type")} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          {Object.entries(ROAD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
        </select>
        <input type="number" value={form.widthMeters} onChange={set("widthMeters")} placeholder={lang === "ar" ? "العرض (م)" : "Width (m)"} className="border border-border rounded-md px-3 py-2 text-sm w-28" />
        <input type="number" value={form.lengthMeters} onChange={set("lengthMeters")} placeholder={lang === "ar" ? "الطول (م)" : "Length (m)"} className="border border-border rounded-md px-3 py-2 text-sm w-28" />
        <Button type="submit" size="sm" disabled={saving}>{saving ? <Spinner size={14} className="animate-spin" /> : <Plus size={14} />}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </form>
    </div>
  );
}

function AddCorridorForm({ lang, planId, onClose, onSuccess }: {
  lang: "ar" | "en"; planId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", utilityType: "ELECTRICITY", widthMeters: "", lengthMeters: "" });
  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUtilityCorridor({
        subdivisionPlanId: planId,
        name: form.name || undefined,
        utilityType: form.utilityType,
        widthMeters: form.widthMeters ? parseFloat(form.widthMeters) : undefined,
        lengthMeters: form.lengthMeters ? parseFloat(form.lengthMeters) : undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-4 border border-secondary/30 bg-secondary/5 rounded-md p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
        <input value={form.name} onChange={set("name")} placeholder={lang === "ar" ? "اسم الممر" : "Corridor name"} className="border border-border rounded-md px-3 py-2 text-sm" />
        <select value={form.utilityType} onChange={set("utilityType")} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          {Object.entries(UTILITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
        </select>
        <input type="number" value={form.widthMeters} onChange={set("widthMeters")} placeholder={lang === "ar" ? "العرض (م)" : "Width (m)"} className="border border-border rounded-md px-3 py-2 text-sm w-28" />
        <input type="number" value={form.lengthMeters} onChange={set("lengthMeters")} placeholder={lang === "ar" ? "الطول (م)" : "Length (m)"} className="border border-border rounded-md px-3 py-2 text-sm w-28" />
        <Button type="submit" size="sm" disabled={saving}>{saving ? <Spinner size={14} className="animate-spin" /> : <Plus size={14} />}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </form>
    </div>
  );
}
