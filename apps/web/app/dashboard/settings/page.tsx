"use client";

import * as React from "react";
import {
  Buildings,
  PencilSimple,
  CheckCircle,
  IdentificationCard,
  Briefcase,
  ShieldCheck,
  MapPin,
  Phone as PhoneIcon,
  Globe,
  CaretDown,
  CaretRight,
  ClipboardText,
  LockKey,
  Users,
  House
} from "@phosphor-icons/react";
import { Button, Input } from "@repo/ui";
import Link from "next/link";
import { getOrganization, updateOrganization } from "../../actions/organization";
import { usePermissions } from "../../../hooks/usePermissions";
import { getUserPreferences, updateLandingPage } from "../../actions/preferences";

const selectClass = "w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function OrgSettingsPage() {
  const { can } = usePermissions();
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [org, setOrg] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showMocFields, setShowMocFields] = React.useState(false);
  const [showContactFields, setShowContactFields] = React.useState(false);
  const [showAddressFields, setShowAddressFields] = React.useState(false);
  const [landingPage, setLandingPage] = React.useState("/dashboard");
  const [savingLanding, setSavingLanding] = React.useState(false);

  // Form state
  const [form, setForm] = React.useState({
    name: "",
    nameArabic: "",
    nameEnglish: "",
    tradeNameArabic: "",
    tradeNameEnglish: "",
    crNumber: "",
    unifiedNumber: "",
    vatNumber: "",
    entityType: "",
    legalForm: "",
    registrationStatus: "",
    registrationDate: "",
    expiryDate: "",
    capitalAmountSar: "",
    mainActivityCode: "",
    mainActivityNameAr: "",
    contactMobile: "",
    contactPhone: "",
    contactEmail: "",
    contactWebsite: "",
    addrRegion: "",
    addrCity: "",
    addrDistrict: "",
    addrStreet: "",
    addrBuilding: "",
    addrPostal: "",
    addrAdditional: "",
    addrShort: "",
  });

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  React.useEffect(() => {
    getUserPreferences().then((prefs) => {
      if (prefs.landingPage) setLandingPage(prefs.landingPage);
    }).catch(() => {});
    getOrganization()
      .then((data: any) => {
        if (data) {
          setOrg(data);
          const ci = data.contactInfo || {};
          const na = data.nationalAddress || {};
          setForm({
            name: data.name || "",
            nameArabic: data.nameArabic || "",
            nameEnglish: data.nameEnglish || "",
            tradeNameArabic: data.tradeNameArabic || "",
            tradeNameEnglish: data.tradeNameEnglish || "",
            crNumber: data.crNumber || "",
            unifiedNumber: data.unifiedNumber || "",
            vatNumber: data.vatNumber || "",
            entityType: data.entityType || "",
            legalForm: data.legalForm || "",
            registrationStatus: data.registrationStatus || "",
            registrationDate: data.registrationDate ? data.registrationDate.split("T")[0] : "",
            expiryDate: data.expiryDate ? data.expiryDate.split("T")[0] : "",
            capitalAmountSar: data.capitalAmountSar ? String(Number(data.capitalAmountSar)) : "",
            mainActivityCode: data.mainActivityCode || "",
            mainActivityNameAr: data.mainActivityNameAr || "",
            contactMobile: ci.mobileNumber || "",
            contactPhone: ci.phoneNumber || "",
            contactEmail: ci.email || "",
            contactWebsite: ci.websiteUrl || "",
            addrRegion: na.region || "",
            addrCity: na.city || "",
            addrDistrict: na.district || "",
            addrStreet: na.streetName || "",
            addrBuilding: na.buildingNumber || "",
            addrPostal: na.postalCode || "",
            addrAdditional: na.additionalNumber || "",
            addrShort: na.shortAddress || "",
          });
          // Show optional sections if they have data
          if (data.entityType || data.legalForm) setShowMocFields(true);
          if (ci.mobileNumber || ci.email) setShowContactFields(true);
          if (na.region || na.city) setShowAddressFields(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateOrganization({
        name: form.name,
        nameArabic: form.nameArabic || undefined,
        nameEnglish: form.nameEnglish || undefined,
        tradeNameArabic: form.tradeNameArabic || undefined,
        tradeNameEnglish: form.tradeNameEnglish || undefined,
        crNumber: form.crNumber || undefined,
        unifiedNumber: form.unifiedNumber || undefined,
        vatNumber: form.vatNumber || undefined,
        entityType: form.entityType || undefined,
        legalForm: form.legalForm || undefined,
        registrationStatus: form.registrationStatus || undefined,
        registrationDate: form.registrationDate || undefined,
        expiryDate: form.expiryDate || undefined,
        capitalAmountSar: form.capitalAmountSar ? Number(form.capitalAmountSar) : undefined,
        mainActivityCode: form.mainActivityCode || undefined,
        mainActivityNameAr: form.mainActivityNameAr || undefined,
        contactInfo: {
          mobileNumber: form.contactMobile,
          phoneNumber: form.contactPhone,
          email: form.contactEmail,
          websiteUrl: form.contactWebsite,
        },
        nationalAddress: {
          region: form.addrRegion,
          city: form.addrCity,
          district: form.addrDistrict,
          streetName: form.addrStreet,
          buildingNumber: form.addrBuilding,
          postalCode: form.addrPostal,
          additionalNumber: form.addrAdditional,
          shortAddress: form.addrShort,
        },
      });
      setOrg(updated);
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
          <div className={`bg-card rounded-md shadow-card border border-border overflow-hidden ${loading ? "animate-pulse" : ""}`}>
            {/* Header with logo */}
            <div className="p-8 border-b border-border bg-muted/5">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-md bg-primary-deep flex items-center justify-center text-secondary relative group cursor-pointer border-2 border-primary/5">
                  <Buildings size={40} weight="duotone" />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-sm">
                    <PencilSimple size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary font-primary">{form.name || "—"}</h2>
                  <p className="text-xs text-neutral mt-1 uppercase tracking-widest font-latin">
                    {form.tradeNameEnglish || "Mimaric"} • {org?.type ?? "Developer"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 font-primary">
              {/* Core fields */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "اسم المنظمة" : "Organization Name"}</label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الاسم الرسمي بالعربي" : "Official Arabic Name"}</label>
                  <Input value={form.nameArabic} onChange={(e) => set("nameArabic", e.target.value)} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الاسم الرسمي بالإنجليزي" : "Official English Name"}</label>
                  <Input value={form.nameEnglish} onChange={(e) => set("nameEnglish", e.target.value)} dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رقم السجل التجاري (CR)" : "Commercial Registration"}</label>
                  <div className="relative">
                    <IdentificationCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                    <Input placeholder="1010XXXXXX" className="pr-10 font-latin text-sm" value={form.crNumber} onChange={(e) => set("crNumber", e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الرقم الضريبي (VAT)" : "VAT Number"}</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                    <Input placeholder="3000XXXXXX00003" className="pr-10 font-latin text-sm" value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الرقم الموحد" : "Unified Number"}</label>
                <Input placeholder="70XXXXXXXX" className="font-latin text-sm" value={form.unifiedNumber} onChange={(e) => set("unifiedNumber", e.target.value)} dir="ltr" />
              </div>

              {/* MOC Section */}
              <button
                type="button"
                onClick={() => setShowMocFields(!showMocFields)}
                className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors w-full pt-2"
              >
                <CaretDown size={14} className={`transition-transform ${showMocFields ? "rotate-180" : ""}`} />
                {lang === "ar" ? "بيانات وزارة التجارة (MOC)" : "Ministry of Commerce Data (MOC)"}
              </button>

              {showMocFields && (
                <div className="space-y-6 p-6 bg-muted/10 rounded-md border border-border animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "نوع المنشأة" : "Entity Type"}</label>
                      <select value={form.entityType} onChange={(e) => set("entityType", e.target.value)} className={selectClass}>
                        <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                        <option value="ESTABLISHMENT">{lang === "ar" ? "مؤسسة" : "Establishment"}</option>
                        <option value="COMPANY">{lang === "ar" ? "شركة" : "Company"}</option>
                        <option value="BRANCH">{lang === "ar" ? "فرع" : "Branch"}</option>
                        <option value="PROFESSIONAL_ENTITY">{lang === "ar" ? "كيان مهني" : "Professional Entity"}</option>
                        <option value="FOREIGN_COMPANY_BRANCH">{lang === "ar" ? "فرع شركة أجنبية" : "Foreign Company Branch"}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الشكل القانوني" : "Legal Form"}</label>
                      <select value={form.legalForm} onChange={(e) => set("legalForm", e.target.value)} className={selectClass}>
                        <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                        <option value="SOLE_PROPRIETORSHIP">{lang === "ar" ? "مؤسسة فردية" : "Sole Proprietorship"}</option>
                        <option value="LIMITED_LIABILITY_COMPANY">{lang === "ar" ? "شركة ذات مسؤولية محدودة" : "LLC"}</option>
                        <option value="JOINT_STOCK_COMPANY">{lang === "ar" ? "شركة مساهمة" : "Joint Stock Company"}</option>
                        <option value="SIMPLIFIED_JOINT_STOCK_COMPANY">{lang === "ar" ? "شركة مساهمة مبسطة" : "Simplified JSC"}</option>
                        <option value="GENERAL_PARTNERSHIP">{lang === "ar" ? "شركة تضامنية" : "General Partnership"}</option>
                        <option value="LIMITED_PARTNERSHIP">{lang === "ar" ? "شركة توصية" : "Limited Partnership"}</option>
                        <option value="PROFESSIONAL_COMPANY">{lang === "ar" ? "شركة مهنية" : "Professional Company"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "حالة التسجيل" : "Registration Status"}</label>
                      <select value={form.registrationStatus} onChange={(e) => set("registrationStatus", e.target.value)} className={selectClass}>
                        <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                        <option value="ACTIVE_REG">{lang === "ar" ? "نشط" : "Active"}</option>
                        <option value="EXPIRED_REG">{lang === "ar" ? "منتهي" : "Expired"}</option>
                        <option value="SUSPENDED_REG">{lang === "ar" ? "موقوف" : "Suspended"}</option>
                        <option value="CANCELLED_REG">{lang === "ar" ? "ملغي" : "Cancelled"}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رأس المال (ر.س)" : "Capital (SAR)"}</label>
                      <Input type="number" value={form.capitalAmountSar} onChange={(e) => set("capitalAmountSar", e.target.value)} placeholder="500000" dir="ltr" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "تاريخ التسجيل" : "Registration Date"}</label>
                      <Input type="date" value={form.registrationDate} onChange={(e) => set("registrationDate", e.target.value)} className="font-dm-sans" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</label>
                      <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className="font-dm-sans" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رمز النشاط" : "Activity Code"}</label>
                      <Input value={form.mainActivityCode} onChange={(e) => set("mainActivityCode", e.target.value)} placeholder="411001" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "اسم النشاط" : "Activity Name"}</label>
                      <Input value={form.mainActivityNameAr} onChange={(e) => set("mainActivityNameAr", e.target.value)} placeholder={lang === "ar" ? "التطوير العقاري" : "Real Estate Development"} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الاسم التجاري بالعربي" : "Trade Name (Arabic)"}</label>
                      <Input value={form.tradeNameArabic} onChange={(e) => set("tradeNameArabic", e.target.value)} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الاسم التجاري بالإنجليزي" : "Trade Name (English)"}</label>
                      <Input value={form.tradeNameEnglish} onChange={(e) => set("tradeNameEnglish", e.target.value)} dir="ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info Section */}
              <button
                type="button"
                onClick={() => setShowContactFields(!showContactFields)}
                className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors w-full pt-2"
              >
                <CaretDown size={14} className={`transition-transform ${showContactFields ? "rotate-180" : ""}`} />
                {lang === "ar" ? "بيانات التواصل" : "Contact Information"}
              </button>

              {showContactFields && (
                <div className="space-y-6 p-6 bg-muted/10 rounded-md border border-border animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رقم الجوال" : "Mobile"}</label>
                      <Input value={form.contactMobile} onChange={(e) => set("contactMobile", e.target.value)} placeholder="05XXXXXXXX" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الهاتف الثابت" : "Phone"}</label>
                      <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="011XXXXXXX" dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                      <Input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="info@company.sa" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الموقع الإلكتروني" : "Website"}</label>
                      <Input value={form.contactWebsite} onChange={(e) => set("contactWebsite", e.target.value)} placeholder="https://company.sa" dir="ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* National Address Section */}
              <button
                type="button"
                onClick={() => setShowAddressFields(!showAddressFields)}
                className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors w-full pt-2"
              >
                <CaretDown size={14} className={`transition-transform ${showAddressFields ? "rotate-180" : ""}`} />
                {lang === "ar" ? "العنوان الوطني" : "National Address"}
              </button>

              {showAddressFields && (
                <div className="space-y-6 p-6 bg-muted/10 rounded-md border border-border animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "المنطقة" : "Region"}</label>
                      <Input value={form.addrRegion} onChange={(e) => set("addrRegion", e.target.value)} placeholder={lang === "ar" ? "منطقة الرياض" : "Riyadh Region"} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "المدينة" : "City"}</label>
                      <Input value={form.addrCity} onChange={(e) => set("addrCity", e.target.value)} placeholder={lang === "ar" ? "الرياض" : "Riyadh"} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الحي" : "District"}</label>
                      <Input value={form.addrDistrict} onChange={(e) => set("addrDistrict", e.target.value)} placeholder={lang === "ar" ? "العليا" : "Al Olaya"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "اسم الشارع" : "Street"}</label>
                      <Input value={form.addrStreet} onChange={(e) => set("addrStreet", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "رقم المبنى" : "Building No."}</label>
                      <Input value={form.addrBuilding} onChange={(e) => set("addrBuilding", e.target.value)} placeholder="1234" dir="ltr" maxLength={4} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الرمز البريدي" : "Postal Code"}</label>
                      <Input value={form.addrPostal} onChange={(e) => set("addrPostal", e.target.value)} placeholder="12211" dir="ltr" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الرقم الإضافي" : "Additional No."}</label>
                      <Input value={form.addrAdditional} onChange={(e) => set("addrAdditional", e.target.value)} placeholder="5678" dir="ltr" maxLength={4} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "العنوان المختصر" : "Short Address"}</label>
                      <Input value={form.addrShort} onChange={(e) => set("addrShort", e.target.value)} placeholder="ABCD1234" dir="ltr" maxLength={8} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button className="gap-2" onClick={handleSave} disabled={saving}>
                  <CheckCircle size={18} />
                  {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-primary-deep p-8 rounded-md text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L10 40 L40 40' stroke='white' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='white'/%3E%3C/svg%3E")` }} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary font-latin">{lang === "ar" ? "حالة التوثيق" : "Verification Status"}</h3>
            <div className="flex items-center gap-4 p-4 bg-card/5 rounded border border-white/10">
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

          {/* Settings Navigation */}
          <div className="bg-card p-6 rounded-md shadow-card border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الإعدادات" : "Settings"}</h3>
            <Link href="/dashboard/settings/team" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors group">
              <div className="p-2 bg-primary/5 rounded text-primary group-hover:bg-primary/10 transition-colors">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary font-primary">{lang === "ar" ? "فريق العمل" : "Team"}</p>
                <p className="text-[10px] text-neutral font-primary">{lang === "ar" ? "إدارة الأعضاء والأدوار" : "Manage members & roles"}</p>
              </div>
            </Link>
            {can("audit:read") && (
              <Link href="/dashboard/settings/audit" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors group">
                <div className="p-2 bg-secondary/10 rounded text-secondary group-hover:bg-secondary/15 transition-colors">
                  <ClipboardText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary font-primary">{lang === "ar" ? "سجل المراجعة" : "Audit Trail"}</p>
                  <p className="text-[10px] text-neutral font-primary">{lang === "ar" ? "تتبع الوصول والتعديلات" : "Track access & changes"}</p>
                </div>
              </Link>
            )}
            <Link href="/dashboard/settings/security" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors group">
              <div className="p-2 bg-amber-500/10 rounded text-amber-600 group-hover:bg-amber-500/15 transition-colors">
                <LockKey size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary font-primary">{lang === "ar" ? "الأمان" : "Security"}</p>
                <p className="text-[10px] text-neutral font-primary">{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</p>
              </div>
            </Link>
          </div>

          {/* Landing Page Preference */}
          <div className="bg-card p-6 rounded-md shadow-card border border-border space-y-4">
            <div className="flex items-center gap-2">
              <House size={18} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "الصفحة الرئيسية" : "Landing Page"}</h3>
            </div>
            <p className="text-[10px] text-neutral font-primary">{lang === "ar" ? "اختر الصفحة التي تفتح بعد تسجيل الدخول." : "Choose which page opens after login."}</p>
            <select
              value={landingPage}
              onChange={async (e) => {
                const value = e.target.value;
                setLandingPage(value);
                setSavingLanding(true);
                try { await updateLandingPage(value); } catch {} finally { setSavingLanding(false); }
              }}
              className={`${selectClass} text-sm`}
            >
              <option value="/dashboard">{lang === "ar" ? "نظرة عامة" : "Overview"}</option>
              <option value="/dashboard/projects">{lang === "ar" ? "المشاريع" : "Projects"}</option>
              <option value="/dashboard/units">{lang === "ar" ? "الوحدات" : "Units"}</option>
              <option value="/dashboard/sales/customers">{lang === "ar" ? "العملاء" : "Customers"}</option>
              <option value="/dashboard/sales/contracts">{lang === "ar" ? "المبيعات" : "Sales"}</option>
              <option value="/dashboard/leases">{lang === "ar" ? "الإيجارات" : "Leases"}</option>
              <option value="/dashboard/finance">{lang === "ar" ? "المالية" : "Finance"}</option>
              <option value="/dashboard/maintenance">{lang === "ar" ? "الصيانة" : "Maintenance"}</option>
              <option value="/dashboard/reports">{lang === "ar" ? "التقارير" : "Reports"}</option>
              <option value="/dashboard/settings">{lang === "ar" ? "الإعدادات" : "Settings"}</option>
            </select>
            {savingLanding && <p className="text-[10px] text-secondary">{lang === "ar" ? "جاري الحفظ..." : "Saving..."}</p>}
          </div>

          {/* Quick Info Card */}
          {org && (
            <div className="bg-card p-6 rounded-md shadow-card border border-border space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral">{lang === "ar" ? "معلومات سريعة" : "Quick Info"}</h3>
              {form.crNumber && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral">{lang === "ar" ? "سجل تجاري" : "CR"}</span>
                  <span className="font-bold text-primary font-dm-sans">{form.crNumber}</span>
                </div>
              )}
              {form.vatNumber && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral">{lang === "ar" ? "رقم ضريبي" : "VAT"}</span>
                  <span className="font-bold text-primary font-dm-sans">{form.vatNumber}</span>
                </div>
              )}
              {form.entityType && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral">{lang === "ar" ? "نوع المنشأة" : "Entity"}</span>
                  <span className="font-bold text-primary">{form.entityType.replace(/_/g, " ")}</span>
                </div>
              )}
              {form.registrationStatus && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral">{lang === "ar" ? "حالة السجل" : "Status"}</span>
                  <span className="font-bold text-secondary">{form.registrationStatus === "ACTIVE_REG" ? (lang === "ar" ? "نشط" : "Active") : form.registrationStatus.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
