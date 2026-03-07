"use client";

import * as React from "react";
import {
  SquaresFour,
  Buildings,
  HouseLine,
  Tag,
  ChartLineUp,
  Receipt,
  Wrench,
  FileText,
  Gear,
  List,
  Bell,
  MagnifyingGlass,
  Globe,
  User,
  CaretRight,
  CaretLeft,
  Question,
  SignOut,
  Users
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider, useSession, signOut as nextAuthSignOut } from "next-auth/react";

const navItems = [
  { label: { ar: "نظرة عامة", en: "Overview" }, icon: SquaresFour, href: "/dashboard", section: "main" },
  { label: { ar: "المشاريع", en: "Projects" }, icon: HouseLine, href: "/dashboard/projects", section: "main" },
  { label: { ar: "الوحدات", en: "Units" }, icon: Buildings, href: "/dashboard/units", section: "main" },
  { label: { ar: "العملاء", en: "Customers" }, icon: Users, href: "/dashboard/sales/customers", section: "main" },
  { label: { ar: "المبيعات", en: "Sales" }, icon: ChartLineUp, href: "/dashboard/sales", section: "main" },
  { label: { ar: "الإيجارات", en: "Rentals" }, icon: Tag, href: "/dashboard/rentals", section: "main" },
  { label: { ar: "المالية", en: "Finance" }, icon: Receipt, href: "/dashboard/finance", section: "main" },
  { label: { ar: "الصيانة", en: "Maintenance" }, icon: Wrench, href: "/dashboard/maintenance", section: "main" },
  { label: { ar: "التقارير", en: "Reports" }, icon: FileText, href: "/dashboard/reports", section: "secondary" },
  { label: { ar: "الإعدادات", en: "Settings" }, icon: Gear, href: "/dashboard/settings", section: "secondary" },
];

import { MimaricLogo } from "../../components/brand/MimaricLogo";

const roleLabels: Record<string, { ar: string; en: string }> = {
  SUPER_ADMIN: { ar: "مدير النظام", en: "Super Admin" },
  DEV_ADMIN: { ar: "مدير التطوير", en: "Dev Admin" },
  PROJECT_MANAGER: { ar: "مدير المشاريع", en: "Project Manager" },
  SALES_MANAGER: { ar: "مدير المبيعات", en: "Sales Manager" },
  SALES_AGENT: { ar: "وكيل مبيعات", en: "Sales Agent" },
  PROPERTY_MANAGER: { ar: "مدير العقارات", en: "Property Manager" },
  FINANCE_OFFICER: { ar: "مسؤول مالي", en: "Finance Officer" },
  TECHNICIAN: { ar: "فني صيانة", en: "Technician" },
  USER: { ar: "مستخدم", en: "User" },
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  const userName = session?.user?.name ?? "مستخدم";
  const userRole = session?.user?.role ?? "USER";
  const roleLabel = roleLabels[userRole] ?? { ar: "مستخدم", en: "User" };

  return (
    <div className="flex min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Sidebar - Mimaric Visual Identity */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-primary text-white transition-all duration-300 ease-in-out lg:static shadow-xl",
          isCollapsed ? "w-[68px]" : "w-[256px]"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center px-4 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
             {isCollapsed ? (
               <div className="min-w-[40px] flex justify-center">
                 <MimaricLogo width={32} variant="dark" />
               </div>
             ) : (
               <MimaricLogo width={140} variant="dark" className="transition-opacity duration-300" />
             )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto pt-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all group relative",
                  isActive 
                    ? "bg-secondary/15 text-white border-inline-start-4 border-secondary pr-2" 
                    : "text-white/55 hover:bg-white/5 hover:text-white/90"
                )}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} className={cn("min-w-[20px]", isActive ? "text-green-bright" : "")} />
                {!isCollapsed && <span className="font-primary">{item.label[lang]}</span>}
                
                {isCollapsed && (
                  <div className="absolute right-full mr-2 hidden group-hover:block z-[60]">
                    <div className="bg-primary-deep text-white text-xs py-1.5 px-3 rounded shadow-lg whitespace-nowrap border border-white/10">
                      {item.label[lang]}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Additional Info Section */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            {isCollapsed 
              ? (lang === "ar" ? <CaretLeft size={20} /> : <CaretRight size={20} />) 
              : (lang === "ar" ? <CaretRight size={20} /> : <CaretLeft size={20} />)}
            {!isCollapsed && <span>{lang === "ar" ? "طي القائمة" : "Collapse Sidebar"}</span>}
          </button>
          
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Question size={20} />
            {!isCollapsed && <span>{lang === "ar" ? "المساعدة" : "Help"}</span>}
          </Link>

          <div className="flex items-center gap-3 px-3 py-4 mt-2">
            <div className="h-9 w-9 min-w-[36px] rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 text-accent overflow-hidden">
              <User size={20} weight="fill" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none">{userName}</p>
                <p className="text-xs text-white/50 truncate mt-1">{roleLabel[lang]}</p>
              </div>
            )}
            {!isCollapsed && (
              <SignOut
                size={16}
                className="text-white/30 hover:text-white transition-colors cursor-pointer"
                onClick={() => nextAuthSignOut({ callbackUrl: "/auth/login" })}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col transition-all duration-300">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-white px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs text-neutral font-medium uppercase tracking-wider">
              {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
              <span className="mx-2 text-border">/</span>
              <span className="text-primary">{lang === "ar" ? "نظرة عامة" : "Overview"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="hidden md:flex relative w-64 xl:w-96 group">
              <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral transition-colors group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder={lang === "ar" ? "بحث شامل في المشاريع، الوحدات، العقود..." : "Global search..."}
                className="w-full bg-muted/50 border-transparent rounded-md py-2 pr-10 pl-4 text-sm focus:bg-white focus:border-primary/20 focus:ring-0 transition-all outline-none" 
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-neutral hover:text-primary transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 left-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary ring-2 ring-white">
                3
              </span>
            </button>

            {/* Language Toggle icon in topbar */}
            <button 
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="p-2 text-neutral hover:text-primary transition-colors"
              title={lang === "ar" ? "Switch to English" : "تغيير للعربية"}
            >
              <Globe size={22} />
            </button>

            <div className="h-8 w-px bg-border mx-1" />

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/20">
                <User size={20} className="text-neutral" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-10 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
