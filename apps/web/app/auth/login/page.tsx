"use client";

import * as React from "react";
import { Button, Input } from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Buildings, ArrowRight, ArrowLeft, Spinner } from "@phosphor-icons/react";
import { MimaricLogo } from "../../../components/brand/MimaricLogo";
import { loginAction } from "../../actions/auth";

export default function LoginPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const errorMessages = {
    USER_NOT_FOUND: {
      ar: "البريد الإلكتروني المدخل غير مسجل لدينا.",
      en: "This email is not registered in our system."
    },
    INVALID_PASSWORD: {
      ar: "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
      en: "Incorrect password. Please try again."
    },
    DATABASE_ERROR: {
      ar: "فشل الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.",
      en: "Database connection failed. Please try again later."
    },
    INVALID_CREDENTIALS: {
      ar: "بيانات الدخول غير صحيحة.",
      en: "Invalid login credentials."
    },
    AUTH_ERROR: {
      ar: "حدث خطأ أثناء تسجيل الدخول.",
      en: "An error occurred during authentication."
    },
    UNKNOWN_ERROR: {
      ar: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      en: "An unexpected error occurred. Please try again."
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        const msg = errorMessages[result.error as keyof typeof errorMessages] || 
                   (lang === "ar" ? "حدث خطأ ما." : "Something went wrong.");
        setError(typeof msg === 'string' ? msg : msg[lang]);
        setLoading(false);
      } else {
        // Successful login will redirect via server action
        router.push("/dashboard/units");
      }
    } catch (err: any) {
      // Catch next-auth redirect "errors"
      if (err.message?.includes("NEXT_REDIRECT")) {
          return;
      }
      setError(lang === "ar" ? "حدث خطأ في النظام. يرجى المحاولة لاحقاً." : "System error. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Brand Visual Panel - Left (Desktop) */}
      <div className="relative hidden w-full bg-primary lg:flex lg:w-1/2 xl:w-5/12 overflow-hidden shadow-2xl">
        {/* PCB Geometric Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L10 40 L40 40' stroke='white' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='white'/%3E%3Cpath d='M60 10 L60 20 L80 20' stroke='white' fill='none'/%3E%3Ccircle cx='80' cy='20' r='2' fill='white'/%3E%3C/svg%3E")` 
          }} 
        />
        
        <div className="relative z-20 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
             <MimaricLogo width={180} variant="dark" priority />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl text-white font-primary mb-2">
              {lang === "ar" ? "أهلاً بك في ميماريك" : "Welcome to Mimaric"}
            </h1>
            <p className="text-lg text-white/80 max-w-md font-primary">
              {lang === "ar" 
                ? "أتمتة وإدارة العقارات بذكاء وفق أرقى المعايير السعودية." 
                : "Real estate automation and management with Saudi-first standards."}
            </p>
          </div>

          <div className="mt-auto opacity-50">
            <p className="text-xs font-latin uppercase tracking-widest text-white">© 2026 Mimaric PropTech. All rights reserved.</p>
          </div>
        </div>

        {/* Decorative architectural silhouette */}
        <div className="absolute -bottom-10 -right-20 opacity-10 transform rotate-3">
          <Buildings size={400} weight="thin" className="text-secondary" />
        </div>
      </div>

      {/* Form Area - Right (Desktop) */}
      <div className="flex w-full flex-1 flex-col bg-background lg:w-1/2 xl:w-7/12">
        {/* Top bar with Lang Toggle */}
        <div className="flex items-center justify-between p-6 lg:px-12">
          <div className="lg:hidden">
             <MimaricLogo width={100} />
          </div>
          
          <button 
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-2 text-sm font-medium text-neutral hover:text-primary transition-colors"
          >
            <Globe size={20} />
            <span>{lang === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-6 pb-12 lg:px-12 lg:pt-0">
          <div className="mb-8 text-start">
            <h2 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "تسجيل الدخول" : "Login"}
            </h2>
            <p className="mt-2 text-sm text-neutral font-dm-sans">
              {lang === "ar" 
                ? "أدخل بياناتك للوصول إلى لوحة التحكم" 
                : "Enter your credentials to access your dashboard"}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                  {lang === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <Link href="/auth/forgot-password" title="title text" className="text-xs font-semibold text-primary/70 hover:text-primary">
                  {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </Link>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              className="w-full cursor-pointer hover:bg-primary-deep transition-all active:scale-[0.98] disabled:opacity-50" 
              onClick={handleLogin}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Spinner className="animate-spin" />
              ) : (
                <>
                  {lang === "ar" ? "تسجيل الدخول" : "Login"}
                  {lang === "ar" ? <ArrowLeft className="mr-2 icon-directional" /> : <ArrowRight className="ml-2 icon-directional" />}
                </>
              )}
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-neutral font-dm-sans">
            {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              {lang === "ar" ? "إنشاء حساب جديد" : "Register now"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
