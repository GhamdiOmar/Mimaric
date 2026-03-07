"use client";

import * as React from "react";
import { 
  UserPlus, 
  Envelope, 
  ShieldCheck, 
  DotsThreeVertical, 
  CheckCircle,
  Clock,
  Trash,
  UserGear,
  Funnel,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";

const mockTeam = [
  { id: "1", name: "أحمد الشهري", email: "a.shehri@mimaric.sa", role: "Manager", status: "active", lastActive: "Just now" },
  { id: "2", name: "نورة القحطاني", email: "n.qahtani@mimaric.sa", role: "Sales Agent", status: "active", lastActive: "2h ago" },
  { id: "3", name: "بندر بن خالد", email: "b.khaled@mimaric.sa", role: "Finance Officer", status: "invited", lastActive: "Pending" },
  { id: "4", name: "فيصل العتيبي", email: "f.otaibi@mimaric.sa", role: "Technician", status: "active", lastActive: "1d ago" },
];

export default function TeamManagementPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "إدارة فريق العمل" : "Team Management"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "دعوة الموظفين وتعيين الصلاحيات وإدارة أدوار الفريق." : "Invite staff, assign permissions, and manage team roles."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
             {lang === "ar" ? "English" : "العربية"}
          </Button>
          <Button size="sm" className="gap-2 bg-secondary hover:bg-green-bright transition-colors">
            <UserPlus size={18} weight="fill" />
            {lang === "ar" ? "دعوة عضو جديد" : "Invite Member"}
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-card border border-border overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-80 group">
              <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral group-focus-within:text-secondary transition-colors" />
              <input 
                type="text" 
                placeholder={lang === "ar" ? "بحث في الفريق..." : "Search team..."}
                className="w-full bg-white border-border rounded py-2 pr-10 pl-4 text-sm focus:border-secondary/40 outline-none transition-all font-primary"
              />
           </div>
           <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="gap-2">
                 <Funnel size={16} />
                 {lang === "ar" ? "تصفية" : "Filter"}
              </Button>
              <Button variant="secondary" size="sm" className="gap-2">
                 <ShieldCheck size={16} />
                 {lang === "ar" ? "إعدادات الأدوار" : "Role Settings"}
              </Button>
           </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "العضو" : "Member"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "الدور" : "Role"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "النشاط الأخير" : "Last Active"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-center font-latin">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTeam.map((member) => (
                <tr key={member.id} className="hover:bg-muted/5 transition-colors group group-hover:cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                          <span className="text-xs font-bold uppercase font-latin">{member.name.split(' ').map(n => n[0]).join('')}</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-primary font-primary">{member.name}</p>
                          <p className="text-[10px] text-neutral font-latin">{member.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <UserGear size={16} className="text-neutral" />
                       <span className="text-xs font-semibold text-primary font-primary">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={member.status === "active" ? "available" : "draft"} className="text-[10px]">
                       {member.status === "active" ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "مدعو" : "Invited")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-neutral font-latin">
                       <Clock size={14} />
                       {member.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm hover:text-secondary">
                          <ShieldCheck size={18} />
                       </Button>
                       <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm hover:text-destructive">
                          <Trash size={18} />
                       </Button>
                       <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm">
                          <DotsThreeVertical size={18} />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { title: "الأدوار والصلاحيات", ar: "إدارة من يمكنه رؤية البيانات الحساسة أو تعديل الأسعار.", en: "Manage who can see sensitive data or modify prices.", icon: ShieldCheck },
           { title: "تقارير النشاط", ar: "تتبع نشاط الفريق والمهام المنجزة في النظام.", en: "Track team activity and completed tasks.", icon: UserGear },
           { title: "نظام الدعوات", ar: "دعوة آمنة عبر البريد الإلكتروني مع انتهاء تلقائي.", en: "Secure email invitations with auto-expiry.", icon: Envelope },
         ].map((item, i) => (
           <div key={i} className="p-6 bg-white rounded-md border border-border flex items-start gap-4 hover:border-secondary/20 transition-all">
              <div className="p-3 bg-secondary/10 rounded text-secondary">
                 <item.icon size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-primary font-primary">{lang === "ar" ? item.title : item.title}</h4>
                 <p className="text-[10px] text-neutral mt-1 font-primary customering-relaxed">{lang === "ar" ? item.ar : item.en}</p>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
