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
  Users,
  MapPin,
  CheckCircle,
  Warning,
  CurrencyCircleDollar,
  Wrench as WrenchIcon2,
  ShieldCheck,
  X,
  Compass,
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@repo/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { SimpleSessionProvider, useSession } from "../../components/SimpleSessionProvider";
import { hasPermission, type Permission } from "../../lib/permissions";
import { LanguageProvider, useLanguage } from "../../components/LanguageProvider";
import { getUnreadCount, getMyNotifications, markAsRead, markAllAsRead } from "../actions/notifications";
import { globalSearch } from "../actions/search";
import { getOrgName } from "../actions/organization";

const navItems: { label: { ar: string; en: string }; icon: any; href: string; section: string; permission?: Permission }[] = [
  { label: { ar: "نظرة عامة", en: "Overview" }, icon: SquaresFour, href: "/dashboard", section: "main", permission: "dashboard:read" },
  { label: { ar: "الأراضي", en: "Land" }, icon: MapPin, href: "/dashboard/land", section: "main", permission: "land:read" },
  { label: { ar: "التخطيط", en: "Planning" }, icon: Compass, href: "/dashboard/planning", section: "main", permission: "planning:read" },
  { label: { ar: "المشاريع", en: "Projects" }, icon: HouseLine, href: "/dashboard/projects", section: "main", permission: "projects:read" },
  { label: { ar: "الوحدات", en: "Units" }, icon: Buildings, href: "/dashboard/units", section: "main", permission: "units:read" },
  { label: { ar: "العملاء", en: "Customers" }, icon: Users, href: "/dashboard/sales/customers", section: "main", permission: "customers:read" },
  { label: { ar: "المبيعات", en: "Sales" }, icon: ChartLineUp, href: "/dashboard/sales", section: "main", permission: "contracts:read" },
  { label: { ar: "الإيجارات", en: "Rentals" }, icon: Tag, href: "/dashboard/rentals", section: "main", permission: "leases:read" },
  { label: { ar: "المالية", en: "Finance" }, icon: Receipt, href: "/dashboard/finance", section: "main", permission: "finance:read" },
  { label: { ar: "الصيانة", en: "Maintenance" }, icon: Wrench, href: "/dashboard/maintenance", section: "main", permission: "maintenance:read" },
  { label: { ar: "التقارير", en: "Reports" }, icon: FileText, href: "/dashboard/reports", section: "secondary", permission: "reports:read" },
  { label: { ar: "الاشتراك والفوترة", en: "Billing" }, icon: CurrencyCircleDollar, href: "/dashboard/billing", section: "secondary", permission: "billing:read" },
  { label: { ar: "إدارة المنصة", en: "Platform Admin" }, icon: ShieldCheck, href: "/dashboard/admin", section: "admin", permission: "billing:admin" },
  { label: { ar: "الإعدادات", en: "Settings" }, icon: Gear, href: "/dashboard/settings", section: "secondary", permission: "organization:read" },
];

import { MimaricLogo } from "../../components/brand/MimaricLogo";

