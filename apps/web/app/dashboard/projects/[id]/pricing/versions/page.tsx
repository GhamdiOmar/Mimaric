"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  BadgeCheck,
} from "lucide-react";
import { Button, Badge } from "@repo/ui";
import { useLanguage } from "../../../../../../components/LanguageProvider";
import {
  getPriceListVersions,
  createPriceListVersion,
  approvePriceListVersion,
} from "../../../../../actions/price-approvals";

const LABELS = {
  ar: {
    title: "إصدارات قائمة الأسعار",
    back: "عودة",
    create: "إنشاء إصدار جديد",
    approve: "اعتماد",
    version: "الإصدار",
    date: "تاريخ السريان",
    status: "الحالة",
    items: "عدد العناصر",
    noVersions: "لا توجد إصدارات",
    statuses: {
      DRAFT_PRICE_LIST: "مسودة",
      PENDING_PRICE_APPROVAL: "قيد الاعتماد",
      APPROVED_PRICE_LIST: "معتمد",
      SUPERSEDED: "مُستبدل",
    },
  },
  en: {
    title: "Price List Versions",
    back: "Back",
    create: "Create New Version",
    approve: "Approve",
    version: "Version",
    date: "Effective Date",
    status: "Status",
    items: "Items",
    noVersions: "No versions created",
    statuses: {
      DRAFT_PRICE_LIST: "Draft",
      PENDING_PRICE_APPROVAL: "Pending",
      APPROVED_PRICE_LIST: "Approved",
      SUPERSEDED: "Superseded",
    },
  },
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT_PRICE_LIST: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  PENDING_PRICE_APPROVAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED_PRICE_LIST: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  SUPERSEDED: "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400",
};

export default function PriceListVersionsPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [versions, setVersions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPriceListVersions(projectId);
      setVersions(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createPriceListVersion(projectId);
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (versionId: string) => {
    try {
      await approvePriceListVersion(versionId);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)} style={{ display: "inline-flex" }}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Button>
          <h1 className="text-2xl font-bold">{t.title}</h1>
        </div>
        <Button onClick={handleCreate} disabled={creating} style={{ display: "inline-flex" }}>
          <Plus className="h-4 w-4 mr-2" /> {t.create}
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="text-muted-foreground">{t.noVersions}</p>
      ) : (
        <div className="space-y-3">
          {versions.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold font-mono">v{v.versionNumber}</div>
                <div>
                  <p className="text-sm font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.effectiveDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[v.status] ?? ""}>
                  {(t.statuses as any)[v.status] ?? v.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Array.isArray(v.snapshot) ? v.snapshot.length : 0} {t.items}
                </span>
              </div>
              <div>
                {(v.status === "DRAFT_PRICE_LIST" || v.status === "PENDING_PRICE_APPROVAL") && (
                  <Button size="sm" onClick={() => handleApprove(v.id)} style={{ display: "inline-flex" }}>
                    <BadgeCheck className="h-4 w-4 mr-1" /> {t.approve}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
