"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CaretLeft,
  Bank,
  HardHat,
  UsersThree,
  Certificate,
  CloudArrowUp,
  Plus,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Clock,
  Eye,
} from "@phosphor-icons/react";
import { Button, Badge, KPICard, EmptyState } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";

import { getEscrowAccount, createEscrowAccount, recordEscrowDeposit, requestEscrowWithdrawal, approveEscrowWithdrawal } from "../../../../actions/escrow";
import { getProjectMilestones, createMilestone, certifyMilestone } from "../../../../actions/milestones";
import { getProjectConsultants, assignConsultant } from "../../../../actions/consultants";
import { getProjectWafiContracts, createWafiContract, getProjectDelayPenalties } from "../../../../actions/wafi-contracts";
import { getWafiLicense, createWafiLicense, updateWafiLicense } from "../../../../actions/wafi-license";
import { getEtmamRegistration, registerWithEtmam, triggerEtmamSync, getEtmamSyncHistory, getNextSyncSchedule, generateQuarterlyReport } from "../../../../actions/etmam";

type Tab = "escrow" | "milestones" | "consultants" | "contracts" | "license" | "etmam";

const tabs: { id: Tab; label: { ar: string; en: string }; icon: any }[] = [
  { id: "escrow", label: { ar: "حساب الضمان", en: "Escrow" }, icon: Bank },
  { id: "milestones", label: { ar: "المراحل الإنشائية", en: "Milestones" }, icon: HardHat },
  { id: "consultants", label: { ar: "الاستشاريون", en: "Consultants" }, icon: UsersThree },
  { id: "contracts", label: { ar: "عقود وافي", en: "Wafi Contracts" }, icon: Certificate },
  { id: "license", label: { ar: "ترخيص وافي", en: "Wafi License" }, icon: Certificate },
  { id: "etmam", label: { ar: "إتمام", en: "Etmam" }, icon: CloudArrowUp },
];

