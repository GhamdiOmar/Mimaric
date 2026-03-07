"use client";

import * as React from "react";
import { MapPin, Plus, Spinner, MagnifyingGlass, Eye, NavigationArrow } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
import { getLandParcels, createLandParcel } from "../../actions/land";
import { formatDualDate } from "../../../lib/hijri";
import MapPicker from "../../../components/MapPicker";

const statusConfig: Record<string, { label: { ar: string; en: string }; variant: string }> = {
  LAND_IDENTIFIED: { label: { ar: "تم التحديد", en: "Identified" }, variant: "reserved" },
  LAND_UNDER_REVIEW: { label: { ar: "قيد المراجعة", en: "Under Review" }, variant: "draft" },
  LAND_ACQUIRED: { label: { ar: "تم الاستحواذ", en: "Acquired" }, variant: "available" },
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
  const [lang] = React.useState<"ar" | "en">("ar");
  const [parcels, setParcels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => { loadParcels(); }, []);

  async function loadParcels() {
    setLoading(true);
    try {
      const data = await getLandParcels();
      setParcels(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = parcels.filter((p) =>
    !search || p.name.includes(search) || p.deedNumber?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{lang === "ar" ? "إدارة الأراضي" : "Land Management"}</h1>
          <p className="text-sm text-neutral mt-1">{lang === "ar" ? "تتبع الأراضي من التحديد إلى الاستحواذ" : "Track land from identification to acquisition"}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)} style={{ display: "inline-flex" }}>
          <Plus size={16} />
          {lang === "ar" ? "إضافة أرض" : "Add Land"}
        </Button>
      </div>

      <div className="relative w-full md:w-80">
        <MagnifyingGlass size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "ar" ? "بحث بالاسم أو رقم الصك..." : "Search by name or deed..."}
          className="w-full border border-border rounded-md py-2 pr-10 pl-4 text-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="animate-spin text-primary" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-md shadow-card border border-border p-12 text-center">
          <MapPin size={48} className="text-neutral mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد أراضٍ" : "No Land Parcels"}</h3>
          <p className="text-sm text-neutral mt-1">{lang === "ar" ? "ابدأ بإضافة أرض جديدة" : "Start by adding a new land parcel"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "الاسم" : "Name"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "رقم الصك" : "Deed #"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "الموقع" : "Location"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "الاستخدام" : "Land Use"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral">{lang === "ar" ? "التاريخ" : "Date"}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase text-neutral"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const config = statusConfig[p.status] ?? statusConfig.LAND_IDENTIFIED!;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-neutral" dir="ltr">{p.deedNumber || "—"}</td>
                    <td className="px-4 py-3 text-neutral text-xs">{[p.city, p.district].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3">{p.totalAreaSqm ? fmt(p.totalAreaSqm) : "—"}</td>
                    <td className="px-4 py-3 text-xs">{landUseLabels[p.landUse] ?? p.landUse ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={config.variant as any} className="text-xs">{config.label[lang]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral">{formatDualDate(p.createdAt, lang)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/land/${p.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1">
                          <Eye size={14} />{lang === "ar" ? "عرض" : "View"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Land Modal */}
      {showModal && <AddLandModal lang={lang} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadParcels(); }} />}
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "إضافة أرض جديدة" : "Add New Land"}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "اسم الأرض *" : "Land Name *"}</label>
            <input required value={form.name} onChange={set("name")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "رقم القطعة" : "Parcel #"}</label>
              <input value={form.parcelNumber} onChange={set("parcelNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "رقم الصك" : "Deed #"}</label>
              <input value={form.deedNumber} onChange={set("deedNumber")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
              <input type="number" value={form.totalAreaSqm} onChange={set("totalAreaSqm")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الاستخدام" : "Land Use"}</label>
              <select value={form.landUse} onChange={set("landUse")} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white">
                <option value="">—</option>
                <option value="RESIDENTIAL_LAND">سكني</option>
                <option value="COMMERCIAL_LAND">تجاري</option>
                <option value="INDUSTRIAL_LAND">صناعي</option>
                <option value="MIXED_USE_LAND">متعدد الاستخدام</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المنطقة" : "Region"}</label><input value={form.region} onChange={set("region")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المدينة" : "City"}</label><input value={form.city} onChange={set("city")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "الحي" : "District"}</label><input value={form.district} onChange={set("district")} className="w-full border border-border rounded-md px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral mb-1 flex items-center gap-1">
              <NavigationArrow size={12} />
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
              <p className="text-[10px] text-neutral mt-1" dir="ltr">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "المالك" : "Owner"}</label>
              <input value={form.landOwner} onChange={set("landOwner")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral mb-1">{lang === "ar" ? "القيمة التقديرية (ر.س)" : "Est. Value (SAR)"}</label>
              <input type="number" value={form.estimatedValueSar} onChange={set("estimatedValueSar")} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
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
