"use client";

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
  Spinner
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Badge, Button, Input } from "@repo/ui";
import { getCustomers, updateCustomerStatus, createCustomer } from "../../../actions/customers";

const customerStatuses = [
  { id: "NEW", label: { ar: "جديد", en: "New" }, color: "bg-blue-500" },
  { id: "INTERESTED", label: { ar: "مهتم", en: "Interested" }, color: "bg-indigo-500" },
  { id: "QUALIFIED", label: { ar: "مؤهل", en: "Qualified" }, color: "bg-secondary" },
  { id: "VIEWING", label: { ar: "معاينة", en: "Viewing" }, color: "bg-accent" },
  { id: "RESERVED", label: { ar: "محجوز", en: "Reserved" }, color: "bg-amber-500" },
];

export default function CustomersPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    status: "NEW"
  });

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
      setNewCustomer({ name: "", phone: "", email: "", status: "NEW" });
    } catch (err) {
      alert("Failed to create customer");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
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
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" className="gap-2">
            <Funnel size={18} />
            {lang === "ar" ? "تصفية" : "Filter"}
          </Button>
          <Button size="md" className="gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 px-5 h-10" onClick={() => {
            setNewCustomer({ name: "", phone: "", email: "", status: "NEW" });
            setShowAddModal(true);
          }}>
            <Plus size={18} weight="bold" />
            {lang === "ar" ? "إضافة عميل" : "Add Customer"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white p-4 rounded-md border border-border">
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
              viewMode === "kanban" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-primary"
            )}
          >
            {lang === "ar" ? "لوحة كانبان" : "Kanban"}
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-[4px] transition-all",
              viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-primary"
            )}
          >
            {lang === "ar" ? "قائمة" : "List"}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <div className="flex h-[calc(100vh-280px)] gap-6 overflow-x-auto pb-4 custom-scrollbar" dir={lang === "ar" ? "rtl" : "ltr"}>
          {customerStatuses.map((status) => (
            <div key={status.id} className="flex h-full w-72 min-w-[288px] flex-col gap-4">
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
                    <div 
                      key={customer.id} 
                      className="group flex flex-col gap-3 rounded-md bg-white p-4 shadow-card border border-border hover:shadow-raised hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors truncate">
                          {customer.name}
                        </h4>
                        <Badge variant="available" className="text-[10px] bg-muted/50 text-neutral-foreground">
                          {customer.source || "Direct"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-neutral">
                          <Phone size={14} className="text-neutral/60" />
                          <span className="font-dm-sans" dir="ltr">{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-neutral">
                            <Envelope size={14} className="text-neutral/60" />
                            <span className="truncate max-w-[180px] font-dm-sans">{customer.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-3 border-t border-muted flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral/60">
                          <Calendar size={12} />
                          <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* Selector for status change in lieu of real dnd library to show backend works */}
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
                  ))}
                
                {/* Add Customer in Column */}
                <button 
                  onClick={() => {
                    setNewCustomer({ name: "", phone: "", email: "", status: status.id });
                    setShowAddModal(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-dashed border-muted py-3 text-xs text-neutral hover:bg-white hover:text-primary hover:border-primary/20 transition-all"
                >
                  <Plus size={14} />
                  <span>{lang === "ar" ? "إضافة عميل هنا" : "Add customer here"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-white overflow-hidden">
          <table className="w-full text-start border-collapse">
            <thead className="bg-muted capitalize">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border">
                  {lang === "ar" ? "الاسم" : "Name"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border">
                  {lang === "ar" ? "البيانات" : "Contact"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border">
                  {lang === "ar" ? "المصدر" : "Source"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border">
                  {lang === "ar" ? "تاريخ الإضافة" : "Date Added"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary text-start border-b border-border"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-primary border-b border-border">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 border-b border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral font-dm-sans" dir="ltr">{customer.phone}</span>
                      <span className="text-xs text-neutral/60 font-dm-sans">{customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-border">
                    <Badge variant={customer.status.toLowerCase() as any}>
                      {customerStatuses.find(s => s.id === customer.status)?.label[lang]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral border-b border-border">
                    {customer.source || "Direct"}
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral border-b border-border font-dm-sans">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-end border-b border-border">
                    <button className="p-1 text-neutral hover:text-primary transition-colors">
                      <DotsThreeVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-300" dir={lang === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-xl font-bold text-primary mb-6">
                 {lang === "ar" ? "إضافة عميل محتمل جديد" : "Add New Customer"}
              </h2>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                    <Input 
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder={lang === "ar" ? "اسم العميل..." : "Customer name..."}
                    />
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "رقم الجوال" : "Phone Number"}</label>
                    <Input 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="e.g. +966..."
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "البريد الإلكتروني" : "Email (Optional)"}</label>
                    <Input 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="example@mail.com"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral">{lang === "ar" ? "الحالة" : "Status"}</label>
                    <select 
                      value={newCustomer.status}
                      onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                       {customerStatuses.map(s => (
                         <option key={s.id} value={s.id}>{s.label[lang]}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                 <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button onClick={handleAddCustomer} disabled={saving} className="gap-2">
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