const roleLabels: Record<string, { ar: string; en: string }> = {
  SYSTEM_ADMIN: { ar: "مدير المنصة", en: "System Admin" },
  SYSTEM_SUPPORT: { ar: "دعم المنصة", en: "System Support" },
  COMPANY_ADMIN: { ar: "مدير الشركة", en: "Company Admin" },
  SUPER_ADMIN: { ar: "مدير الشركة", en: "Company Admin" },
  DEV_ADMIN: { ar: "دعم المنصة", en: "System Support" },
  PROJECT_MANAGER: { ar: "مدير المشاريع", en: "Project Manager" },
  SALES_MANAGER: { ar: "مدير المبيعات", en: "Sales Manager" },
  SALES_AGENT: { ar: "وكيل مبيعات", en: "Sales Agent" },
  PROPERTY_MANAGER: { ar: "مدير العقارات", en: "Property Manager" },
  FINANCE_OFFICER: { ar: "مسؤول مالي", en: "Finance Officer" },
  TECHNICIAN: { ar: "فني صيانة", en: "Technician" },
  ENGINEERING_CONSULTANT: { ar: "استشاري هندسي", en: "Engineering Consultant" },
  APPROVALS_MANAGER: { ar: "مدير الموافقات", en: "Approvals Manager" },
  ESCROW_CONTROLLER: { ar: "مراقب الضمان", en: "Escrow Controller" },
  COLLECTIONS_OFFICER: { ar: "مسؤول التحصيل", en: "Collections Officer" },
  HANDOVER_OFFICER: { ar: "مسؤول التسليم", en: "Handover Officer" },
  QA_INSPECTOR: { ar: "مفتش الجودة", en: "QA Inspector" },
  VENDOR_CONTRACTOR: { ar: "مقاول / مورّد", en: "Vendor / Contractor" },
  BUYER: { ar: "مشتري", en: "Buyer" },
  TENANT: { ar: "مستأجر", en: "Tenant" },
  USER: { ar: "مستخدم", en: "User" },
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { lang, setLang } = useLanguage();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifs, setShowNotifs] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any>(null);
  const [showSearch, setShowSearch] = React.useState(false);
  const searchTimeout = React.useRef<any>(null);

  const userName = session?.user?.name ?? "مستخدم";
  const userRole = (session?.user as any)?.role ?? "USER";
  const roleLabel = roleLabels[userRole] ?? { ar: "مستخدم", en: "User" };
  const [orgName, setOrgName] = React.useState<string>("");

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(userRole, item.permission);
  });

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Fetch unread notification count
  React.useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [pathname]);

  // Fetch org name
  React.useEffect(() => {
    getOrgName().then((org) => {
      if (org) setOrgName(org.nameArabic || org.nameEnglish || org.name);
    }).catch(() => {});
  }, []);

  async function handleMarkAllRead() {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }

  async function handleNotifClick(notif: any) {
    if (!notif.read) {
      await markAsRead(notif.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((n) => n.map((x) => x.id === notif.id ? { ...x, read: true } : x));
    }
    setShowNotifs(false);
    if (notif.link) router.push(notif.link);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) { setSearchResults(null); setShowSearch(false); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await globalSearch(value.trim());
        setSearchResults(results);
        setShowSearch(true);
      } catch { setSearchResults(null); }
    }, 300);
  }

  /* Sidebar content (shared between desktop & mobile drawer) */
  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="flex h-16 items-center px-4 border-b border-white/8">
        <div className="flex items-center gap-3 overflow-hidden">
          {isCollapsed && !mobileOpen ? (
            <div className="min-w-[40px] flex justify-center">
              <MimaricLogo width={32} variant="dark" />
            </div>
          ) : (
            <MimaricLogo width={140} variant="dark" className="transition-opacity duration-300" />
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto pt-4 px-3 space-y-1 custom-scrollbar" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-all group relative min-h-[44px]",
                isActive
                  ? "bg-secondary/10 text-white border-inline-start-4 border-secondary pr-2 backdrop-blur-sm shadow-[inset_0_0_20px_hsl(148_76%_27%/0.05)]"
                  : "text-white/55 hover:bg-white/8 hover:text-white/90"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} className={cn("min-w-[20px]", isActive ? "text-green-bright" : "")} />
              {(!isCollapsed || mobileOpen) && <span className="font-primary">{item.label[lang]}</span>}

              {isCollapsed && !mobileOpen && (
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
      <div className="border-t border-white/8 p-3 space-y-1">
        {/* Desktop collapse toggle (hidden on mobile) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex flex-nowrap w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium whitespace-nowrap text-white/70 hover:bg-white/5 hover:text-white transition-all min-h-[44px]"
          aria-label={lang === "ar" ? "طي القائمة" : "Toggle sidebar"}
        >
          {isCollapsed
            ? (lang === "ar" ? <CaretLeft size={20} /> : <CaretRight size={20} />)
            : (lang === "ar" ? <CaretRight size={20} /> : <CaretLeft size={20} />)}
          {(!isCollapsed || mobileOpen) && <span>{lang === "ar" ? "طي القائمة" : "Collapse Sidebar"}</span>}
        </button>

        <Link
          href="/dashboard/help"
          className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all min-h-[44px]"
        >
          <Question size={20} />
          {(!isCollapsed || mobileOpen) && <span>{lang === "ar" ? "المساعدة" : "Help"}</span>}
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* D1: Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — Desktop: sticky, Mobile: drawer overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-gradient-to-b from-sidebar-bg to-sidebar-deep text-white shadow-xl transition-all duration-300 ease-in-out",
          /* Desktop */
          "lg:sticky lg:top-0 lg:h-screen",
          isCollapsed ? "lg:w-[68px]" : "lg:w-[256px]",
          /* Mobile: slide from right in RTL / left in LTR */
          mobileOpen
            ? "right-0 w-[280px] translate-x-0 lg:right-auto"
            : "right-0 w-[280px] translate-x-full lg:translate-x-0 lg:right-auto"
        )}
        aria-label={lang === "ar" ? "الشريط الجانبي" : "Sidebar"}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 start-3 lg:hidden p-2 text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={lang === "ar" ? "إغلاق القائمة" : "Close menu"}
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col transition-all duration-300 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* D1: Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2.5 text-neutral hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={lang === "ar" ? "فتح القائمة" : "Open menu"}
            >
              <List size={22} />
            </button>
            <nav className="hidden sm:flex items-center text-xs text-neutral font-medium uppercase tracking-wider" aria-label="Breadcrumb">
              {(() => {
                const segments = pathname.replace("/dashboard", "").split("/").filter(Boolean);
                const breadcrumbLabels: Record<string, { ar: string; en: string }> = {
                  "": { ar: "نظرة عامة", en: "Overview" },
                  "land": { ar: "الأراضي", en: "Land" },
                  "planning": { ar: "التخطيط", en: "Planning" },
                  "projects": { ar: "المشاريع", en: "Projects" },
                  "units": { ar: "الوحدات", en: "Units" },
                  "sales": { ar: "المبيعات", en: "Sales" },
                  "customers": { ar: "العملاء", en: "Customers" },
                  "contracts": { ar: "العقود", en: "Contracts" },
                  "reservations": { ar: "الحجوزات", en: "Reservations" },
                  "rentals": { ar: "الإيجارات", en: "Rentals" },
                  "finance": { ar: "المالية", en: "Finance" },
                  "escrow": { ar: "حسابات الضمان", en: "Escrow" },
                  "maintenance": { ar: "الصيانة", en: "Maintenance" },
                  "preventive": { ar: "الصيانة الوقائية", en: "Preventive" },
                  "reports": { ar: "التقارير", en: "Reports" },
                  "documents": { ar: "المستندات", en: "Documents" },
                  "settings": { ar: "الإعدادات", en: "Settings" },
                  "team": { ar: "الفريق", en: "Team" },
                  "security": { ar: "الأمان", en: "Security" },
                  "audit": { ar: "السجل", en: "Audit" },
                  "billing": { ar: "الفوترة", en: "Billing" },
                  "plans": { ar: "الباقات", en: "Plans" },
                  "invoices": { ar: "الفواتير", en: "Invoices" },
                  "admin": { ar: "إدارة المنصة", en: "Admin" },
                  "coupons": { ar: "الكوبونات", en: "Coupons" },
                  "subscriptions": { ar: "الاشتراكات", en: "Subscriptions" },
                  "payments": { ar: "المدفوعات", en: "Payments" },
                  "help": { ar: "المساعدة", en: "Help" },
                  "new": { ar: "جديد", en: "New" },
                  "wafi": { ar: "وافي", en: "Wafi" },
                  "site-logs": { ar: "سجل الموقع", en: "Site Logs" },
                  "onboarding": { ar: "التهيئة", en: "Onboarding" },
                  "governance": { ar: "الحوكمة", en: "Governance" },
                  "tree": { ar: "الهيكل", en: "Tree" },
                  "collections": { ar: "التحصيل", en: "Collections" },
                  "import": { ar: "استيراد", en: "Import" },
                  "change-requests": { ar: "طلبات التعديل", en: "Change Requests" },
                  "versions": { ar: "الإصدارات", en: "Versions" },
                  "payment-plan": { ar: "خطة الدفع", en: "Payment Plan" },
                  "templates": { ar: "القوالب", en: "Templates" },
                  "statement": { ar: "كشف حساب", en: "Statement" },
                  "preview": { ar: "معاينة", en: "Preview" },
                };
                const crumbs = [{ label: lang === "ar" ? "لوحة التحكم" : "Dashboard", href: "/dashboard" }];
                let path = "/dashboard";
                segments.forEach((seg) => {
                  path += `/${seg}`;
                  const label = breadcrumbLabels[seg]?.[lang] || seg;
                  crumbs.push({ label, href: path });
                });
                if (crumbs.length === 1) crumbs.push({ label: lang === "ar" ? "نظرة عامة" : "Overview", href: "/dashboard" });
                return crumbs.map((crumb, i) => (
                  <React.Fragment key={`${crumb.href}-${i}`}>
                    {i > 0 && <span className="mx-2 text-border">/</span>}
                    {i === crumbs.length - 1 ? (
                      <span className="text-primary" aria-current="page">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</Link>
                    )}
                  </React.Fragment>
                ));
              })()}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global Search */}
            <div className="hidden md:flex relative w-64 xl:w-96 group">
              <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults && setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder={lang === "ar" ? "بحث شامل في المشاريع، الوحدات، العقود..." : "Global search..."}
                className="w-full bg-muted/50 border-transparent rounded-md py-2 pr-10 pl-4 text-sm focus:bg-card focus:border-primary/20 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all outline-none"
                aria-label={lang === "ar" ? "بحث شامل" : "Global search"}
              />
              {showSearch && searchResults && (
                <div className="absolute top-full mt-1 w-full bg-card rounded-md shadow-raised border border-border z-50 max-h-80 overflow-y-auto">
                  {[
                    { key: "customers", label: lang === "ar" ? "العملاء" : "Customers", prefix: "/dashboard/sales/customers" },
                    { key: "projects", label: lang === "ar" ? "المشاريع" : "Projects", prefix: "/dashboard/projects" },
                    { key: "units", label: lang === "ar" ? "الوحدات" : "Units", prefix: "/dashboard/units" },
                    { key: "contracts", label: lang === "ar" ? "العقود" : "Contracts", prefix: "/dashboard/sales/contracts" },
                  ].map(({ key, label, prefix }) => {
                    const items = searchResults[key] ?? [];
                    if (!items.length) return null;
                    return (
                      <div key={key}>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-neutral bg-muted/30">{label}</div>
                        {items.map((item: any) => (
                          <Link
                            key={item.id}
                            href={`${prefix}/${item.id}`}
                            className="block px-3 py-2 text-sm text-primary hover:bg-muted/20 transition-colors"
                            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                          >
                            {item.name || item.unitNumber || item.number || item.id}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                  {Object.values(searchResults).every((arr: any) => !arr?.length) && (
                    <div className="px-3 py-4 text-sm text-neutral text-center">{lang === "ar" ? "لا توجد نتائج" : "No results"}</div>
                  )}
                </div>
              )}
            </div>

            {/* E3+E4+E5: Notification Bell — Popover + 44x44 touch target + ARIA */}
            <Popover open={showNotifs} onOpenChange={async (open) => {
              if (open) {
                const notifs = await getMyNotifications(10);
                setNotifications(notifs);
              }
              setShowNotifs(open);
            }}>
              <PopoverTrigger asChild>
                <button
                  className="relative p-2.5 text-neutral hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={lang === "ar" ? `الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ""}` : `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary ring-2 ring-card">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={8} className="w-80 p-0 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-bold text-primary">{lang === "ar" ? "الإشعارات" : "Notifications"}</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] text-secondary hover:underline">
                      {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-neutral text-center">{lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn(
                        "w-full text-start px-3 py-2.5 hover:bg-muted/20 transition-colors border-b border-border last:border-0",
                        !n.read && "bg-secondary/5"
                      )}
                    >
                      <p className="text-xs font-bold text-primary">{lang === "ar" ? n.title : (n.titleEn || n.title)}</p>
                      <p className="text-[10px] text-neutral mt-0.5 line-clamp-2">{lang === "ar" ? n.message : (n.messageEn || n.message)}</p>
                      <p className="text-[9px] text-neutral/60 mt-1">{new Date(n.createdAt).toLocaleDateString("en-CA")}</p>
                    </button>
                  ))
                )}
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* E5: Language Toggle — hover bg + text label */}
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 px-3 py-2 text-neutral hover:text-primary hover:bg-muted/60 rounded-md transition-all min-h-[44px]"
              aria-label={lang === "ar" ? "Switch to English" : "تغيير للعربية"}
            >
              <Globe size={20} />
              <span className="text-xs font-semibold hidden sm:inline">{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            <div className="h-8 w-px bg-border mx-1" />

            {/* User Profile Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-3 group min-h-[44px] min-w-[44px] justify-center"
                  aria-label={lang === "ar" ? "الملف الشخصي" : "Profile"}
                >
                  <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/30 group-hover:shadow-sm">
                    <User size={20} className="text-neutral group-hover:text-primary transition-colors" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-72 p-0 bg-card shadow-xl border-border/80">
                {/* User Info Header */}
                <div className="px-4 py-3.5 border-b border-border bg-muted/50 rounded-t-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0">
                      <User size={22} weight="fill" className="text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-primary truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{roleLabel[lang]}</p>
                      {orgName && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{orgName}</p>}
                    </div>
                  </div>
                  {session?.user?.email && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate" dir="ltr">{session.user.email}</p>
                  )}
                </div>
                {/* Quick Links */}
                <div className="py-1.5">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-muted/50 transition-colors"
                  >
                    <Gear size={18} className="text-muted-foreground" />
                    <span>{lang === "ar" ? "الإعدادات" : "Settings"}</span>
                  </Link>
                  <Link
                    href="/dashboard/settings/security"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-muted/50 transition-colors"
                  >
                    <ShieldCheck size={18} className="text-muted-foreground" />
                    <span>{lang === "ar" ? "الأمان" : "Security"}</span>
                  </Link>
                  <Link
                    href="/dashboard/help"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-muted/50 transition-colors"
                  >
                    <Question size={18} className="text-muted-foreground" />
                    <span>{lang === "ar" ? "المساعدة" : "Help"}</span>
                  </Link>
                </div>
                {/* Sign Out */}
                <div className="border-t border-border py-1.5">
                  <button
                    onClick={() => nextAuthSignOut({ callbackUrl: "/auth/login" })}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <SignOut size={18} />
                    <span>{lang === "ar" ? "تسجيل الخروج" : "Sign Out"}</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* D3: Dashboard Content with max-width constraint */}
        <div className="p-4 sm:p-6 lg:p-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardClientLayout({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <SimpleSessionProvider session={session}>
      <LanguageProvider>
        <DashboardContent>{children}</DashboardContent>
      </LanguageProvider>
    </SimpleSessionProvider>
  );
}
