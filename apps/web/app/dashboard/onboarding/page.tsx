"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  Building2,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  User,
  MapPin,
  Mail,
  Loader2,
} from "lucide-react";
import { Button, Input } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { useSession } from "../../../components/SimpleSessionProvider";
import { useRouter } from "next/navigation";
import {
  lookupOrgByCR,
  createJoinRequest,
  convertPersonalOrg,
  updateOnboardingOrg,
  updateOnboardingContact,
  completeOnboarding,
  getMyJoinRequests,
} from "../../actions/onboarding";
import { createInvitation } from "../../actions/invitations";

// ─── Constants ────────────────────────────────────────────────────────────────

const selectClass =
  "w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const inputClass =
  "w-full h-10 px-3 bg-card border border-border rounded-md text-sm outline-none focus:border-secondary transition-all";

const entityTypeOptions = [
  { value: "ESTABLISHMENT", ar: "مؤسسة", en: "Establishment" },
  { value: "COMPANY", ar: "شركة", en: "Company" },
  { value: "BRANCH", ar: "فرع", en: "Branch" },
  { value: "PROFESSIONAL_ENTITY", ar: "كيان مهني", en: "Professional Entity" },
  { value: "FOREIGN_COMPANY_BRANCH", ar: "فرع شركة أجنبية", en: "Foreign Company Branch" },
  { value: "OTHER_ENTITY", ar: "أخرى", en: "Other" },
];

const legalFormOptions = [
  { value: "SOLE_PROPRIETORSHIP", ar: "مؤسسة فردية", en: "Sole Proprietorship" },
  { value: "LIMITED_LIABILITY_COMPANY", ar: "شركة ذات مسؤولية محدودة", en: "LLC" },
  { value: "JOINT_STOCK_COMPANY", ar: "شركة مساهمة", en: "Joint Stock Company" },
  { value: "SIMPLIFIED_JOINT_STOCK_COMPANY", ar: "شركة مساهمة مبسطة", en: "Simplified JSC" },
  { value: "GENERAL_PARTNERSHIP", ar: "شركة تضامنية", en: "General Partnership" },
  { value: "LIMITED_PARTNERSHIP", ar: "شركة توصية", en: "Limited Partnership" },
  { value: "PROFESSIONAL_COMPANY", ar: "شركة مهنية", en: "Professional Company" },
  { value: "BRANCH_OF_COMPANY", ar: "فرع شركة", en: "Branch of Company" },
  { value: "FOREIGN_BRANCH", ar: "فرع أجنبي", en: "Foreign Branch" },
  { value: "NON_PROFIT_ENTITY", ar: "كيان غير ربحي", en: "Non-Profit Entity" },
];

const roleOptions = [
  { value: "PROJECT_MANAGER", ar: "مدير مشاريع", en: "Project Manager" },
  { value: "SALES_MANAGER", ar: "مدير مبيعات", en: "Sales Manager" },
  { value: "SALES_AGENT", ar: "وكيل مبيعات", en: "Sales Agent" },
  { value: "PROPERTY_MANAGER", ar: "مدير عقارات", en: "Property Manager" },
  { value: "FINANCE_OFFICER", ar: "مسؤول مالي", en: "Finance Officer" },
  { value: "TECHNICIAN", ar: "فني صيانة", en: "Technician" },
  { value: "USER", ar: "مستخدم", en: "User" },
];

