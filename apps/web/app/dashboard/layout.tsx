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
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider, useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { hasPermission, type Permission } from "../../lib/permissions";
import { getUnreadCount, getMyNotifications, markAsRead, markAllAsRead } from "../actions/notifications";
import { globalSearch } from "../actions/search";

const navItems: { label: { ar: string; en: string }; icon: any; href: string; section: string; permission?: Permission }[] = [
  { label: { ar: "نظرة عامة", en: "Overview" }, icon: SquaresFour, href: "/dashboard", section: "main", permission: "dashboard:read" },
  { label: { ar: "الأراضي", en: "Land" }, icon: MapPin, href: "/dashboard/land", section: "main", permission: "land:read" },
  { label: { ar: "المشاريع", en: "Projects" }, icon: HouseLine, href: "/dashboard/projects", section: "main", permission: "projects:read" },
  { label: { ar: "الوحدات", en: "Units" }, icon: Buildings, href: "/dashboard/units", section: "main", permission: "units:read" },
  { label: { ar: "العملاء", en: "Customers" }, icon: Users, href: "/dashboard/sales/customers", section: "main", permission: "customers:read" },
  { label: { ar: "المبيعات", en: "Sales" }, icon: ChartLineUp, href: "/dashboard/sales", section: "main", permission: "contracts:read" },
  { label: { ar: "الإيجارات", en: "Rentals" }, icon: Tag, href: "/dashboard/rentals", section: "main", permission: "leases:read" },
  { label: { ar: "المالية", en: "Finance" }, icon: Receipt, href: "/dashboard/finance", section: "main", permission: "finance:read" },
  { label: { ar: "الصيانة", en: "Maintenance" }, icon: Wrench, href: "/dashboard/maintenance", section: "main", permission: "maintenance:read" },
  { label: { ar: "التقارير", en: "Reports" }, icon: FileText, href: "/dashboard/reports", section: "secondary", permission: "reports:read" },
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

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true; // Settings always visible
    return hasPermission(userRole, item.permission);
  });

  // Fetch unread notification count
  React.useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [pathname]);

  async function toggleNotifications() {
    if (!showNotifs) {
      const notifs = await getMyNotifications(10);
      setNotifications(notifs);
    }
    setShowNotifs(!showNotifs);
    setShowSearch(false);
  }

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
        setShowNotifs(false);
      } catch { setSearchResults(null); }
    }, 300);
  }

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
          {filteredNavItems.map((item) => {
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
            className="flex flex-nowrap w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap text-white/70 hover:bg-white/5 hover:text-white transition-all"
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
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults && setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder={lang === "ar" ? "بحث شامل في المشاريع، الوحدات، العقود..." : "Global search..."}
                className="w-full bg-muted/50 border-transparent rounded-md py-2 pr-10 pl-4 text-sm focus:bg-white focus:border-primary/20 focus:ring-0 transition-all outline-none"
              />
              {showSearch && searchResults && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-raised border border-border z-50 max-h-80 overflow-y-auto">
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

            {/* Notification Bell */}
            <div className="relative">
              <button onClick={toggleNotifications} className="relative p-2 text-neutral hover:text-primary transition-colors">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 left-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute top-full mt-1 left-0 w-80 bg-white rounded-md shadow-raised border border-border z-50 max-h-96 overflow-y-auto">
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
                </div>
              )}
            </div>

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
