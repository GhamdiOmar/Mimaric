"use client";

import * as React from "react";
import { Button, Input } from "@repo/ui";
import Link from "next/link";
import { Globe, Buildings, ArrowRight, ArrowLeft, User, Briefcase, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { MimaricLogo } from "../../../components/brand/MimaricLogo";

export default function RegisterPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [userType, setUserType] = React.useState<"individual" | "company">("individual");

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Brand Visual Panel - Right (Desktop) */}
      <div className="relative hidden w-full bg-primary lg:flex lg:w-1/2 xl:w-5/12 overflow-hidden shadow-2xl">
        {/* PCB Geometric Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L10 40 L40 40' stroke='white' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='white'/%3E%3Cpath d='M60 10 L60 20 L80 20' stroke='white' fill='none'/%3E%3Ccircle cx='80' cy='20' r='2' fill='white'/%3E%3C/svg%3E\")"
          }} 
        />
        
        <div className="relative z-20 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
             <MimaricLogo width={180} variant="dark" priority />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl text-white font-primary">
              {lang === "ar" ? "ارتقِ بإدارة عقاراتك إلى آفاق جديدة" : "Elevate Your Real Estate Management"}
            </h1>
            <p className="text-lg text-white/80 max-w-md font-primary">
              {lang === "ar" 
                ? "مستقبل إدارة العقارات في المملكة العربية السعودية يبدأ من هنا. منصة متكاملة تدعم رؤية 2030." 
                : "The future of property management in Saudi Arabia starts here. A platform supporting Vision 2030."}
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

      {/* Form Area - Left (Desktop) */}
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
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-6 pb-12 lg:px-12 lg:pt-0">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-primary">
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
            {userType === "individual" ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                    {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <Input placeholder={lang === "ar" ? "عمر الغامدي" : "Omar Alghamdi"} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                      {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                    </label>
                    <Input type="email" placeholder="name@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                      {lang === "ar" ? "رقم الجوال" : "Mobile Number"}
                    </label>
                    <div className="flex gap-2">
                       <div className="flex h-10 w-16 items-center justify-center rounded-md border border-input bg-muted text-sm font-latin">
                          +966
                       </div>
                       <Input placeholder="5XXXXXXXX" className="flex-1" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                    {lang === "ar" ? "اسم الشركة" : "Company Name"}
                  </label>
                  <Input placeholder={lang === "ar" ? "اسم المؤسسة أو الشركة" : "Company or Organization name"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                      {lang === "ar" ? "رقم السجل التجاري" : "CR Number"}
                    </label>
                    <Input placeholder="10XXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                      {lang === "ar" ? "الرقم الضريبي" : "VAT Number"}
                    </label>
                    <Input placeholder="3XXXXXXXXXXXXX" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-neutral tracking-wider">
                {lang === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <Input type="password" placeholder="••••••••" />
            </div>

            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" id="terms" className="mt-1 accent-secondary" />
              <label htmlFor="terms" className="text-xs text-neutral leading-relaxed font-dm-sans">
                {lang === "ar" 
                  ? "أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بـ Mimaric" 
                  : "I agree to Mimaric's Terms of Service and Privacy Policy"}
              </label>
            </div>

            <Button className="w-full">
              {lang === "ar" ? "إنشاء حساب" : "Create Account"}
              {lang === "ar" ? <ArrowLeft className="mr-2" /> : <ArrowRight className="ml-2" />}
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
