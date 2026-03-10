"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  Plus,
  Buildings,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Trash,
  Spinner,
  PencilSimple,
  FileText,
  CloudArrowUp,
  MapTrifold,
} from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { createProject, registerProjectDocument } from "../../../actions/projects";
import { getAcquiredLands, updateLandStatus } from "../../../actions/land";
import { useRouter } from "next/navigation";
import MapPicker from "../../../../components/MapPicker";
import { UploadButton } from "../../../../lib/uploadthing";

const steps = [
  { id: "basic", label: { ar: "بيانات المشروع", en: "Project Details" } },
  { id: "physical", label: { ar: "المخطط الإنشائي", en: "Physical Layout" } },
  { id: "documents", label: { ar: "وثائق بلدي", en: "Balady Documents" } },
  { id: "review", label: { ar: "مراجعة واعتماد", en: "Review & Confirm" } },
];

const landUseOptions = [
  { value: "RESIDENTIAL_LAND", ar: "سكني", en: "Residential" },
  { value: "COMMERCIAL_LAND", ar: "تجاري", en: "Commercial" },
  { value: "INDUSTRIAL_LAND", ar: "صناعي", en: "Industrial" },
  { value: "MIXED_USE_LAND", ar: "متعدد الاستخدام", en: "Mixed Use" },
  { value: "OTHER_LAND_USE", ar: "أخرى", en: "Other" },
];

