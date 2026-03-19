"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { MapPin, Plus, Loader2, Search, Eye, Navigation, Download, LandPlot, FileCheck, DollarSign, Trash2, Globe } from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Card, CardContent, KPICard, PageIntro, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@repo/ui";
import Link from "next/link";
import { getLandParcels, createLandParcel, deleteLandParcel } from "../../actions/land";
import { formatDualDate } from "../../../lib/hijri";
import { exportToExcel } from "../../../lib/export";
import MapPicker from "../../../components/MapPicker";

const statusConfig: Record<string, { label: { ar: string; en: string }; variant: string; className: string }> = {
  LAND_IDENTIFIED: { label: { ar: "تم التحديد", en: "Identified" }, variant: "draft", className: "bg-info/15 text-info border border-info/30 font-bold" },
  LAND_UNDER_REVIEW: { label: { ar: "قيد المراجعة", en: "Under Review" }, variant: "maintenance", className: "bg-amber-500/15 text-amber-700 border border-amber-500/30 font-bold" },
  LAND_ACQUIRED: { label: { ar: "تم الاستحواذ", en: "Acquired" }, variant: "available", className: "bg-secondary/15 text-secondary border border-secondary/30 font-bold" },
};

const landUseLabels: Record<string, string> = {
  RESIDENTIAL_LAND: "سكني",
  COMMERCIAL_LAND: "تجاري",
  INDUSTRIAL_LAND: "صناعي",
  AGRICULTURAL_LAND: "زراعي",
  MIXED_USE_LAND: "متعدد",
};

const fmt = (n: number) => new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

