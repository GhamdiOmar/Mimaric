"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useLanguage } from "../../../../../components/LanguageProvider";
import { ReadinessBadge } from "../../../../../components/readiness-badge";
import {
  getProjectDetail,
  generateProjectCode,
  assignProjectOwners,
  submitProjectForApproval,
  approveProject,
  rejectProject,
  activateProject,
  computeReadinessFlags,
} from "../../../../actions/projects";

const LABELS = {
  ar: {
    title: "حوكمة المشروع",
    back: "عودة",
    projectCode: "رمز المشروع",
    generateCode: "إنشاء الرمز",
    approvalStatus: "حالة الاعتماد",
    owners: "مالكو المشروع",
    internalOwner: "المالك الداخلي",
    financeOwner: "مالك الشؤون المالية",
    readiness: "الجاهزية",
    actions: "الإجراءات",
    submit: "تقديم للاعتماد",
    approve: "اعتماد",
    reject: "رفض",
    activate: "تفعيل",
    rejectionReason: "سبب الرفض",
    approvalNotes: "ملاحظات الاعتماد",
    selectUser: "اختر مستخدم",
    save: "حفظ",
    steps: {
      DRAFT_PROJECT: "مسودة",
      PENDING_APPROVAL: "قيد الاعتماد",
      APPROVED_PROJECT: "معتمد",
      REJECTED_PROJECT: "مرفوض",
      ACTIVATED: "مفعّل",
    },
  },
  en: {
    title: "Project Governance",
    back: "Back",
    projectCode: "Project Code",
    generateCode: "Generate Code",
    approvalStatus: "Approval Status",
    owners: "Project Owners",
    internalOwner: "Internal Owner",
    financeOwner: "Finance Owner",
    readiness: "Readiness",
    actions: "Actions",
    submit: "Submit for Approval",
    approve: "Approve",
    reject: "Reject",
    activate: "Activate",
    rejectionReason: "Rejection Reason",
    approvalNotes: "Approval Notes",
    selectUser: "Select user",
    save: "Save",
    steps: {
      DRAFT_PROJECT: "Draft",
      PENDING_APPROVAL: "Pending",
      APPROVED_PROJECT: "Approved",
      REJECTED_PROJECT: "Rejected",
      ACTIVATED: "Activated",
    },
  },
};

const STEP_ORDER = ["DRAFT_PROJECT", "PENDING_APPROVAL", "APPROVED_PROJECT", "ACTIVATED"];

export default function GovernancePage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<any>(null);
  const [readiness, setReadiness] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [showRejectInput, setShowRejectInput] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [proj, flags] = await Promise.all([
        getProjectDetail(projectId),
        computeReadinessFlags(projectId),
      ]);
      setProject(proj);
      setReadiness(flags);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    try {
      await action();
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const currentStep = STEP_ORDER.indexOf(project.approvalStatus);
  const isRejected = project.approvalStatus === "REJECTED_PROJECT";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          style={{ display: "inline-flex" }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Approval Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>{t.approvalStatus}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {STEP_ORDER.map((step, idx) => {
              const isActive = step === project.approvalStatus;
              const isPast = idx < currentStep;
              const stepLabel = (t.steps as any)[step];

              return (
                <React.Fragment key={step}>
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isPast && <CheckCircle2 className="h-4 w-4" />}
                    {isActive && <Zap className="h-4 w-4" />}
                    {stepLabel}
                  </div>
                  {idx < STEP_ORDER.length - 1 && (
                    <div className={`h-px flex-1 ${isPast ? "bg-green-400" : "bg-border"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {isRejected && (
            <Badge className="mt-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {(t.steps as any).REJECTED_PROJECT}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Project Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t.projectCode}</CardTitle>
        </CardHeader>
        <CardContent>
          {project.projectCode ? (
            <div className="flex items-center gap-3">
              <code className="rounded bg-muted px-3 py-1.5 text-lg font-mono font-bold">
                {project.projectCode}
              </code>
              <BadgeCheck className="h-5 w-5 text-green-600" />
            </div>
          ) : (
            <Button
              onClick={() => handleAction(() => generateProjectCode(projectId))}
              disabled={actionLoading}
              style={{ display: "inline-flex" }}
            >
              {t.generateCode}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Readiness */}
      {readiness && (
        <Card>
          <CardHeader>
            <CardTitle>{t.readiness}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadinessBadge readiness={readiness} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.actions}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {project.approvalStatus === "DRAFT_PROJECT" && project.projectCode && (
            <Button
              onClick={() => handleAction(() => submitProjectForApproval(projectId))}
              disabled={actionLoading}
              style={{ display: "inline-flex" }}
            >
              <Send className="h-4 w-4 mr-2" />
              {t.submit}
            </Button>
          )}

          {project.approvalStatus === "PENDING_APPROVAL" && (
            <>
              <Button
                onClick={() => handleAction(() => approveProject(projectId))}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
                style={{ display: "inline-flex" }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t.approve}
              </Button>

              {!showRejectInput ? (
                <Button
                  variant="danger"
                  onClick={() => setShowRejectInput(true)}
                  disabled={actionLoading}
                  style={{ display: "inline-flex" }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t.reject}
                </Button>
              ) : (
                <div className="flex gap-2 items-end w-full">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">{t.rejectionReason}</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t.rejectionReason}
                    />
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(() => rejectProject(projectId, rejectReason))}
                    disabled={actionLoading || !rejectReason.trim()}
                    style={{ display: "inline-flex" }}
                  >
                    {t.reject}
                  </Button>
                </div>
              )}
            </>
          )}

          {project.approvalStatus === "APPROVED_PROJECT" && (
            <Button
              onClick={() => handleAction(() => activateProject(projectId))}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
              style={{ display: "inline-flex" }}
            >
              <Zap className="h-4 w-4 mr-2" />
              {t.activate}
            </Button>
          )}

          {project.approvalStatus === "REJECTED_PROJECT" && (
            <Button
              onClick={() => handleAction(() => submitProjectForApproval(projectId))}
              disabled={actionLoading}
              style={{ display: "inline-flex" }}
            >
              <Send className="h-4 w-4 mr-2" />
              {t.submit}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
