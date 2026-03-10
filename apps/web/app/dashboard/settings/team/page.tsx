"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import {
  UserPlus,
  Envelope,
  ShieldCheck,
  DotsThreeVertical,
  Clock,
  Trash,
  UserGear,
  Funnel,
  MagnifyingGlass,
  X
} from "@phosphor-icons/react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getTeamMembers, inviteTeamMember, removeTeamMember } from "../../../actions/team";
import { hasPermission, CUSTOMER_ASSIGNABLE_ROLES } from "../../../../lib/permissions";

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  SYSTEM_SUPPORT: "System Support",
  COMPANY_ADMIN: "Company Admin",
  // Backward compat
  SUPER_ADMIN: "Company Admin",
  DEV_ADMIN: "System Support",
  PROJECT_MANAGER: "Project Manager",
  SALES_MANAGER: "Sales Manager",
  SALES_AGENT: "Sales Agent",
  PROPERTY_MANAGER: "Property Manager",
  FINANCE_OFFICER: "Finance Officer",
  TECHNICIAN: "Technician",
  BUYER: "Buyer",
  TENANT: "Tenant",
  USER: "User",
};

// Only customer-assignable roles shown in invite dropdown
const inviteRoleOptions: { value: string; label: string }[] = CUSTOMER_ASSIGNABLE_ROLES.map((r) => ({
  value: r,
  label: roleLabels[r] ?? r,
}));

export default function TeamManagementPage() {
  const { lang } = useLanguage();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("SALES_AGENT");
  const [invitePassword, setInvitePassword] = React.useState("");
  const [inviting, setInviting] = React.useState(false);

  const fetchTeam = React.useCallback(() => {
    getTeamMembers()
      .then((data) => setMembers(data as TeamMember[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail || !invitePassword) return;
    setInviting(true);
    try {
      await inviteTeamMember({ name: inviteName, email: inviteEmail, role: inviteRole, password: invitePassword });
      setShowInvite(false);
      setInviteName(""); setInviteEmail(""); setInvitePassword(""); setInviteRole("SALES_AGENT");
      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, name: string | null) => {
    if (!confirm(`${lang === "ar" ? "هل أنت متأكد من حذف" : "Remove"} ${name}?`)) return;
    try {
      await removeTeamMember(userId);
      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "إدارة فريق العمل" : "Team Management"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "دعوة الموظفين وتعيين الصلاحيات وإدارة أدوار الفريق." : "Invite staff, assign permissions, and manage team roles."}
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-secondary hover:bg-green-bright transition-colors" onClick={() => setShowInvite(true)}>
          <UserPlus size={18} weight="fill" />
          {lang === "ar" ? "دعوة عضو جديد" : "Invite Member"}
        </Button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="bg-card rounded-md shadow-card border border-secondary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">{lang === "ar" ? "دعوة عضو جديد" : "Invite New Member"}</h3>
            <button onClick={() => setShowInvite(false)}><X size={18} className="text-neutral" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder={lang === "ar" ? "الاسم" : "Name"} value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            <Input type="email" placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Input type="password" placeholder={lang === "ar" ? "كلمة المرور" : "Password"} value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded border border-border px-3 py-2 text-sm">
              {inviteRoleOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <Button className="bg-secondary" onClick={handleInvite} disabled={inviting}>
            {inviting ? "..." : (lang === "ar" ? "إضافة" : "Add Member")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "العضو" : "Member"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "الدور" : "Role"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-start font-latin">{lang === "ar" ? "تاريخ الانضمام" : "Joined"}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral text-center font-latin">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral text-sm animate-pulse">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral text-sm">{lang === "ar" ? "لا يوجد أعضاء" : "No team members"}</td></tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                        <span className="text-xs font-bold uppercase font-latin">{(member.name ?? "?").split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary font-primary">{member.name}</p>
                        <p className="text-[10px] text-neutral font-latin">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <UserGear size={16} className="text-neutral" />
                        <span className="text-xs font-semibold text-primary font-latin">{roleLabels[member.role] ?? member.role}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hasPermission(member.role, "customers:read_pii") && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">{lang === "ar" ? "بيانات شخصية" : "PII Access"}</span>
                        )}
                        {hasPermission(member.role, "customers:export") && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">{lang === "ar" ? "تصدير" : "Export"}</span>
                        )}
                        {hasPermission(member.role, "finance:read") && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{lang === "ar" ? "مالية" : "Finance"}</span>
                        )}
                        {hasPermission(member.role, "audit:read") && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">{lang === "ar" ? "مراجعة" : "Audit"}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-neutral font-latin">
                      <Clock size={14} />
                      {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded shadow-sm hover:text-destructive" onClick={() => handleRemove(member.id, member.name)}>
                        <Trash size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" }, desc: { ar: "إدارة من يمكنه رؤية البيانات الحساسة أو تعديل الأسعار.", en: "Manage who can see sensitive data or modify prices." }, icon: ShieldCheck },
          { title: { ar: "تقارير النشاط", en: "Activity Reports" }, desc: { ar: "تتبع نشاط الفريق والمهام المنجزة في النظام.", en: "Track team activity and completed tasks." }, icon: UserGear },
          { title: { ar: "نظام الدعوات", en: "Invitation System" }, desc: { ar: "دعوة آمنة عبر البريد الإلكتروني مع انتهاء تلقائي.", en: "Secure email invitations with auto-expiry." }, icon: Envelope },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-card rounded-md border border-border flex items-start gap-4 hover:border-secondary/20 transition-all">
            <div className="p-3 bg-secondary/10 rounded text-secondary">
              <item.icon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-primary font-primary">{item.title[lang]}</h4>
              <p className="text-[10px] text-neutral mt-1 font-primary leading-relaxed">{item.desc[lang]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