export default function LandPage() {
  const { lang } = useLanguage();
  const [parcels, setParcels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => { loadParcels(); }, []);

  async function loadParcels() {
    setLoading(true);
    try {
      const data = await getLandParcels();
      setParcels(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLandParcel(deleteTarget.id);
      setDeleteTarget(null);
      loadParcels();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const handleExport = async () => {
    const columns = [
      { header: lang === "ar" ? "الاسم" : "Name", key: "name", width: 25 },
      { header: lang === "ar" ? "الموقع" : "Location", key: "location", width: 25, render: () => "" },
      { header: lang === "ar" ? "الحالة" : "Status", key: "status", width: 20, render: (val: string) => statusConfig[val]?.label[lang] ?? val },
      { header: lang === "ar" ? "المساحة (م²)" : "Area (sqm)", key: "areaSqm", width: 18, render: () => "" },
      { header: lang === "ar" ? "درجة الملاءمة" : "Suitability Score", key: "suitabilityScore", width: 18, render: (val: number | null) => val != null ? `${val}%` : "—" },
      { header: lang === "ar" ? "تاريخ الإنشاء" : "Created Date", key: "createdDate", width: 20 },
    ];
    const data = filtered.map((p: any) => ({
      ...p,
      location: [p.city, p.district].filter(Boolean).join(", ") || "—",
      areaSqm: p.totalAreaSqm ? fmt(p.totalAreaSqm) : "—",
      createdDate: new Date(p.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-CA"),
    }));
    await exportToExcel({
      data,
      columns,
      filename: "Mimaric_Land_Parcels",
      lang,
      title: lang === "ar" ? "الأراضي" : "Land Parcels",
    });
  };

  const filtered = parcels.filter((p) =>
    !search || p.name.includes(search) || p.deedNumber?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageIntro
        title={lang === "ar" ? "الأراضي" : "Land"}
        description={lang === "ar" ? "إدارة محفظة الأراضي ومتابعة عمليات الاستحواذ والتقييم" : "Manage land portfolio, track acquisitions and valuations"}
        actions={
          <>
            <Button className="gap-2" onClick={() => setShowModal(true)} style={{ display: "inline-flex" }}>
              <Plus className="h-4 w-4" />
              {lang === "ar" ? "إضافة قطعة" : "Add Parcel"}
            </Button>
            <Link href="/dashboard/gis/land-bank">
              <Button variant="outline" size="sm" style={{ display: "inline-flex" }}>
                <Globe className="w-4 h-4 me-1.5" />
                {lang === "ar" ? "خريطة بنك الأراضي" : "Land Bank Map"}
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" style={{ display: "inline-flex" }} onClick={handleExport}>
              <Download className="h-4 w-4" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          label={lang === "ar" ? "إجمالي القطع" : "Total Parcels"}
          value={loading ? "—" : parcels.length}
          subtitle={lang === "ar" ? "جميع القطع المسجلة" : "All registered parcels"}
          icon={<LandPlot className="h-5 w-5" />}
          accentColor="primary"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "تم الاستحواذ" : "Acquired"}
          value={loading ? "—" : parcels.filter((p: any) => p.status === "LAND_ACQUIRED").length}
          subtitle={lang === "ar" ? "أراضٍ مكتملة الاستحواذ" : "Fully acquired land parcels"}
          icon={<FileCheck className="h-5 w-5" />}
          accentColor="success"
          loading={loading}
        />
        <KPICard
          label={lang === "ar" ? "إجمالي المساحة (م²)" : "Total Area (sqm)"}
          value={loading ? "—" : fmt(parcels.reduce((s: number, p: any) => s + (Number(p.totalAreaSqm) || 0), 0))}
          subtitle={lang === "ar" ? "مجموع مساحات جميع القطع" : "Combined area of all parcels"}
          icon={<MapPin className="h-5 w-5" />}
          accentColor="info"
          loading={loading}
        />
      </div>

      <div className="relative w-full md:w-80">
        <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "ar" ? "بحث بالاسم أو رقم الصك..." : "Search by name or deed..."}
          className="w-full border border-border rounded-md py-2 pr-10 pl-4 text-sm bg-card"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد أراضٍ" : "No Land Parcels"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "ابدأ بإضافة أرض جديدة" : "Start by adding a new land parcel"}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "الاسم" : "Name"}</TableHead>
                <TableHead>{lang === "ar" ? "رقم الصك" : "Deed #"}</TableHead>
                <TableHead>{lang === "ar" ? "الموقع" : "Location"}</TableHead>
                <TableHead>{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</TableHead>
                <TableHead>{lang === "ar" ? "الاستخدام" : "Land Use"}</TableHead>
                <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{lang === "ar" ? "الملاءمة" : "Score"}</TableHead>
                <TableHead>{lang === "ar" ? "التاريخ" : "Date"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => {
                const config = statusConfig[p.status] ?? statusConfig.LAND_IDENTIFIED!;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-primary">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{p.deedNumber || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{[p.city, p.district].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell>{p.totalAreaSqm ? fmt(p.totalAreaSqm) : "—"}</TableCell>
                    <TableCell className="text-xs">{landUseLabels[p.landUse] ?? p.landUse ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={config.variant as any} className={`text-xs ${config.className}`}>{config.label[lang]}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.suitabilityScore !== null && p.suitabilityScore !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.suitabilityScore >= 70 ? "bg-secondary" : p.suitabilityScore >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                              style={{ width: `${p.suitabilityScore}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${p.suitabilityScore >= 70 ? "text-secondary" : p.suitabilityScore >= 40 ? "text-amber-600" : "text-destructive"}`}>
                            {p.suitabilityScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDualDate(p.createdAt, lang)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/land/${p.id}`}>
                          <Button size="sm" variant="secondary" className="text-xs h-7 px-2 gap-1 hover:text-secondary hover:border-secondary/50" style={{ display: "inline-flex" }}>
                            <Eye className="h-3.5 w-3.5" />{lang === "ar" ? "عرض" : "View"}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          style={{ display: "inline-flex" }}
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {lang === "ar" ? "حذف" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Land Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <AddLandModal lang={lang} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadParcels(); }} />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف جميع البيانات المرتبطة بها نهائياً.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? All related data will be permanently removed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              style={{ display: "inline-flex" }}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              style={{ display: "inline-flex" }}
              className="gap-1"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {lang === "ar" ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddLandModal({ lang, onClose, onSuccess }: { lang: "ar" | "en"; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", parcelNumber: "", deedNumber: "", landUse: "", totalAreaSqm: "", region: "", city: "", district: "", estimatedValueSar: "", landOwner: "", landOwnerType: "" });
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createLandParcel({
        ...form,
        totalAreaSqm: form.totalAreaSqm ? parseFloat(form.totalAreaSqm) : undefined,
        estimatedValueSar: form.estimatedValueSar ? parseFloat(form.estimatedValueSar) : undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const set = (key: string) => (e: any) => setForm({ ...form, [key]: e.target.value });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{lang === "ar" ? "إضافة أرض جديدة" : "Add New Land"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "اسم الأرض *" : "Land Name *"}</label>
            <input required value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "رقم القطعة" : "Parcel #"}</label>
              <input value={form.parcelNumber} onChange={set("parcelNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "رقم الصك" : "Deed #"}</label>
              <input value={form.deedNumber} onChange={set("deedNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
              <input type="number" value={form.totalAreaSqm} onChange={set("totalAreaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الاستخدام" : "Land Use"}</label>
              <select value={form.landUse} onChange={set("landUse")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">—</option>
                <option value="RESIDENTIAL_LAND">سكني</option>
                <option value="COMMERCIAL_LAND">تجاري</option>
                <option value="INDUSTRIAL_LAND">صناعي</option>
                <option value="MIXED_USE_LAND">متعدد الاستخدام</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المنطقة" : "Region"}</label><input value={form.region} onChange={set("region")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المدينة" : "City"}</label><input value={form.city} onChange={set("city")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "الحي" : "District"}</label><input value={form.district} onChange={set("district")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {lang === "ar" ? "حدد الموقع على الخريطة" : "Select Location on Map"}
            </label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
              height="200px"
              zoom={6}
            />
            {latitude && longitude && (
              <p className="text-[10px] text-muted-foreground mt-1" dir="ltr">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "المالك" : "Owner"}</label>
              <input value={form.landOwner} onChange={set("landOwner")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{lang === "ar" ? "القيمة التقديرية (ر.س)" : "Est. Value (SAR)"}</label>
              <input type="number" value={form.estimatedValueSar} onChange={set("estimatedValueSar")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
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
