"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  Plus,
  DotsThreeVertical,
  User,
  Phone,
  Envelope,
  Calendar,
  Funnel,
  ArrowsDownUp,
  MagnifyingGlass,
  Spinner,
  DownloadSimple,
  FilePdf,
  Eye,
  EyeSlash
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import {
  Badge,
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui";
import { getCustomers, updateCustomerStatus, createCustomer, getCustomerUnitAssignments } from "../../../actions/customers";
import { exportToExcel, exportToPDF } from "../../../../lib/export";
import { usePermissions } from "../../../../hooks/usePermissions";
import { maskNationalId, maskPhone, maskEmail } from "../../../../lib/pii-masking";
import { formatDualDate } from "../../../../lib/hijri";

const customerStatuses = [
  { id: "NEW", label: { ar: "جديد", en: "New" }, color: "bg-blue-500" },
  { id: "INTERESTED", label: { ar: "مهتم", en: "Interested" }, color: "bg-indigo-500" },
  { id: "QUALIFIED", label: { ar: "مؤهل", en: "Qualified" }, color: "bg-secondary" },
  { id: "VIEWING", label: { ar: "معاينة", en: "Viewing" }, color: "bg-accent" },
  { id: "RESERVED", label: { ar: "محجوز", en: "Reserved" }, color: "bg-amber-500" },
];

export default function CustomersPage() {
  const { lang } = useLanguage();
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    nationalId: "",
    nameArabic: "",
    personType: "",
    gender: "",
    nationality: "",
    status: "NEW"
  });
  const [showOptionalFields, setShowOptionalFields] = React.useState(false);
  const [showPii, setShowPii] = React.useState(false);
  const [expandedCustomer, setExpandedCustomer] = React.useState<string | null>(null);
  const [customerUnits, setCustomerUnits] = React.useState<any[]>([]);
  const [loadingUnits, setLoadingUnits] = React.useState(false);
  const { can } = usePermissions();
  const hasPiiAccess = can("customers:read_pii");

  async function toggleCustomerUnits(customerId: string) {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      setCustomerUnits([]);
      return;
    }
    setExpandedCustomer(customerId);
    setLoadingUnits(true);
    try {
      const assignments = await getCustomerUnitAssignments(customerId);
      setCustomerUnits(assignments);
    } catch (e) {
      console.error(e);
      setCustomerUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }

  const unitTypeLabelsAr: Record<string, string> = {
    reservation: "حجز",
    contract: "عقد بيع",
    lease: "عقد إيجار",
  };

  React.useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    // Optimistic update
    const previousCustomers = [...customers];
    setCustomers(customers.map(l => l.id === customerId ? { ...l, status: newStatus } : l));

    try {
      await updateCustomerStatus(customerId, newStatus);
    } catch (err) {
      setCustomers(previousCustomers);
      alert("Failed to update status");
    }
  };

  const handleAddCustomer = async () => {
    setSaving(true);
    try {
      const customer = await createCustomer(newCustomer);
      setCustomers(prev => [customer, ...prev]);
      setShowAddModal(false);
      setNewCustomer({ name: "", phone: "", email: "", nationalId: "", nameArabic: "", personType: "", gender: "", nationality: "", status: "NEW" });
      setShowOptionalFields(false);
    } catch (err) {
      alert("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    const columns = [
      { header: lang === "ar" ? "الاسم" : "Name", key: "name", width: 25 },
      { header: lang === "ar" ? "رقم الجوال" : "Phone", key: "phone", width: 20 },
      { header: lang === "ar" ? "البريد الإلكتروني" : "Email", key: "email", width: 30 },
      { header: lang === "ar" ? "الحالة" : "Status", key: "status", width: 15, render: (s: any) => customerStatuses.find(st => st.id === s)?.label[lang] || s },
      { header: lang === "ar" ? "المصدر" : "Source", key: "source", width: 15 },
      { header: lang === "ar" ? "تاريخ الإضافة" : "Date Added", key: "createdAt", width: 20, render: (d: any) => formatDualDate(d, lang) },
    ];
    await exportToExcel({
      data: customers,
      columns,
      filename: "Mimaric_Customers_" + new Date().toISOString().split('T')[0],
      lang,
      title: lang === "ar" ? "قائمة العملاء" : "Customers List"
    });
  };

  const handleExportPDF = async () => {
    // If we're in Kanban mode, switch to List mode first so the table renders
    const doExport = () => exportToPDF({
      elementId: "customers-table",
      filename: "Mimaric_Customers_" + new Date().toISOString().split('T')[0],
      title: lang === "ar" ? "قائمة العملاء" : "Customers List",
      lang
    });

    if (viewMode !== "list") {
      setViewMode("list");
      setTimeout(doExport, 500); // give React time to render the table DOM
    } else {
      await doExport();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "إدارة العملاء المحتملين" : "Customer Management"}
          </h1>
          <p className="text-sm text-neutral font-dm-sans mt-1">
            {lang === "ar" ? "تتبع وتحويل العملاء المحتملين إلى مبيعات ناجحة" : "Track and convert potential customers into successful sales"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can("customers:export") && (
            <Button variant="secondary" size="sm" className="gap-1.5 hover:bg-secondary/15 hover:border-secondary/50 hover:text-secondary" onClick={handleExportExcel}>
              <DownloadSimple size={16} />
              {lang === "ar" ? "Excel" : "Excel"}
            </Button>
          )}
          {can("customers:export") && (
            <Button variant="secondary" size="sm" className="gap-1.5 hover:bg-destructive/15 hover:border-destructive/50 hover:text-destructive" onClick={handleExportPDF}>
              <FilePdf size={16} />
              {lang === "ar" ? "PDF" : "PDF"}
            </Button>
          )}
          {hasPiiAccess && (
            <Button
              variant="secondary"
              size="sm"
              className={cn("gap-1.5 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700", showPii && "bg-amber-50 border-amber-200 text-amber-700")}

              onClick={() => setShowPii(!showPii)}
            >
              {showPii ? <EyeSlash size={16} /> : <Eye size={16} />}
              {showPii ? (lang === "ar" ? "إخفاء" : "Hide PII") : (lang === "ar" ? "كشف" : "PII")}
            </Button>
          )}
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Funnel size={16} />
            {lang === "ar" ? "تصفية" : "Filter"}
          </Button>
          {can("customers:write") && (
          <Button size="sm" className="gap-1.5 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 px-4 h-8" onClick={() => {
            setNewCustomer({ name: "", phone: "", email: "", nationalId: "", nameArabic: "", personType: "", gender: "", nationality: "", status: "NEW" });
            setShowOptionalFields(false);
            setShowAddModal(true);
          }}>
            <Plus size={18} weight="bold" />
            {lang === "ar" ? "إضافة عميل" : "Add Customer"}
          </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="relative w-full sm:w-80 group">
            <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={lang === "ar" ? "بحث بالاسم، الجوال أو البريد..." : "Search by name, phone or email..."}
              className="pr-10 h-10 border-muted bg-muted/20"
            />
          </div>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-[4px] transition-all",
                viewMode === "kanban" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-primary"
              )}
            >
              {lang === "ar" ? "لوحة كانبان" : "Kanban"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-[4px] transition-all",
                viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-primary"
              )}
            >
              {lang === "ar" ? "قائمة" : "List"}
            </button>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <div className="flex h-[calc(100vh-280px)] gap-4 overflow-x-auto pb-4 custom-scrollbar max-w-full" dir={lang === "ar" ? "rtl" : "ltr"}>
          {customerStatuses.map((status) => (
            <div key={status.id} className="flex h-full w-64 min-w-[256px] flex-col gap-3 shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", status.color)} />
                  <h3 className="text-sm font-bold text-primary">{status.label[lang]}</h3>
                  <Badge variant="available" className="bg-muted text-neutral-foreground font-bold px-1.5 py-0 h-5">
                    {customers.filter(l => l.status === status.id).length}
                  </Badge>
                </div>
                <button className="text-neutral hover:text-primary">
                  <DotsThreeVertical size={20} />
                </button>
              </div>

              {/* Column Content */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-2 rounded-md bg-muted/30 border border-dashed border-muted">
                {customers
                  .filter((customer) => customer.status === status.id)
                  .map((customer) => (
                    <Card
                      key={customer.id}
                      className="group flex flex-col gap-3 p-4 hover:shadow-raised hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors truncate">
                          {customer.name}
                        </h4>
                        <Badge variant="draft" className="text-[9px] bg-muted font-bold px-2 py-0.5">
                          {customer.source || "Direct"}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        {customer.nationalId && hasPiiAccess && (
                          <div className="flex items-center gap-2 text-xs text-neutral">
                            <User size={14} className="text-neutral/60" />
                            <span className="font-dm-sans" dir="ltr">{showPii ? customer.nationalId : maskNationalId(customer.nationalId)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-neutral">
                          <Phone size={14} className="text-neutral/60" />
                          <span className="font-dm-sans" dir="ltr">{hasPiiAccess ? (showPii ? customer.phone : maskPhone(customer.phone)) : customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-neutral">
                            <Envelope size={14} className="text-neutral/60" />
                            <span className="truncate max-w-[180px] font-dm-sans">{hasPiiAccess ? (showPii ? customer.email : maskEmail(customer.email)) : customer.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-3 border-t border-muted flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral/60">
                          <Calendar size={12} />
                          <span>{formatDualDate(customer.createdAt, lang)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCustomerUnits(customer.id); }}
                            className={cn("text-[10px] font-bold transition-colors", expandedCustomer === customer.id ? "text-secondary" : "text-neutral/60 hover:text-primary")}
                          >
                            {lang === "ar" ? "الوحدات" : "Units"}
                          </button>
                          <select
                            value={customer.status}
                            onChange={(e) => handleStatusChange(customer.id, e.target.value)}
                            className="text-[10px] border-none bg-transparent text-primary font-bold focus:ring-0"
                          >
                            {customerStatuses.map(s => (
                              <option key={s.id} value={s.id}>{s.label[lang]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {expandedCustomer === customer.id && (
                        <div className="mt-2 pt-2 border-t border-muted/50">
                          {loadingUnits ? (
                            <p className="text-[10px] text-neutral text-center py-2">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
                          ) : customerUnits.length === 0 ? (
                            <p className="text-[10px] text-neutral/60 text-center py-1">{lang === "ar" ? "لا توجد وحدات مرتبطة" : "No linked units"}</p>
                          ) : (
                            <div className="space-y-1">
                              {customerUnits.map((cu: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] py-1">
                                  <span className="font-bold text-primary">{cu.unitNumber} — {cu.building}</span>
                                  <Badge variant="draft" className="text-[8px] py-0">{lang === "ar" ? unitTypeLabelsAr[cu.type] ?? cu.type : cu.type}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}

                {/* Add Customer in Column */}
                <button
                  onClick={() => {
                    setNewCustomer({ name: "", phone: "", email: "", nationalId: "", nameArabic: "", personType: "", gender: "", nationality: "", status: status.id });
                    setShowAddModal(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-dashed border-muted py-3 text-xs text-neutral hover:bg-card hover:text-primary hover:border-primary/20 transition-all"
                >
                  <Plus size={14} />
                  <span>{lang === "ar" ? "إضافة عميل هنا" : "Add customer here"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden" id="customers-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {lang === "ar" ? "الاسم" : "Name"}
                </TableHead>
                {hasPiiAccess && (
                <TableHead>
                  {lang === "ar" ? "رقم الهوية" : "National ID"}
                </TableHead>
                )}
                <TableHead>
                  {lang === "ar" ? "البيانات" : "Contact"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "الحالة" : "Status"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "المصدر" : "Source"}
                </TableHead>
                <TableHead>
                  {lang === "ar" ? "تاريخ الإضافة" : "Date Added"}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="group">
                  <TableCell>
                    <div className="text-sm font-bold text-primary">{customer.name}</div>
                    {customer.nameArabic && customer.nameArabic !== customer.name && (
                      <div className="text-[10px] text-neutral/60">{customer.nameArabic}</div>
                    )}
                  </TableCell>
                  {hasPiiAccess && (
                  <TableCell className="text-xs text-neutral font-dm-sans" dir="ltr">
                    {customer.nationalId ? (showPii ? customer.nationalId : maskNationalId(customer.nationalId)) : "—"}
                  </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral font-dm-sans" dir="ltr">{hasPiiAccess ? (showPii ? customer.phone : maskPhone(customer.phone)) : customer.phone}</span>
                      <span className="text-xs text-neutral/60 font-dm-sans">{hasPiiAccess ? (showPii ? customer.email : maskEmail(customer.email)) : customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.status.toLowerCase() as any}>
                      {customerStatuses.find(s => s.id === customer.status)?.label[lang]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-neutral">
                    {customer.source || "Direct"}
                  </TableCell>
                  <TableCell className="text-xs text-neutral font-dm-sans">
                    {formatDualDate(customer.createdAt, lang)}
                  </TableCell>
                  <TableCell className="text-end">
                    <button className="p-1 text-neutral hover:text-primary transition-colors">
                      <DotsThreeVertical size={18} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-primary mb-6">
                 {lang === "ar" ? "إضافة عميل محتمل جديد" : "Add New Customer"}
              </h2>

              <div className="space-y-4">
                 {/* Required Fields */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الاسم الكامل" : "Full Name"} <span className="text-red-500">*</span></label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder={lang === "ar" ? "اسم العميل..." : "Customer name..."}
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الجوال" : "Phone Number"} <span className="text-red-500">*</span></label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الهوية / الإقامة" : "National ID / Iqama"} <span className="text-red-500">*</span></label>
                    <Input
                      value={newCustomer.nationalId}
                      onChange={(e) => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                      placeholder="10XXXXXXXX"
                      dir="ltr"
                      maxLength={10}
                    />
                    <p className="text-[10px] text-neutral/60">{lang === "ar" ? "١٠ أرقام، يبدأ بـ 1 أو 2" : "10 digits, starts with 1 or 2"}</p>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                    <Input
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="example@mail.com"
                      dir="ltr"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الحالة" : "Status"}</label>
                    <select
                      value={newCustomer.status}
                      onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                       {customerStatuses.map(s => (
                         <option key={s.id} value={s.id}>{s.label[lang]}</option>
                       ))}
                    </select>
                 </div>

                 {/* Optional Absher-aligned Fields */}
                 <button
                   type="button"
                   onClick={() => setShowOptionalFields(!showOptionalFields)}
                   className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors pt-2"
                 >
                   <span>{showOptionalFields ? "−" : "+"}</span>
                   {lang === "ar" ? "بيانات إضافية (أبشر)" : "Additional Info (Absher)"}
                 </button>

                 {showOptionalFields && (
                   <div className="space-y-4 p-4 bg-muted/20 rounded-md border border-border animate-in fade-in duration-200">
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الاسم بالعربي" : "Name in Arabic"}</label>
                       <Input
                         value={newCustomer.nameArabic}
                         onChange={(e) => setNewCustomer({...newCustomer, nameArabic: e.target.value})}
                         placeholder={lang === "ar" ? "الاسم الكامل بالعربي..." : "Full name in Arabic..."}
                         dir="rtl"
                       />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <label className="text-xs font-bold text-neutral">{lang === "ar" ? "نوع الشخص" : "Person Type"}</label>
                         <select
                           value={newCustomer.personType}
                           onChange={(e) => setNewCustomer({...newCustomer, personType: e.target.value})}
                           className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                         >
                           <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                           <option value="SAUDI_CITIZEN">{lang === "ar" ? "مواطن سعودي" : "Saudi Citizen"}</option>
                           <option value="RESIDENT">{lang === "ar" ? "مقيم" : "Resident"}</option>
                           <option value="GCC_CITIZEN">{lang === "ar" ? "مواطن خليجي" : "GCC Citizen"}</option>
                           <option value="VISITOR">{lang === "ar" ? "زائر" : "Visitor"}</option>
                           <option value="OTHER_PERSON">{lang === "ar" ? "أخرى" : "Other"}</option>
                         </select>
                       </div>

                       <div className="space-y-1">
                         <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الجنس" : "Gender"}</label>
                         <select
                           value={newCustomer.gender}
                           onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}
                           className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                         >
                           <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                           <option value="MALE">{lang === "ar" ? "ذكر" : "Male"}</option>
                           <option value="FEMALE">{lang === "ar" ? "أنثى" : "Female"}</option>
                         </select>
                       </div>
                     </div>

                     <div className="space-y-1">
                       <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الجنسية" : "Nationality"}</label>
                       <Input
                         value={newCustomer.nationality}
                         onChange={(e) => setNewCustomer({...newCustomer, nationality: e.target.value})}
                         placeholder={lang === "ar" ? "مثال: سعودي" : "e.g. Saudi Arabian"}
                       />
                     </div>
                   </div>
                 )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                 <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button onClick={handleAddCustomer} disabled={saving || !newCustomer.name || !newCustomer.phone || !newCustomer.nationalId} className="gap-2">
                    {saving && <Spinner className="h-4 w-4 animate-spin text-white" />}
                    {lang === "ar" ? "حفظ البيانات" : "Save Customer"}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
