"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SimpleSessionProvider, useSession } from "../../components/SimpleSessionProvider";
import { LanguageProvider, useLanguage } from "../../components/LanguageProvider";
import { AppSidebar } from "../../components/shell/AppSidebar";
import { AppTopbar } from "../../components/shell/AppTopbar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang } = useLanguage();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const userRole = (session?.user as any)?.role ?? "USER";

  // Close mobile drawer on route change
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <AppSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        userRole={userRole}
      />
      <main className="flex flex-1 flex-col transition-all duration-300 min-w-0">
        <AppTopbar onMenuClick={() => setMobileOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto overflow-x-hidden">
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
