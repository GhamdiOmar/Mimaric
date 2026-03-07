"use client";

import * as React from "react";
import {
  Buildings,
  PencilSimple,
  CheckCircle,
  IdentificationCard,
  Briefcase,
  ShieldCheck
} from "@phosphor-icons/react";
import { Button, Input } from "@repo/ui";
import { getOrganization, updateOrganization } from "../../actions/organization";

type Organization = {
  id: string;
  name: string;
  crNumber: string | null;
  vatNumber: string | null;
  type: string;
};

export default function OrgSettingsPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [org, setOrg] = React.useState<Organization | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [crNumber, setCrNumber] = React.useState("");
  const [vatNumber, setVatNumber] = React.useState("");

  React.useEffect(() => {
    getOrganization()
      .then((data) => {
        if (data) {
          setOrg(data as Organization);
          setName(data.name);
          setCrNumber(data.crNumber ?? "");
          setVatNumber(data.vatNumber ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateOrganization({ name, crNumber, vatNumber });
      setOrg(updated as Organization);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "إعدادات المنظمة" : "Organization Settings"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة الملف التعريفي والبيانات التجارية لمنشأتك." : "Manage your organization's profile and commercial data."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white rounded-md shadow-card border border-border overflow-hidden ${loading ? "animate-pulse" : ""}`}>
            <div className="p-8 border-b border-border bg-muted/5">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-md bg-primary-deep flex items-center justify-center text-secondary relative group cursor-pointer border-2 border-primary/5">
                  <Buildings size={40} weight="duotone" />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-sm">
                    <PencilSimple size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary font-primary">{name || "—"}</h2>
                  <p className="text-xs text-neutral mt-1 uppercase tracking-widest font-latin">Mimaric Partner • {org?.type ?? "Developer"}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 font-primary">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "اسم المنظمة" : "Organization Name"}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رقم السجل التجاري (CR)" : "Commercial Registration"}</label>
                  <div className="relative">
                    <IdentificationCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                    <Input placeholder="1010XXXXXX" className="pr-10 font-latin text-sm" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الرقم الضريبي (VAT)" : "VAT Number"}</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                    <Input placeholder="3000XXXXXX00003" className="pr-10 font-latin text-sm" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="gap-2" onClick={handleSave} disabled={saving}>
                  <CheckCircle size={18} />
                  {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary-deep p-8 rounded-md text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L10 40 L40 40' stroke='white' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='white'/%3E%3C/svg%3E")` }} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary font-latin">{lang === "ar" ? "حالة التوثيق" : "Verification Status"}</h3>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/10">
              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <CheckCircle weight="fill" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold font-primary">{lang === "ar" ? "موثق لدى ميماريك" : "Verified by Mimaric"}</p>
                <p className="text-[10px] text-white/50 font-latin">Active since 2024</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-white/10">
              <p className="text-xs leading-relaxed text-white/70 font-primary">
                {lang === "ar"
                  ? "ملفك الموثق يمنحك صلاحية الوصول إلى الربط مع منصة إيجار ونظام الفوترة الإلكترونية فاتورة."
                  : "Your verified profile grants access to Ejar integration and ZATCA e-Invoicing."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