const buildingTypeOptions = [
  { value: "residential", ar: "سكني", en: "Residential" },
  { value: "commercial", ar: "تجاري", en: "Commercial" },
  { value: "mixed", ar: "متعدد", en: "Mixed" },
  { value: "villa", ar: "فيلا", en: "Villa" },
  { value: "tower", ar: "برج", en: "Tower" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(n);

type BuildingDraft = {
  id: string;
  name: string;
  numberOfFloors: number;
  buildingAreaSqm: number;
  buildingType: string;
  unitCount: number;
};

type UploadedDoc = {
  name: string;
  url: string;
  type: string;
  size?: number;
  category: string;
};

export default function NewProjectPage() {
  const { lang } = useLanguage();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Land import
  const [availableLands, setAvailableLands] = React.useState<any[]>([]);
  const [importLandId, setImportLandId] = React.useState("");

  React.useEffect(() => {
    getAcquiredLands().then(setAvailableLands).catch(console.error);
  }, []);

  function handleLandImport(landId: string) {
    setImportLandId(landId);
    if (!landId) return;
    const land = availableLands.find((l: any) => l.id === landId);
    if (!land) return;
    setFormData((prev) => ({
      ...prev,
      name: land.name || prev.name,
      region: land.region || "",
      city: land.city || "",
      district: land.district || "",
      streetName: land.streetName || "",
      postalCode: land.postalCode || "",
      parcelNumber: land.parcelNumber || "",
      deedNumber: land.deedNumber || "",
      plotNumber: land.plotNumber || "",
      blockNumber: land.blockNumber || "",
      landUse: land.landUse || "",
      totalAreaSqm: land.totalAreaSqm ? String(land.totalAreaSqm) : "",
      latitude: land.latitude ?? null,
      longitude: land.longitude ?? null,
      estimatedValueSar: land.estimatedValueSar ? String(land.estimatedValueSar) : "",
    }));
  }

  // Off-plan mode
  const [isOffPlan, setIsOffPlan] = React.useState(false);

  // Step 1: Project data
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    type: "RESIDENTIAL",
    region: "",
    city: "",
    district: "",
    streetName: "",
    postalCode: "",
    parcelNumber: "",
    deedNumber: "",
    plotNumber: "",
    blockNumber: "",
    landUse: "",
    totalAreaSqm: "",
    latitude: null as number | null,
    longitude: null as number | null,
    estimatedValueSar: "",
  });

  // Step 2: Buildings
  const [buildings, setBuildings] = React.useState<BuildingDraft[]>([]);
  const [showBuildingForm, setShowBuildingForm] = React.useState(false);
  const [editingBuilding, setEditingBuilding] = React.useState<string | null>(null);
  const [buildingForm, setBuildingForm] = React.useState({
    name: "",
    numberOfFloors: "",
    buildingAreaSqm: "",
    buildingType: "residential",
    unitCount: "",
  });

  // Step 3: Documents
  const [documents, setDocuments] = React.useState<UploadedDoc[]>([]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Building CRUD
  function handleAddBuilding() {
    if (!buildingForm.name) return;
    if (editingBuilding) {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === editingBuilding
            ? {
                ...b,
                name: buildingForm.name,
                numberOfFloors: parseInt(buildingForm.numberOfFloors) || 1,
                buildingAreaSqm: parseFloat(buildingForm.buildingAreaSqm) || 0,
                buildingType: buildingForm.buildingType,
                unitCount: parseInt(buildingForm.unitCount) || 0,
              }
            : b
        )
      );
      setEditingBuilding(null);
    } else {
      setBuildings((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: buildingForm.name,
          numberOfFloors: parseInt(buildingForm.numberOfFloors) || 1,
          buildingAreaSqm: parseFloat(buildingForm.buildingAreaSqm) || 0,
          buildingType: buildingForm.buildingType,
          unitCount: parseInt(buildingForm.unitCount) || 0,
        },
      ]);
    }
    setBuildingForm({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential", unitCount: "" });
    setShowBuildingForm(false);
  }

  function handleEditBuilding(b: BuildingDraft) {
    setEditingBuilding(b.id);
    setBuildingForm({
      name: b.name,
      numberOfFloors: b.numberOfFloors.toString(),
      buildingAreaSqm: b.buildingAreaSqm.toString(),
      buildingType: b.buildingType,
      unitCount: b.unitCount.toString(),
    });
    setShowBuildingForm(true);
  }

  function handleDeleteBuilding(id: string) {
    setBuildings((prev) => prev.filter((b) => b.id !== id));
  }

  // Upload handler
  const handleUploadComplete = (res: any) => {
    for (const file of res) {
      setDocuments((prev) => [
        ...prev,
        {
          name: file.name,
          url: file.url ?? file.ufsUrl,
          type: file.name.split(".").pop() || "unknown",
          size: file.size,
          category: "LEGAL",
        },
      ]);
    }
  };

  // Submit
  const handleCreateProject = async () => {
    setLoading(true);
    try {
      // If importing from a land, transition the land to PLANNING
      if (importLandId) {
        await updateLandStatus(importLandId, "PLANNING");
        // Register documents for the existing land-turned-project
        for (const doc of documents) {
          await registerProjectDocument({
            projectId: importLandId,
            name: doc.name,
            url: doc.url,
            type: doc.type,
            size: doc.size,
            category: doc.category as any,
          });
        }
        router.push(`/dashboard/projects/${importLandId}`);
        return;
      }

      const project = await createProject({
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type as any,
        status: isOffPlan ? "CONCEPT_DESIGN" : undefined,
        region: formData.region || undefined,
        city: formData.city || undefined,
        district: formData.district || undefined,
        streetName: formData.streetName || undefined,
        postalCode: formData.postalCode || undefined,
        parcelNumber: formData.parcelNumber || undefined,
        deedNumber: formData.deedNumber || undefined,
        plotNumber: formData.plotNumber || undefined,
        blockNumber: formData.blockNumber || undefined,
        landUse: formData.landUse || undefined,
        totalAreaSqm: formData.totalAreaSqm ? parseFloat(formData.totalAreaSqm) : undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        estimatedValueSar: formData.estimatedValueSar
          ? parseFloat(formData.estimatedValueSar)
          : undefined,
        buildings: buildings.length > 0
          ? buildings.map((b) => ({
              name: b.name,
              numberOfFloors: b.numberOfFloors,
              buildingAreaSqm: b.buildingAreaSqm,
              buildingType: b.buildingType,
            }))
          : undefined,
      });

      // Register uploaded documents for the project
      for (const doc of documents) {
        await registerProjectDocument({
          projectId: project.id,
          name: doc.name,
          url: doc.url,
          type: doc.type,
          size: doc.size,
          category: doc.category as any,
        });
      }

      router.push("/dashboard/projects");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-10 px-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "إضافة مشروع جديد" : "Add New Project"}
          </h1>
          <p className="text-sm text-neutral mt-1">
            {lang === "ar"
              ? "ابدأ رحلة تطوير عقاري جديدة مع ميماريك."
              : "Start a new property development journey with Mimaric."}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative h-1 bg-border rounded-full mx-10">
        <div
          className="absolute h-full bg-secondary transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0">
          {steps.map((step, i) => (
            <div key={step.id} className="relative">
              <div
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  i <= currentStep
                    ? "bg-secondary border-secondary text-white"
                    : "bg-card border-border text-neutral"
                )}
              >
                {i < currentStep ? <CheckCircle size={20} weight="fill" /> : i + 1}
              </div>
              <span
                className={cn(
                  "absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest",
                  i === currentStep ? "text-primary" : "text-neutral/50"
                )}
              >
                {step.label[lang]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-10">
        <div className="bg-card rounded-md shadow-card border border-border p-8 min-h-[400px]">
          {/* ─── Step 1: Project Details ─── */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {/* Import from Land */}
              {availableLands.length > 0 && (
                <div className="border border-secondary/30 bg-secondary/5 rounded-md p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapTrifold size={18} className="text-secondary" />
                    <h4 className="text-xs font-bold text-secondary">
                      {lang === "ar" ? "استيراد من أرض مُستحوذ عليها" : "Import from Acquired Land"}
                    </h4>
                  </div>
                  <p className="text-[10px] text-neutral">
                    {lang === "ar"
                      ? "اختر أرضًا لتعبئة بيانات المشروع تلقائيًا من بيانات الأرض."
                      : "Select a land to auto-fill project data from the land record."}
                  </p>
                  <select
                    value={importLandId}
                    onChange={(e) => handleLandImport(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{lang === "ar" ? "— اختر أرضًا (اختياري) —" : "— Select a land (optional) —"}</option>
                    {availableLands.map((land: any) => (
                      <option key={land.id} value={land.id}>
                        {land.name} {land.deedNumber ? `(${land.deedNumber})` : ""} {land.city ? `- ${land.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <h3 className="text-sm font-bold text-primary mb-4">
                {lang === "ar" ? "المعلومات الأساسية" : "Basic Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">
                    {lang === "ar" ? "اسم المشروع *" : "Project Name *"}
                  </label>
                  <input name="name" value={formData.name} onChange={handleInputChange} placeholder={lang === "ar" ? "مثال: مجمع الأرجوان" : "e.g. Al Arjuan Compound"} className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">
                    {lang === "ar" ? "نوع المشروع" : "Project Type"}
                  </label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className={inputClass}>
                    <option value="RESIDENTIAL">{lang === "ar" ? "سكني" : "Residential"}</option>
                    <option value="COMMERCIAL">{lang === "ar" ? "تجاري" : "Commercial"}</option>
                    <option value="MIXED_USE">{lang === "ar" ? "متعدد الاستخدامات" : "Mixed-use"}</option>
                    <option value="VILLA_COMPOUND">{lang === "ar" ? "مجمع فلل" : "Villa Compound"}</option>
                  </select>
                </div>
              </div>

              {/* Off-Plan Toggle */}
              <div
                className={`border rounded-md p-5 space-y-3 cursor-pointer transition-all ${
                  isOffPlan
                    ? "border-secondary bg-secondary/5"
                    : "border-border bg-card hover:border-secondary/30"
                }`}
                onClick={() => setIsOffPlan(!isOffPlan)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center ${isOffPlan ? "bg-secondary/20 text-secondary" : "bg-muted text-neutral/40"}`}>
                      <MapTrifold size={22} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {lang === "ar" ? "مشروع بيع على الخارطة" : "Off-Plan Development Project"}
                      </p>
                      <p className="text-[10px] text-neutral mt-0.5">
                        {lang === "ar"
                          ? "تفعيل مراحل التطوير: التقسيم، الموافقات، البنية التحتية، المخزون، التسعير، والإطلاق"
                          : "Enable development stages: subdivision, approvals, infrastructure, inventory, pricing, and launch"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isOffPlan ? "bg-secondary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${
                        isOffPlan ? (lang === "ar" ? "left-0.5" : "right-0.5 left-auto") : (lang === "ar" ? "right-0.5 left-auto" : "left-0.5")
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral">
                  {lang === "ar" ? "وصف المشروع" : "Description"}
                </label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all min-h-[80px]" />
              </div>

              {/* Location */}
              <h3 className="text-sm font-bold text-primary pt-2">
                {lang === "ar" ? "الموقع" : "Location"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المنطقة" : "Region"}</label>
                  <input name="region" value={formData.region} onChange={handleInputChange} className={inputClass} placeholder={lang === "ar" ? "منطقة الرياض" : "Riyadh Region"} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المدينة" : "City"}</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder={lang === "ar" ? "الرياض" : "Riyadh"} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الحي" : "District"}</label>
                  <input name="district" value={formData.district} onChange={handleInputChange} className={inputClass} placeholder={lang === "ar" ? "الملقا" : "Al Malqa"} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الشارع" : "Street"}</label>
                  <input name="streetName" value={formData.streetName} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الرمز البريدي" : "Postal Code"}</label>
                  <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className={inputClass} maxLength={5} />
                </div>
              </div>

              {/* Map */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral flex items-center gap-2">
                  <MapPin size={14} />
                  {lang === "ar" ? "حدد الموقع على الخريطة" : "Select Location on Map"}
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                  height="250px"
                  zoom={6}
                />
                {formData.latitude && formData.longitude && (
                  <p className="text-[10px] text-neutral" dir="ltr">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Balady Fields */}
              <h3 className="text-sm font-bold text-primary pt-2">
                {lang === "ar" ? "بيانات بلدي / الصك" : "Balady / Deed Data"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الصك" : "Deed #"}</label>
                  <input name="deedNumber" value={formData.deedNumber} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم القطعة" : "Parcel #"}</label>
                  <input name="parcelNumber" value={formData.parcelNumber} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم المخطط" : "Plot #"}</label>
                  <input name="plotNumber" value={formData.plotNumber} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم البلك" : "Block #"}</label>
                  <input name="blockNumber" value={formData.blockNumber} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الاستخدام" : "Land Use"}</label>
                  <select name="landUse" value={formData.landUse} onChange={handleInputChange} className={inputClass}>
                    <option value="">—</option>
                    {landUseOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o[lang]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
                  <input name="totalAreaSqm" type="number" value={formData.totalAreaSqm} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral">{lang === "ar" ? "القيمة التقديرية (ر.س)" : "Est. Value (SAR)"}</label>
                  <input name="estimatedValueSar" type="number" value={formData.estimatedValueSar} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Buildings ─── */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">
                  {lang === "ar" ? "المباني / الأبراج" : "Buildings & Towers"}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setEditingBuilding(null);
                    setBuildingForm({ name: "", numberOfFloors: "", buildingAreaSqm: "", buildingType: "residential", unitCount: "" });
                    setShowBuildingForm(true);
                  }}
                 
                >
                  <Plus size={16} />
                  {lang === "ar" ? "إضافة مبنى" : "Add Building"}
                </Button>
              </div>

              {/* Building Form */}
              {showBuildingForm && (
                <div className="border border-secondary/30 bg-secondary/5 rounded-md p-5 space-y-4">
                  <h4 className="text-xs font-bold text-secondary">
                    {editingBuilding
                      ? (lang === "ar" ? "تعديل المبنى" : "Edit Building")
                      : (lang === "ar" ? "مبنى جديد" : "New Building")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "اسم المبنى *" : "Building Name *"}</label>
                      <input value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} className={inputClass} placeholder={lang === "ar" ? "مبنى أ" : "Building A"} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "نوع المبنى" : "Building Type"}</label>
                      <select value={buildingForm.buildingType} onChange={(e) => setBuildingForm({ ...buildingForm, buildingType: e.target.value })} className={inputClass}>
                        {buildingTypeOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o[lang]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "عدد الأدوار" : "Floors"}</label>
                      <input type="number" value={buildingForm.numberOfFloors} onChange={(e) => setBuildingForm({ ...buildingForm, numberOfFloors: e.target.value })} className={inputClass} min="1" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "المساحة (م²)" : "Area (sqm)"}</label>
                      <input type="number" value={buildingForm.buildingAreaSqm} onChange={(e) => setBuildingForm({ ...buildingForm, buildingAreaSqm: e.target.value })} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral">{lang === "ar" ? "عدد الوحدات" : "Unit Count"}</label>
                      <input type="number" value={buildingForm.unitCount} onChange={(e) => setBuildingForm({ ...buildingForm, unitCount: e.target.value })} className={inputClass} min="0" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" onClick={handleAddBuilding} disabled={!buildingForm.name}>
                      {editingBuilding ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إضافة" : "Add")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowBuildingForm(false); setEditingBuilding(null); }}>
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Building List */}
              {buildings.length === 0 && !showBuildingForm && (
                <div className="bg-muted/10 border border-dashed border-border rounded-md p-12 text-center">
                  <Buildings size={48} className="text-neutral/30 mx-auto mb-3" />
                  <p className="text-sm text-neutral">{lang === "ar" ? "لم يتم إضافة مباني بعد" : "No buildings added yet"}</p>
                  <p className="text-xs text-neutral/60 mt-1">{lang === "ar" ? "أضف المباني والأبراج التابعة للمشروع" : "Add buildings and towers for this project"}</p>
                </div>
              )}
              <div className="space-y-3">
                {buildings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border border-border rounded-md bg-card hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Buildings size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{b.name}</p>
                        <p className="text-[10px] text-neutral">
                          {buildingTypeOptions.find((o) => o.value === b.buildingType)?.[lang] ?? b.buildingType}
                          {" • "}{b.numberOfFloors} {lang === "ar" ? "أدوار" : "floors"}
                          {b.buildingAreaSqm ? ` • ${fmt(b.buildingAreaSqm)} م²` : ""}
                          {b.unitCount ? ` • ${b.unitCount} ${lang === "ar" ? "وحدة" : "units"}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditBuilding(b)}>
                        <PencilSimple size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBuilding(b.id)} className="text-red-500 hover:text-red-700">
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 3: Balady Documents ─── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <h3 className="text-sm font-bold text-primary">
                {lang === "ar" ? "وثائق بلدي والمستندات" : "Balady Documents & Files"}
              </h3>
              <p className="text-xs text-neutral">
                {lang === "ar"
                  ? "ارفع الوثائق المتعلقة بالمشروع مثل رخصة البناء، مخططات الموقع، صكوك الملكية، وتقارير التربة."
                  : "Upload project-related documents such as building permits, site plans, title deeds, and soil reports."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Area */}
                <div className="border border-dashed border-secondary/40 bg-secondary/5 rounded-md p-8 flex flex-col items-center justify-center gap-3">
                  <CloudArrowUp size={40} className="text-secondary/60" />
                  <p className="text-xs text-neutral text-center">
                    {lang === "ar" ? "ارفع الملفات (PDF، صور، Excel، Word)" : "Upload files (PDF, images, Excel, Word)"}
                  </p>
                  <UploadButton
                    endpoint="projectDocumentUploader"
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={(error: Error) => console.error(error.message)}
                    appearance={{
                      button: "bg-secondary hover:bg-green-bright text-white text-xs font-bold gap-2 flex h-8 px-4 rounded-md",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: (
                        <div className="flex items-center gap-2">
                          <CloudArrowUp size={14} weight="fill" />
                          {lang === "ar" ? "اختر ملفات" : "Choose Files"}
                        </div>
                      ),
                    }}
                  />
                </div>

                {/* Category Info */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-neutral">{lang === "ar" ? "أنواع الوثائق المطلوبة" : "Required Document Types"}</p>
                  {[
                    { ar: "رخصة البناء", en: "Building Permit" },
                    { ar: "صك الملكية", en: "Title Deed" },
                    { ar: "المخطط المعماري", en: "Architectural Plan" },
                    { ar: "تقرير التربة", en: "Soil Report" },
                    { ar: "شهادة إتمام البناء", en: "Completion Certificate" },
                    { ar: "مخطط الموقع العام", en: "Site Plan" },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-neutral">
                      <FileText size={14} className="text-secondary min-w-[14px]" />
                      {doc[lang]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Files List */}
              {documents.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <p className="text-xs font-bold text-primary">{lang === "ar" ? "الملفات المرفوعة" : "Uploaded Files"} ({documents.length})</p>
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/10 border border-border rounded-md">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-secondary" />
                        <div>
                          <p className="text-xs font-bold text-primary">{doc.name}</p>
                          <p className="text-[10px] text-neutral">{doc.type.toUpperCase()}{doc.size ? ` • ${(doc.size / 1024).toFixed(0)} KB` : ""}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Review ─── */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <h3 className="text-sm font-bold text-primary">
                {lang === "ar" ? "مراجعة بيانات المشروع" : "Review Project Data"}
              </h3>

              {/* Project Info */}
              <div className="bg-muted/10 border border-border rounded-md p-5 space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">
                  {lang === "ar" ? "المعلومات الأساسية" : "Basic Info"}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ReviewField label={lang === "ar" ? "الاسم" : "Name"} value={formData.name} />
                  <ReviewField label={lang === "ar" ? "النوع" : "Type"} value={formData.type} />
                  {isOffPlan && (
                    <ReviewField label={lang === "ar" ? "وضع المشروع" : "Mode"} value={lang === "ar" ? "بيع على الخارطة" : "Off-Plan"} />
                  )}
                  <ReviewField label={lang === "ar" ? "المنطقة" : "Region"} value={formData.region} />
                  <ReviewField label={lang === "ar" ? "المدينة" : "City"} value={formData.city} />
                  <ReviewField label={lang === "ar" ? "الحي" : "District"} value={formData.district} />
                  <ReviewField label={lang === "ar" ? "رقم الصك" : "Deed #"} value={formData.deedNumber} />
                  <ReviewField label={lang === "ar" ? "المساحة" : "Area"} value={formData.totalAreaSqm ? `${fmt(parseFloat(formData.totalAreaSqm))} م²` : "—"} />
                  <ReviewField label={lang === "ar" ? "الاستخدام" : "Land Use"} value={landUseOptions.find((o) => o.value === formData.landUse)?.[lang] ?? "—"} />
                  {formData.estimatedValueSar && (
                    <ReviewField label={lang === "ar" ? "القيمة التقديرية" : "Est. Value"} value={`${fmt(parseFloat(formData.estimatedValueSar))} ر.س`} />
                  )}
                </div>
                {formData.latitude && formData.longitude && (
                  <div className="pt-3">
                    <MapPicker latitude={formData.latitude} longitude={formData.longitude} readonly height="180px" zoom={14} />
                  </div>
                )}
              </div>

              {/* Buildings */}
              <div className="bg-muted/10 border border-border rounded-md p-5 space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">
                  {lang === "ar" ? "المباني" : "Buildings"} ({buildings.length})
                </h4>
                {buildings.length === 0 ? (
                  <p className="text-xs text-neutral">{lang === "ar" ? "لم يتم إضافة مباني" : "No buildings added"}</p>
                ) : (
                  <div className="space-y-2">
                    {buildings.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 text-xs">
                        <Buildings size={16} className="text-primary" />
                        <span className="font-bold text-primary">{b.name}</span>
                        <span className="text-neutral">
                          {b.numberOfFloors} {lang === "ar" ? "أدوار" : "floors"}
                          {b.buildingAreaSqm ? ` • ${fmt(b.buildingAreaSqm)} م²` : ""}
                          {b.unitCount ? ` • ${b.unitCount} ${lang === "ar" ? "وحدة" : "units"}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-muted/10 border border-border rounded-md p-5 space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">
                  {lang === "ar" ? "الوثائق" : "Documents"} ({documents.length})
                </h4>
                {documents.length === 0 ? (
                  <p className="text-xs text-neutral">{lang === "ar" ? "لم يتم رفع وثائق" : "No documents uploaded"}</p>
                ) : (
                  <div className="space-y-1">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <FileText size={14} className="text-secondary" />
                        <span className="text-primary">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 px-2">
          <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0 || loading} className="gap-2">
            <ArrowRight size={18} />
            {lang === "ar" ? "السابق" : "Previous"}
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleCreateProject} disabled={loading || !formData.name} className="gap-2 bg-secondary hover:bg-green-bright transition-colors px-10">
              {loading ? <Spinner className="animate-spin" size={18} /> : <CheckCircle size={20} weight="fill" />}
              {lang === "ar" ? "اعتماد المشروع" : "Approve Project"}
            </Button>
          ) : (
            <Button onClick={nextStep} className="gap-2 px-10">
              {lang === "ar" ? "التالي" : "Next"}
              <ArrowLeft size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-neutral uppercase font-bold">{label}</p>
      <p className="text-sm text-primary font-medium">{value || "—"}</p>
    </div>
  );
}
