"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Spinner, Buildings, House, TreeStructure, CaretDown, CaretRight } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import { useLanguage } from "../../../../../components/LanguageProvider";
import { getProjectTree } from "../../../../actions/projects";

const LABELS = {
  ar: {
    title: "هيكل المشروع",
    back: "عودة",
    phase: "المرحلة",
    building: "المبنى",
    unit: "الوحدة",
    units: "وحدات",
    noPhase: "بدون مرحلة",
    floor: "الطابق",
    area: "المساحة",
    sqm: "م²",
    statuses: {
      AVAILABLE: "متاح",
      RESERVED: "محجوز",
      SOLD: "مباع",
      RENTED: "مؤجر",
      MAINTENANCE: "صيانة",
      SUSPENDED: "معلق",
      WITHDRAWN: "منسحب",
      HANDED_OVER: "مسلّم",
    },
  },
  en: {
    title: "Project Tree",
    back: "Back",
    phase: "Phase",
    building: "Building",
    unit: "Unit",
    units: "units",
    noPhase: "Unassigned",
    floor: "Floor",
    area: "Area",
    sqm: "sqm",
    statuses: {
      AVAILABLE: "Available",
      RESERVED: "Reserved",
      SOLD: "Sold",
      RENTED: "Rented",
      MAINTENANCE: "Maintenance",
      SUSPENDED: "Suspended",
      WITHDRAWN: "Withdrawn",
      HANDED_OVER: "Handed Over",
    },
  },
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  SOLD: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  RENTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  MAINTENANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  WITHDRAWN: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  HANDED_OVER: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

function CollapsibleNode({
  label,
  icon,
  badge,
  children,
  defaultOpen = false,
}: {
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
      >
        {hasChildren ? (
          open ? <CaretDown size={14} /> : <CaretRight size={14} />
        ) : (
          <span className="w-[14px]" />
        )}
        {icon}
        <span className="font-medium">{label}</span>
        {badge}
      </button>
      {open && hasChildren && (
        <div className="ml-6 border-l border-border pl-2">{children}</div>
      )}
    </div>
  );
}

export default function TreePage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [tree, setTree] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getProjectTree(projectId)
      .then(setTree)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tree) return null;

  const renderBuilding = (building: any) => (
    <CollapsibleNode
      key={building.id}
      label={building.towerName || building.name}
      icon={<Buildings size={16} className="text-blue-600" />}
      badge={
        <Badge variant="outline" className="text-xs ml-auto">
          {building._count?.units ?? building.units?.length ?? 0} {t.units}
        </Badge>
      }
    >
      {building.units?.map((unit: any) => (
        <div key={unit.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
          <House size={14} className="text-muted-foreground" />
          <span>{unit.number}</span>
          <span className="text-muted-foreground text-xs">
            {unit.type} {unit.floor != null && `· ${t.floor} ${unit.floor}`}
            {unit.area && ` · ${unit.area} ${t.sqm}`}
          </span>
          <Badge className={`text-xs ml-auto ${STATUS_COLORS[unit.status] ?? ""}`}>
            {(t.statuses as any)[unit.status] ?? unit.status}
          </Badge>
        </div>
      ))}
    </CollapsibleNode>
  );

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
          <ArrowLeft size={16} />
          {t.back}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{tree.name}</p>
        </div>
      </div>

      {/* Tree */}
      <div className="rounded-lg border bg-card p-4">
        <CollapsibleNode
          label={tree.name}
          icon={<TreeStructure size={18} className="text-primary" />}
          badge={
            tree.projectCode && (
              <code className="text-xs bg-muted px-2 py-0.5 rounded ml-2">{tree.projectCode}</code>
            )
          }
          defaultOpen
        >
          {/* Phases with their buildings */}
          {tree.phases?.map((phase: any) => (
            <CollapsibleNode
              key={phase.id}
              label={phase.phaseCode ? `${phase.name} (${phase.phaseCode})` : phase.name}
              icon={<span className="text-amber-600 font-bold text-xs">PH</span>}
              badge={
                <Badge variant="outline" className="text-xs ml-auto">
                  {phase.buildings?.length ?? 0} {t.building}
                </Badge>
              }
              defaultOpen
            >
              {phase.buildings?.map(renderBuilding)}
            </CollapsibleNode>
          ))}

          {/* Buildings without a phase */}
          {tree.buildings?.length > 0 && (
            <CollapsibleNode
              label={t.noPhase}
              icon={<span className="text-gray-400 font-bold text-xs">--</span>}
              badge={
                <Badge variant="outline" className="text-xs ml-auto">
                  {tree.buildings.length} {t.building}
                </Badge>
              }
              defaultOpen
            >
              {tree.buildings.map(renderBuilding)}
            </CollapsibleNode>
          )}
        </CollapsibleNode>
      </div>
    </div>
  );
}