const allSteps = [
  { id: "join", label: { ar: "الانضمام", en: "Join" } },
  { id: "org", label: { ar: "المنشأة", en: "Organization" } },
  { id: "contact", label: { ar: "التواصل", en: "Contact" } },
  { id: "invite", label: { ar: "الفريق", en: "Team" } },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type InviteRow = { email: string; role: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const { lang } = useLanguage();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Determine if company account (skip step 1)
  const isCompany = (session?.user as any)?.accountType === "company";

  // Filtered steps based on account type
  const steps = React.useMemo(
    () => (isCompany ? allSteps.filter((s) => s.id !== "join") : allSteps),
    [isCompany]
  );

  // ─── Step 1: Join Company ───────────────────────────────────────────────────

  const [joinChoice, setJoinChoice] = React.useState<"join" | "independent" | null>(null);
  const [crSearch, setCrSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [lookupResult, setLookupResult] = React.useState<{
    found: boolean;
    orgId?: string;
    maskedName?: string;
    error?: string;
  } | null>(null);
  const [joinRequestSent, setJoinRequestSent] = React.useState(false);
  const [convertedToBusiness, setConvertedToBusiness] = React.useState(false);

  const handleCRLookup = async () => {
    if (crSearch.length !== 10) return;
    setSearching(true);
    setError("");
    setLookupResult(null);
    try {
      const result = await lookupOrgByCR(crSearch);
      setLookupResult(result);
      if (result.error === "INVALID_CR_FORMAT") {
        setError(lang === "ar" ? "صيغة السجل التجاري غير صحيحة" : "Invalid CR format");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ أثناء البحث" : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!lookupResult?.orgId) return;
    setLoading(true);
    setError("");
    try {
      const result = await createJoinRequest({
        targetOrgId: lookupResult.orgId,
        crNumber: crSearch,
      });
      if (result.success) {
        setJoinRequestSent(true);
      } else if (result.error === "ALREADY_IN_ORG") {
        setError(lang === "ar" ? "أنت بالفعل في هذه المنشأة" : "You are already in this organization");
      } else if (result.error === "REQUEST_ALREADY_EXISTS") {
        setError(lang === "ar" ? "لديك طلب انضمام قائم بالفعل" : "You already have a pending join request");
      } else {
        setError(lang === "ar" ? "فشل في إرسال طلب الانضمام" : "Failed to send join request");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertPersonal = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await convertPersonalOrg(crSearch);
      if (result.success) {
        setConvertedToBusiness(true);
        setOrgForm((prev) => ({ ...prev, crNumber: crSearch }));
        goNext();
      } else if (result.error === "CR_TAKEN") {
        setError(lang === "ar" ? "رقم السجل التجاري مسجل لدى منشأة أخرى" : "This CR number is already registered");
      } else {
        setError(lang === "ar" ? "فشل في تسجيل المنشأة" : "Failed to register business");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Organization Details ───────────────────────────────────────────

  const showBusinessFields = isCompany || convertedToBusiness;

  const [orgForm, setOrgForm] = React.useState({
    nameArabic: "",
    nameEnglish: "",
    crNumber: "",
    vatNumber: "",
    entityType: "",
    legalForm: "",
  });

  const setOrg = (key: string, val: string) =>
    setOrgForm((prev) => ({ ...prev, [key]: val }));

  const handleSaveOrg = async () => {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, string> = {};
      if (orgForm.nameArabic) payload.nameArabic = orgForm.nameArabic;
      if (orgForm.nameEnglish) payload.nameEnglish = orgForm.nameEnglish;
      if (orgForm.crNumber) payload.crNumber = orgForm.crNumber;
      if (orgForm.vatNumber) payload.vatNumber = orgForm.vatNumber;
      if (orgForm.entityType) payload.entityType = orgForm.entityType;
      if (orgForm.legalForm) payload.legalForm = orgForm.legalForm;

      const result = await updateOnboardingOrg(payload);
      if (result.success) {
        goNext();
      } else {
        const messages: Record<string, { ar: string; en: string }> = {
          INVALID_CR_FORMAT: { ar: "صيغة السجل التجاري غير صحيحة (10 أرقام)", en: "Invalid CR format (10 digits)" },
          INVALID_VAT_FORMAT: { ar: "صيغة الرقم الضريبي غير صحيحة (15 رقم)", en: "Invalid VAT format (15 digits)" },
          CR_TAKEN: { ar: "رقم السجل التجاري مسجل لمنشأة أخرى", en: "CR number already registered" },
          VAT_TAKEN: { ar: "الرقم الضريبي مسجل لمنشأة أخرى", en: "VAT number already registered" },
        };
        const msg = messages[result.error ?? ""] ?? { ar: "فشل في حفظ البيانات", en: "Failed to save" };
        setError(msg[lang]);
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Contact & Location ─────────────────────────────────────────────

  const [contactForm, setContactForm] = React.useState({
    mobileNumber: "",
    city: "",
    region: "",
  });

  const setContact = (key: string, val: string) =>
    setContactForm((prev) => ({ ...prev, [key]: val }));

  const handleSaveContact = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await updateOnboardingContact({
        mobileNumber: contactForm.mobileNumber || undefined,
        city: contactForm.city || undefined,
        region: contactForm.region || undefined,
      });
      if (result.success) {
        goNext();
      } else {
        setError(lang === "ar" ? "فشل في حفظ البيانات" : "Failed to save");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Invite Team ────────────────────────────────────────────────────

  const [invites, setInvites] = React.useState<InviteRow[]>([
    { email: "", role: "USER" },
  ]);

  const addInviteRow = () =>
    setInvites((prev) => [...prev, { email: "", role: "USER" }]);

  const removeInviteRow = (index: number) =>
    setInvites((prev) => prev.filter((_, i) => i !== index));

  const updateInvite = (index: number, field: "email" | "role", value: string) =>
    setInvites((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const handleSendInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const validInvites = invites.filter(
        (inv) => inv.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim())
      );

      for (const inv of validInvites) {
        await createInvitation({ email: inv.email.trim(), role: inv.role });
      }

      await completeOnboarding();
      await updateSession({ onboardingCompleted: true });
      window.location.href = "/dashboard";
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipComplete = async () => {
    setLoading(true);
    setError("");
    try {
      await completeOnboarding();
      await updateSession({ onboardingCompleted: true });
      window.location.href = "/dashboard";
    } catch {
      setError(lang === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goPrev = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ─── Current Step ID ────────────────────────────────────────────────────────

  const currentStepId = steps[currentStep]?.id;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gray-50/50"
    >
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "إعداد حسابك" : "Set Up Your Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "ar"
                ? "أكمل الخطوات التالية لتفعيل حسابك على ميماريك."
                : "Complete the following steps to activate your Mimaric account."}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative h-1 bg-gray-200 rounded-full mx-8">
          <div
            className="absolute h-full bg-secondary rounded-full transition-all duration-500"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              [lang === "ar" ? "right" : "left"]: 0,
            }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
            {steps.map((step, i) => (
              <div key={step.id} className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300",
                    i < currentStep
                      ? "bg-green-500 border-green-500 text-white"
                      : i === currentStep
                        ? "bg-secondary border-secondary text-white"
                        : "bg-card border-gray-300 text-gray-400"
                  )}
                >
                  {i < currentStep ? (
                    <Check className="h-[18px] w-[18px]" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "absolute top-12 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest",
                    i === currentStep
                      ? "text-primary"
                      : i < currentStep
                        ? "text-green-600"
                        : "text-gray-400"
                  )}
                >
                  {step.label[lang]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="pt-10">
          <div className="bg-card rounded-xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ─── Step 1: Join Company ─── */}
            {currentStepId === "join" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-8">
                  <Building2 className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-primary">
                    {lang === "ar" ? "هل تريد الانضمام لمنشأة قائمة؟" : "Join an existing company?"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "يمكنك الانضمام لمنشأة مسجلة أو المتابعة كمستقل."
                      : "You can join a registered company or continue independently."}
                  </p>
                </div>

                {!joinChoice && !joinRequestSent && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Join Card */}
                    <button
                      type="button"
                      onClick={() => setJoinChoice("join")}
                      className="group p-6 rounded-xl border-2 border-gray-200 hover:border-secondary hover:bg-secondary/5 transition-all text-center space-y-3"
                    >
                      <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto group-hover:bg-secondary/20 transition-colors">
                        <Building2 className="h-7 w-7 text-secondary" />
                      </div>
                      <h3 className="text-sm font-bold text-primary">
                        {lang === "ar" ? "الانضمام لمنشأة" : "Join a company"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar"
                          ? "ابحث بالسجل التجاري وانضم لفريق العمل"
                          : "Search by CR number and join the team"}
                      </p>
                    </button>

                    {/* Independent Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setJoinChoice("independent");
                        goNext();
                      }}
                      className="group p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center space-y-3"
                    >
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-primary">
                        {lang === "ar" ? "متابعة كمستقل" : "Continue independently"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar"
                          ? "أنشئ مساحة عمل شخصية خاصة بك"
                          : "Create your own personal workspace"}
                      </p>
                    </button>
                  </div>
                )}

                {/* Join Flow - CR Lookup */}
                {joinChoice === "join" && !joinRequestSent && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {lang === "ar" ? "رقم السجل التجاري" : "Commercial Registration Number"}
                      </label>
                      <div className="flex gap-3">
                        <Input
                          value={crSearch}
                          onChange={(e) => {
                            setCrSearch(e.target.value.replace(/\D/g, "").slice(0, 10));
                            setLookupResult(null);
                            setError("");
                          }}
                          placeholder="1010XXXXXX"
                          dir="ltr"
                          className="font-latin text-sm flex-1"
                          maxLength={10}
                        />
                        <Button
                          onClick={handleCRLookup}
                          disabled={crSearch.length !== 10 || searching}
                          className="gap-2"
                         
                        >
                          {searching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          {lang === "ar" ? "بحث" : "Search"}
                        </Button>
                      </div>
                    </div>

                    {/* Found Result */}
                    {lookupResult?.found && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-800">
                              {lookupResult.maskedName}
                            </p>
                            <p className="text-[10px] text-green-600 font-latin">
                              CR: {crSearch}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleJoinRequest}
                          disabled={loading}
                          className="gap-2 w-full"
                         
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {lang === "ar" ? "طلب الانضمام" : "Request to Join"}
                        </Button>
                      </div>
                    )}

                    {/* Not Found */}
                    {lookupResult && !lookupResult.found && !lookupResult.error && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                        <p className="text-sm text-amber-800">
                          {lang === "ar"
                            ? "لم يتم العثور على المنشأة. هل تريد تسجيلها؟"
                            : "Company not found. Would you like to register it?"}
                        </p>
                        <Button
                          variant="secondary"
                          onClick={handleConvertPersonal}
                          disabled={loading}
                          className="gap-2"
                         
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                          {lang === "ar" ? "تسجيل المنشأة" : "Register Company"}
                        </Button>
                      </div>
                    )}

                    {/* Back to choice */}
                    <button
                      type="button"
                      onClick={() => {
                        setJoinChoice(null);
                        setLookupResult(null);
                        setCrSearch("");
                        setError("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {lang === "ar" ? "العودة للخيارات" : "Back to options"}
                    </button>
                  </div>
                )}

                {/* Join Request Sent */}
                {joinRequestSent && (
                  <div className="text-center space-y-4 py-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800">
                      {lang === "ar" ? "تم إرسال طلب الانضمام" : "Join request sent"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {lang === "ar"
                        ? "سيقوم مسؤول المنشأة بمراجعة طلبك. يمكنك المتابعة بإعداد مساحة العمل الشخصية حاليًا."
                        : "The company admin will review your request. You can continue setting up your personal workspace for now."}
                    </p>
                    <Button
                      onClick={goNext}
                      className="gap-2 px-8"
                     
                    >
                      {lang === "ar" ? "متابعة" : "Continue"}
                      {lang === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Step 2: Organization Details ─── */}
            {currentStepId === "org" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-primary">
                    {lang === "ar" ? "معلومات المنشأة" : "Organization Details"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "أدخل البيانات الأساسية لمنشأتك."
                      : "Enter your organization's basic information."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "اسم المنشأة بالعربي" : "Organization Name (Arabic)"}
                    </label>
                    <Input
                      value={orgForm.nameArabic}
                      onChange={(e) => setOrg("nameArabic", e.target.value)}
                      dir="rtl"
                      placeholder={lang === "ar" ? "مثال: شركة الأفق" : "e.g. Al Ufuq Co."}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "اسم المنشأة بالإنجليزي" : "Organization Name (English)"}
                    </label>
                    <Input
                      value={orgForm.nameEnglish}
                      onChange={(e) => setOrg("nameEnglish", e.target.value)}
                      dir="ltr"
                      placeholder="e.g. Al Ufuq Company"
                    />
                  </div>
                </div>

                {showBusinessFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {lang === "ar" ? "رقم السجل التجاري" : "CR Number"}
                      </label>
                      <Input
                        value={orgForm.crNumber}
                        onChange={(e) =>
                          setOrg("crNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        dir="ltr"
                        placeholder="1010XXXXXX"
                        className="font-latin text-sm"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {lang === "ar" ? "الرقم الضريبي (VAT)" : "VAT Number"}
                      </label>
                      <Input
                        value={orgForm.vatNumber}
                        onChange={(e) =>
                          setOrg("vatNumber", e.target.value.replace(/\D/g, "").slice(0, 15))
                        }
                        dir="ltr"
                        placeholder="3000XXXXXX00003"
                        className="font-latin text-sm"
                        maxLength={15}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "نوع المنشأة" : "Entity Type"}
                    </label>
                    <select
                      value={orgForm.entityType}
                      onChange={(e) => setOrg("entityType", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                      {entityTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "ar" ? "الشكل القانوني" : "Legal Form"}
                    </label>
                    <select
                      value={orgForm.legalForm}
                      onChange={(e) => setOrg("legalForm", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                      {legalFormOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={goPrev}
                    disabled={loading}
                    className="gap-2"
                   
                  >
                    {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    {lang === "ar" ? "السابق" : "Previous"}
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={goNext}
                      disabled={loading}
                     
                    >
                      {lang === "ar" ? "تخطي" : "Skip"}
                    </Button>
                    <Button
                      onClick={handleSaveOrg}
                      disabled={loading}
                      className="gap-2 px-8"
                     
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {lang === "ar" ? "حفظ ومتابعة" : "Save & Continue"}
                      {lang === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 3: Contact & Location ─── */}
            {currentStepId === "contact" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-primary">
                    {lang === "ar" ? "معلومات الاتصال والموقع" : "Contact & Location"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "أضف بيانات التواصل وموقع المنشأة."
                      : "Add your contact details and location."}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {lang === "ar" ? "رقم الجوال" : "Mobile Number"}
                    </label>
                    <Input
                      value={contactForm.mobileNumber}
                      onChange={(e) => setContact("mobileNumber", e.target.value)}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      className="font-latin text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {lang === "ar" ? "المدينة" : "City"}
                      </label>
                      <Input
                        value={contactForm.city}
                        onChange={(e) => setContact("city", e.target.value)}
                        placeholder={lang === "ar" ? "الرياض" : "Riyadh"}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {lang === "ar" ? "المنطقة" : "Region"}
                      </label>
                      <Input
                        value={contactForm.region}
                        onChange={(e) => setContact("region", e.target.value)}
                        placeholder={lang === "ar" ? "منطقة الرياض" : "Riyadh Region"}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={goPrev}
                    disabled={loading}
                    className="gap-2"
                   
                  >
                    {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    {lang === "ar" ? "السابق" : "Previous"}
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={goNext}
                      disabled={loading}
                     
                    >
                      {lang === "ar" ? "تخطي" : "Skip"}
                    </Button>
                    <Button
                      onClick={handleSaveContact}
                      disabled={loading}
                      className="gap-2 px-8"
                     
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {lang === "ar" ? "حفظ ومتابعة" : "Save & Continue"}
                      {lang === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 4: Invite Team ─── */}
            {currentStepId === "invite" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-primary">
                    {lang === "ar" ? "دعوة فريق العمل" : "Invite Your Team"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "أرسل دعوات لفريقك للانضمام إلى المنصة."
                      : "Send invitations for your team to join the platform."}
                  </p>
                </div>

                <div className="space-y-3">
                  {invites.map((inv, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={inv.email}
                          onChange={(e) => updateInvite(i, "email", e.target.value)}
                          placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email address"}
                          dir="ltr"
                          type="email"
                          className="font-latin text-sm"
                        />
                      </div>
                      <select
                        value={inv.role}
                        onChange={(e) => updateInvite(i, "role", e.target.value)}
                        className={cn(selectClass, "w-40 flex-shrink-0")}
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt[lang]}
                          </option>
                        ))}
                      </select>
                      {invites.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInviteRow(i)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                         
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addInviteRow}
                  className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "ar" ? "إضافة عضو آخر" : "Add another"}
                </button>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={goPrev}
                    disabled={loading}
                    className="gap-2"
                   
                  >
                    {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    {lang === "ar" ? "السابق" : "Previous"}
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleSkipComplete}
                      disabled={loading}
                     
                    >
                      {lang === "ar" ? "تخطي وإنهاء الإعداد" : "Skip & Complete Setup"}
                    </Button>
                    <Button
                      onClick={handleSendInvitations}
                      disabled={loading || invites.every((inv) => !inv.email.trim())}
                      className="gap-2 px-8 bg-secondary hover:bg-green-600 transition-colors"
                     
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {lang === "ar" ? "إرسال الدعوات وإنهاء الإعداد" : "Send Invitations & Complete"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