export default function WafiCompliancePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = React.useState<Tab>("escrow");
  const { lang } = useLanguage();

  // ── Escrow State ──
  const [escrow, setEscrow] = React.useState<any>(null);
  const [escrowLoading, setEscrowLoading] = React.useState(true);

  // ── Milestones State ──
  const [milestones, setMilestones] = React.useState<any[]>([]);
  const [milestonesLoading, setMilestonesLoading] = React.useState(true);

  // ── Consultants State ──
  const [consultants, setConsultants] = React.useState<any[]>([]);
  const [consultantsLoading, setConsultantsLoading] = React.useState(true);

  // ── Contracts State ──
  const [wafiContracts, setWafiContracts] = React.useState<any[]>([]);
  const [delays, setDelays] = React.useState<any[]>([]);

  // ── License State ──
  const [license, setLicense] = React.useState<any>(null);

  // ── Etmam State ──
  const [etmamReg, setEtmamReg] = React.useState<any>(null);
  const [syncHistory, setSyncHistory] = React.useState<any[]>([]);
  const [nextSync, setNextSync] = React.useState<any>(null);

  // ── Load data ──
  React.useEffect(() => {
    loadEscrow();
    loadMilestones();
    loadConsultants();
    loadContracts();
    loadLicense();
    loadEtmam();
  }, [projectId]);

  async function loadEscrow() {
    setEscrowLoading(true);
    try { setEscrow(await getEscrowAccount(projectId)); } catch {}
    setEscrowLoading(false);
  }
  async function loadMilestones() {
    setMilestonesLoading(true);
    try { setMilestones(await getProjectMilestones(projectId)); } catch {}
    setMilestonesLoading(false);
  }
  async function loadConsultants() {
    setConsultantsLoading(true);
    try { setConsultants(await getProjectConsultants(projectId)); } catch {}
    setConsultantsLoading(false);
  }
  async function loadContracts() {
    try {
      setWafiContracts(await getProjectWafiContracts(projectId));
      setDelays(await getProjectDelayPenalties(projectId));
    } catch {}
  }
  async function loadLicense() {
    try { setLicense(await getWafiLicense(projectId)); } catch {}
  }
  async function loadEtmam() {
    try {
      setEtmamReg(await getEtmamRegistration(projectId));
      setSyncHistory(await getEtmamSyncHistory(projectId));
      setNextSync(await getNextSyncSchedule(projectId));
    } catch {}
  }

  const milestoneStatusColor: Record<string, string> = {
    UPCOMING: "default",
    IN_PROGRESS: "info",
    PENDING_INSPECTION: "warning",
    CERTIFIED: "success",
    OVERDUE: "error",
    SKIPPED: "draft",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <CaretLeft size={16} className="icon-directional" />
            {lang === "ar" ? "عودة للمشروع" : "Back to Project"}
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {lang === "ar" ? "امتثال وافي" : "Wafi Compliance"}
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px min-h-[44px]",
                activeTab === tab.id
                  ? "border-secondary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
              {tab.label[lang]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "escrow" && (
        <div className="space-y-6">
          {escrowLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <KPICard key={i} label="" value="" loading />)}
            </div>
          ) : escrow ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label={lang === "ar" ? "الرصيد الحالي" : "Current Balance"} value={`${Number(escrow.currentBalance).toLocaleString()} ر.س`} accentColor="primary" icon={<Bank size={20} />} />
                <KPICard label={lang === "ar" ? "إجمالي الإيداعات" : "Total Deposits"} value={`${Number(escrow.totalDeposited).toLocaleString()} ر.س`} accentColor="success" icon={<Plus size={20} />} />
                <KPICard label={lang === "ar" ? "إجمالي السحوبات" : "Total Withdrawals"} value={`${Number(escrow.totalWithdrawn).toLocaleString()} ر.س`} accentColor="warning" icon={<ArrowsClockwise size={20} />} />
                <KPICard label={lang === "ar" ? "مبلغ الاحتفاظ (5%)" : "Retention (5%)"} value={`${Number(escrow.retentionAmount).toLocaleString()} ر.س`} accentColor="info" icon={<Clock size={20} />} />
              </div>
              {/* Admin Expense Cap Meter */}
              {escrow.adminExpenseCap && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{lang === "ar" ? "سقف المصروفات الإدارية (20%)" : "Admin Expense Cap (20%)"}</span>
                    <span className="text-xs text-muted-foreground">
                      {Number(escrow.adminExpenseUsed).toLocaleString()} / {Number(escrow.adminExpenseCap).toLocaleString()} {lang === "ar" ? "ر.س" : "SAR"}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-warning h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (Number(escrow.adminExpenseUsed) / Number(escrow.adminExpenseCap)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Recent Transactions */}
              <div className="rounded-lg border border-border bg-card">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{lang === "ar" ? "آخر المعاملات" : "Recent Transactions"}</h3>
                </div>
                <div className="divide-y divide-border">
                  {(escrow.transactions ?? []).length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {lang === "ar" ? "لا توجد معاملات بعد" : "No transactions yet"}
                    </div>
                  ) : (
                    (escrow.transactions ?? []).map((txn: any) => (
                      <div key={txn.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{txn.description || txn.type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString("en-CA")}</p>
                        </div>
                        <div className="text-end">
                          <p className={cn("text-sm font-bold number-ltr", txn.type === "BUYER_DEPOSIT" ? "text-success" : "text-destructive")}>
                            {txn.type === "BUYER_DEPOSIT" ? "+" : "-"}{Number(txn.amount).toLocaleString()} ر.س
                          </p>
                          <Badge variant={txn.status === "PROCESSED" ? "success" : txn.status === "AWAITING_APPROVAL" ? "warning" : "default"} className="text-[9px]">
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Bank size={48} weight="duotone" />}
              title={lang === "ar" ? "لا يوجد حساب ضمان" : "No Escrow Account"}
              description={lang === "ar" ? "قم بإنشاء حساب ضمان لهذا المشروع للامتثال لمتطلبات وافي" : "Create an escrow account for this project to comply with Wafi requirements"}
              action={<Button onClick={() => toast.info(lang === "ar" ? "قريبًا" : "Coming soon")}><Plus size={16} />{lang === "ar" ? "إنشاء حساب ضمان" : "Create Escrow Account"}</Button>}
            />
          )}
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-4">
          {milestonesLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : milestones.length > 0 ? (
            <>
              {/* Progress Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard label={lang === "ar" ? "إجمالي المراحل" : "Total Milestones"} value={milestones.length} accentColor="primary" />
                <KPICard label={lang === "ar" ? "المراحل المعتمدة" : "Certified"} value={milestones.filter(m => m.status === "CERTIFIED").length} accentColor="success" />
                <KPICard
                  label={lang === "ar" ? "نسبة الإنجاز" : "Overall Progress"}
                  value={`${Math.round(milestones.reduce((a, m) => a + (m.actualPercentage ?? 0), 0) / milestones.length)}%`}
                  accentColor="info"
                />
              </div>
              {/* Timeline */}
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold shrink-0",
                      m.status === "CERTIFIED" ? "bg-success/10 text-success" : m.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    )}>
                      {m.milestoneNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{lang === "ar" ? (m.nameArabic || m.name) : m.name}</p>
                        <Badge variant={(milestoneStatusColor[m.status] ?? "default") as any} className="text-[9px]">{m.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{lang === "ar" ? "الهدف" : "Target"}: {m.targetPercentage}%</span>
                        {m.actualPercentage != null && <span>{lang === "ar" ? "الفعلي" : "Actual"}: {m.actualPercentage}%</span>}
                        {m.targetDate && <span>{new Date(m.targetDate).toLocaleDateString("en-CA")}</span>}
                        {m.paymentPercentage != null && <span>{lang === "ar" ? "دفعة" : "Payment"}: {m.paymentPercentage}%</span>}
                      </div>
                    </div>
                    {m.status === "CERTIFIED" && m.certifiedBy && (
                      <div className="text-end shrink-0">
                        <p className="text-[10px] text-success flex items-center gap-1"><CheckCircle size={12} weight="fill" />{lang === "ar" ? "معتمد" : "Certified"}</p>
                        <p className="text-[9px] text-muted-foreground">{m.certifiedBy.name}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<HardHat size={48} weight="duotone" />}
              title={lang === "ar" ? "لا توجد مراحل إنشائية" : "No Construction Milestones"}
              description={lang === "ar" ? "أضف المراحل الإنشائية لتتبع تقدم البناء وربط الفواتير" : "Add construction milestones to track building progress and link billing"}
              action={<Button onClick={() => toast.info(lang === "ar" ? "قريبًا" : "Coming soon")}><Plus size={16} />{lang === "ar" ? "إضافة مرحلة" : "Add Milestone"}</Button>}
            />
          )}
        </div>
      )}

      {activeTab === "consultants" && (
        <div className="space-y-4">
          {consultantsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : consultants.length > 0 ? (
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {consultants.map((a: any) => (
                <div key={a.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{a.consultant?.user?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.consultant?.firmNameArabic || a.consultant?.firmName || ""} • {a.consultant?.licenseNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "ACTIVE" ? "success" : a.status === "REVOKED" ? "error" : "default"} className="text-[9px]">{a.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.assignedAt).toLocaleDateString("en-CA")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<UsersThree size={48} weight="duotone" />}
              title={lang === "ar" ? "لا يوجد استشاريون معيّنون" : "No Consultants Assigned"}
              description={lang === "ar" ? "عيّن استشاريًا هندسيًا مستقلاً لاعتماد مراحل البناء" : "Assign an independent engineering consultant to certify construction milestones"}
              action={<Button onClick={() => toast.info(lang === "ar" ? "قريبًا" : "Coming soon")}><Plus size={16} />{lang === "ar" ? "تعيين استشاري" : "Assign Consultant"}</Button>}
            />
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="space-y-4">
          {wafiContracts.length > 0 ? (
            <>
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {wafiContracts.map((wc: any) => (
                  <div key={wc.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{lang === "ar" ? "عقد" : "Contract"} #{wc.contractId.slice(-8)}</p>
                      <span className="text-xs text-muted-foreground">{lang === "ar" ? "تسليم" : "Handover"}: {new Date(wc.handoverDate).toLocaleDateString("en-CA")}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{lang === "ar" ? "تعويض التأخير" : "Delay Compensation"}: {wc.delayCompensationType === "PERCENTAGE" ? `${wc.delayCompensationRate}%` : lang === "ar" ? "إيجار السوق العادل" : "Fair Market Rent"}</span>
                      {wc.alternativeDeveloperClause && <Badge variant="info" className="text-[9px]">{lang === "ar" ? "بند المطور البديل" : "Alt Developer Clause"}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Delay Penalties */}
              {delays.length > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2"><Warning size={16} />{lang === "ar" ? "غرامات التأخير" : "Delay Penalties"}</h3>
                  <div className="space-y-2">
                    {delays.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span>{d.penaltyType} @ {d.rate}%</span>
                        <span className="font-semibold text-destructive number-ltr">{d.calculatedAmount ? `${Number(d.calculatedAmount).toLocaleString()} ر.س` : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Certificate size={48} weight="duotone" />}
              title={lang === "ar" ? "لا توجد عقود وافي" : "No Wafi Contracts"}
              description={lang === "ar" ? "أضف عقود وافي للمشترين لتتبع جداول الدفع والتعويضات" : "Add Wafi contracts for buyers to track payment schedules and compensations"}
              action={<Button onClick={() => toast.info(lang === "ar" ? "قريبًا" : "Coming soon")}><Plus size={16} />{lang === "ar" ? "إضافة عقد" : "Add Contract"}</Button>}
            />
          )}
        </div>
      )}

      {activeTab === "license" && (
        <div className="space-y-4">
          {license ? (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{lang === "ar" ? "الحالة" : "Status"}</p>
                  <Badge variant={license.status === "APPROVED" ? "success" : license.status === "REJECTED" ? "error" : "warning"} className="mt-1">{license.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{lang === "ar" ? "رقم الترخيص" : "License #"}</p>
                  <p className="text-sm font-semibold mt-1">{license.licenseNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{lang === "ar" ? "تقييم المطور" : "Developer Score"}</p>
                  <p className="text-sm font-semibold mt-1">{license.developerScore ?? "—"}/100</p>
                  {license.developerScore != null && (
                    <p className={cn("text-[10px]", license.developerScore >= 35 ? "text-success" : "text-destructive")}>
                      {license.developerScore >= 35 ? (lang === "ar" ? "مؤهل" : "Qualified") : (lang === "ar" ? "غير مؤهل (الحد الأدنى 35)" : "Not Qualified (min 35)")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{lang === "ar" ? "رسوم التسجيل" : "Registration Fee"}</p>
                  <p className="text-sm font-semibold mt-1 number-ltr">{license.registrationFee ? `${Number(license.registrationFee).toLocaleString()} ر.س` : "50,000 ر.س"}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Certificate size={48} weight="duotone" />}
              title={lang === "ar" ? "لا يوجد ترخيص وافي" : "No Wafi License"}
              description={lang === "ar" ? "تقدم بطلب ترخيص وافي من الهيئة العامة للعقار (REGA)" : "Apply for a Wafi license from the Real Estate General Authority (REGA)"}
              action={
                <Button onClick={async () => {
                  try {
                    await createWafiLicense({ projectId });
                    toast.success(lang === "ar" ? "تم إنشاء طلب الترخيص" : "License application created");
                    loadLicense();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}>
                  <Plus size={16} />{lang === "ar" ? "تقديم طلب ترخيص" : "Apply for License"}
                </Button>
              }
            />
          )}
        </div>
      )}

      {activeTab === "etmam" && (
        <div className="space-y-4">
          {etmamReg ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                  label={lang === "ar" ? "حالة التسجيل" : "Registration Status"}
                  value={etmamReg.registrationStatus}
                  accentColor={etmamReg.registrationStatus === "REGISTERED" ? "success" : "warning"}
                />
                <KPICard
                  label={lang === "ar" ? "آخر مزامنة" : "Last Sync"}
                  value={etmamReg.lastSyncAt ? new Date(etmamReg.lastSyncAt).toLocaleDateString("en-CA") : "—"}
                  accentColor="info"
                />
                <KPICard
                  label={lang === "ar" ? "المزامنة القادمة" : "Next Sync Due"}
                  value={nextSync?.nextSyncDue ? new Date(nextSync.nextSyncDue).toLocaleDateString("en-CA") : "—"}
                  accentColor={nextSync?.isOverdue ? "destructive" : "primary"}
                />
              </div>
              {/* Manual Sync Trigger */}
              <div className="flex gap-2 flex-wrap">
                {["QUARTERLY_ESCROW_STATEMENT", "CONSTRUCTION_PROGRESS", "UNIT_SALES_UPDATE"].map(syncType => (
                  <Button key={syncType} variant="secondary" size="sm" onClick={async () => {
                    try {
                      await triggerEtmamSync(projectId, syncType);
                      toast.success(lang === "ar" ? "تمت المزامنة بنجاح" : "Sync completed");
                      loadEtmam();
                    } catch (e: any) { toast.error(e.message); }
                  }}>
                    <ArrowsClockwise size={14} />
                    {syncType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                  </Button>
                ))}
              </div>
              {/* Sync History */}
              <div className="rounded-lg border border-border bg-card">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm">{lang === "ar" ? "سجل المزامنة" : "Sync History"}</h3>
                </div>
                <div className="divide-y divide-border">
                  {syncHistory.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا يوجد سجل مزامنة" : "No sync history"}</div>
                  ) : (
                    syncHistory.map((log: any) => (
                      <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.syncType.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("en-CA")}</p>
                        </div>
                        <Badge variant={log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "error" : "warning"} className="text-[9px]">{log.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<CloudArrowUp size={48} weight="duotone" />}
              title={lang === "ar" ? "غير مسجل في إتمام" : "Not Registered with Etmam"}
              description={lang === "ar" ? "سجل في منصة إتمام (وزارة الشؤون البلدية) للإبلاغ الربع سنوي" : "Register with the Etmam platform (MOMAH) for quarterly reporting"}
              action={
                <Button onClick={async () => {
                  try {
                    await registerWithEtmam(projectId);
                    toast.success(lang === "ar" ? "تم التسجيل بنجاح" : "Registration submitted");
                    loadEtmam();
                  } catch (e: any) { toast.error(e.message); }
                }}>
                  <CloudArrowUp size={16} />{lang === "ar" ? "التسجيل في إتمام" : "Register with Etmam"}
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
