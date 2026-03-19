import type { Permission } from "../../lib/permissions";

export interface NavItem {
  label: { ar: string; en: string };
  icon: string; // Lucide icon name
  href: string;
  section: "core" | "operations" | "system";
  permission?: Permission;
}

export const navItems: NavItem[] = [
  // Core
  { label: { ar: "نظرة عامة", en: "Overview" }, icon: "LayoutGrid", href: "/dashboard", section: "core", permission: "dashboard:read" },
  { label: { ar: "المشاريع", en: "Projects" }, icon: "FolderKanban", href: "/dashboard/projects", section: "core", permission: "projects:read" },
  { label: { ar: "الوحدات", en: "Units" }, icon: "Building2", href: "/dashboard/units", section: "core", permission: "units:read" },
  { label: { ar: "العملاء", en: "Customers" }, icon: "Users", href: "/dashboard/sales/customers", section: "core", permission: "customers:read" },
  { label: { ar: "المبيعات", en: "Sales" }, icon: "TrendingUp", href: "/dashboard/sales", section: "core", permission: "contracts:read" },
  { label: { ar: "الإيجارات", en: "Leases" }, icon: "KeyRound", href: "/dashboard/rentals", section: "core", permission: "leases:read" },

  // Operations
  { label: { ar: "نظام المعلومات الجغرافية", en: "GIS" }, icon: "Globe", href: "/dashboard/gis", section: "operations", permission: "gis:read" },
  { label: { ar: "الأراضي", en: "Land" }, icon: "MapPin", href: "/dashboard/land", section: "operations", permission: "land:read" },
  { label: { ar: "التخطيط", en: "Planning" }, icon: "Compass", href: "/dashboard/planning", section: "operations", permission: "planning:read" },
  { label: { ar: "المالية", en: "Finance" }, icon: "Receipt", href: "/dashboard/finance", section: "operations", permission: "finance:read" },
  { label: { ar: "الصيانة", en: "Maintenance" }, icon: "Wrench", href: "/dashboard/maintenance", section: "operations", permission: "maintenance:read" },
  { label: { ar: "التقارير", en: "Reports" }, icon: "FileText", href: "/dashboard/reports", section: "operations", permission: "reports:read" },
  { label: { ar: "المستندات", en: "Documents" }, icon: "FolderOpen", href: "/dashboard/documents", section: "operations", permission: "documents:read" },

  // System
  { label: { ar: "الاشتراك والفوترة", en: "Billing" }, icon: "CreditCard", href: "/dashboard/billing", section: "system", permission: "billing:read" },
  { label: { ar: "إدارة المنصة", en: "Admin" }, icon: "ShieldCheck", href: "/dashboard/admin", section: "system", permission: "billing:admin" },
  { label: { ar: "الإعدادات", en: "Settings" }, icon: "Settings", href: "/dashboard/settings", section: "system", permission: "organization:read" },
];

export const breadcrumbLabels: Record<string, { ar: string; en: string }> = {
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
  "pricing": { ar: "التسعير", en: "Pricing" },
  "inventory": { ar: "المخزون", en: "Inventory" },
  "subdivision": { ar: "التقسيم", en: "Subdivision" },
  "tickets": { ar: "التذاكر", en: "Tickets" },
  "gis": { ar: "نظام المعلومات الجغرافية", en: "GIS" },
  "land-bank": { ar: "بنك الأراضي", en: "Land Bank" },
  "sales-map": { ar: "خريطة المبيعات", en: "Sales Map" },
  "phases": { ar: "المراحل", en: "Phases" },
  "construction": { ar: "التنفيذ", en: "Construction" },
  "handover": { ar: "التسليم", en: "Handover" },
  "assets": { ar: "الأصول", en: "Assets" },
  "overview": { ar: "نظرة عامة", en: "Overview" },
};

export const roleLabels: Record<string, { ar: string; en: string }> = {
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

export const sectionLabels: Record<string, { ar: string; en: string }> = {
  core: { ar: "الأساسية", en: "Core" },
  operations: { ar: "العمليات", en: "Operations" },
  system: { ar: "النظام", en: "System" },
};
