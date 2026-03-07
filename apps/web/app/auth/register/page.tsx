"use client";

import * as React from "react";
import { Button, Input } from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Buildings, ArrowRight, ArrowLeft, User, Briefcase, Spinner } from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { MimaricLogo } from "../../../components/brand/MimaricLogo";
import { PasswordStrengthHint } from "../../../components/PasswordStrengthHint";
import { registerUser } from "../../actions/auth";

export default function RegisterPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [userType, setUserType] = React.useState<"individual" | "company">("individual");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [agreed, setAgreed] = React.useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser({ name, email, password });
      if (result.error) {
        if (result.error === "EMAIL_EXISTS") {
          setError(lang === "ar" ? "هذا البريد الإلكتروني مسجل بالفعل." : "This email is already registered.");
        } else if (result.error === "WEAK_PASSWORD" && result.details) {
          setError(result.details.map((e: any) => e[lang]).join(" "));
        } else {
          setError(lang === "ar" ? "حدث خطأ." : "An error occurred.");
        }
      } else {
        router.push("/auth/login?registered=true");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ في النظام." : "System error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Brand Visual Panel */}
      <div className="relative hidden w-full bg-primary lg:flex lg:w-1/2 xl:w-5/12 overflow-hidden shadow-2xl">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L10 40 L40 40' stroke='white' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='white'/%3E%3Cpath d='M60 10 L60 20 L80 20' stroke='white' fill='none'/%3E%3Ccircle cx='80' cy='20' r='2' fill='white'/%3E%3C/svg%3E\")"
          }}
        />
        <div className="relative z-20 flex h-full flex-col justify-between p-12 text-white">
          <MimaricLogo width={180} variant="dark" priority />
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl text-white font-primary">
              {lang === "ar" ? "ارتقِ بإدارة عقاراتك إلى آفاق جديدة" : "Elevate Your Real Estate Management"}
            </h1>
            <p className="text-lg text-white/80 max-w-md font-primary">
              {lang === "ar"
                ? "مستقبل إدارة العقارات في المملكة العربية السعودية يبدأ من هنا."
                : "The future of property management in Saudi Arabia starts here."}
            </p>
          </div>
          <p className="text-xs font-latin uppercase tracking-widest text-white opacity-50">© 2026 Mimaric PropTech</p>
        </div>
        <div className="absolute -bottom-10 -right-20 opacity-10 transform rotate-3">
          <Buildings size={400} weight="thin" className="text-secondary" />
        </div>
      </div>

      {/* Form Area */}
      <div className="flex w-full flex-1 flex-col bg-background lg:w-1/2 xl:w-7/12">
        <div className="flex items-center justify-between p-6 lg:px-12">
          <div className="lg:hidden"><MimaricLogo width={100} /></div>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="flex items-center gap-2 text-sm font-medium text-neutral hover:text-primary transition-colors">
            <Globe size={20} />
            <span>{lang === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-6 pb-12 lg:px-12 lg:pt-0">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-primary font-primary">
              {lang === "ar" ? "إنشاء حساب جديد" : "Create New Account"}
            </h2>
            <p className="mt-2 text-sm text-neutral font-dm-sans">
              {lang === "ar"
                ? "انضم إلى نخبة المطورين العقاريين في المملكة"
                : "Join the elite property developers in the Kingdom"}
            </p>
          </div>

          {/* User Type Switcher */}
          <div className="mb-8 flex rounded-md bg-muted p-1">
            <button
              onClick={() => setUserType("individual")}
              className={cn(
                "flex flex-nowrap flex-1 items-center justify-center gap-2 rounded py-2 text-sm font-medium whitespace-nowrap transition-all",
                userType === "individual" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-primary"
              )}
            >
              <User size={18} />
              {lang === "ar" ? "فرد" : "Individual"}
            </button>
            <button
              onClick={() => setUserType("company")}
              className={cn(
                "flex flex-nowrap flex-1 items-center justify-center gap-2 rounded py-2 text-sm font-medium whitespace-nowrap transition-all",
                userType === "company" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-primary"
              )}
            >
              <Briefcase size={18} />
              {lang === "ar" ? "شركة" : "Company"}
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                {lang === "ar" ? (userType === "company" ? "اسم الشركة" : "الاسم الكامل") : (userType === "company" ? "Company Name" : "Full Name")}
              </label>
              <Input
                placeholder={lang === "ar" ? (userType === "company" ? "اسم المؤسسة" : "عمر الغامدي") : (userType === "company" ? "Company name" : "Omar Alghamdi")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                {lang === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              <PasswordStrengthHint password={password} lang={lang} context={{ name, email }} />
            </div>

            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" id="terms" className="mt-1 accent-secondary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <label htmlFor="terms" className="text-xs text-neutral leading-relaxed font-dm-sans">
                {lang === "ar"
                  ? "أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بـ Mimaric"
                  : "I agree to Mimaric's Terms of Service and Privacy Policy"}
              </label>
            </div>

            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={loading || !name || !email || !password || !agreed}
            >
              {loading ? (
                <Spinner className="animate-spin" />
              ) : (
                <>
                  {lang === "ar" ? "إنشاء حساب" : "Create Account"}
                  {lang === "ar" ? <ArrowLeft className="mr-2" /> : <ArrowRight className="ml-2" />}
                </>
              )}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral font-dm-sans">
            {lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              {lang === "ar" ? "تسجيل الدخول" : "Login"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
