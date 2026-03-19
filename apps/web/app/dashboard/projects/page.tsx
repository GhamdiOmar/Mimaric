"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { Building2, Plus, MapPin, FolderOpen } from "lucide-react";
import { Button, Badge, PageIntro, FilterBar } from "@repo/ui";
import type { FilterOption } from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProjects } from "../../actions/projects";
import { exportToExcel } from "../../../lib/export";

type Project = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  city: string | null;
  district: string | null;
  totalAreaSqm: number | null;
  deedNumber: string | null;
  parcelNumber: string | null;
  buildings: { id: string; units: { id: string; status: string }[] }[];
};

const statusMap: Record<string, { ar: string; en: string; variant: any }> = {
  PLANNING: { ar: "تخطيط", en: "Planning", variant: "draft" },
  UNDER_CONSTRUCTION: { ar: "قيد الإنشاء", en: "Under Construction", variant: "reserved" },
  READY: { ar: "جاهز", en: "Ready", variant: "available" },
  HANDED_OVER: { ar: "تم التسليم", en: "Handed Over", variant: "sold" },
  // Off-Plan statuses
  CONCEPT_DESIGN: { ar: "تصميم مبدئي", en: "Concept Design", variant: "draft" },
  SUBDIVISION_PLANNING: { ar: "تخطيط التقسيم", en: "Subdivision", variant: "draft" },
  AUTHORITY_SUBMISSION: { ar: "تقديم الجهات", en: "Authority Submission", variant: "reserved" },
  INFRASTRUCTURE_PLANNING: { ar: "تخطيط البنية التحتية", en: "Infrastructure", variant: "reserved" },
  INVENTORY_STRUCTURING: { ar: "هيكلة المخزون", en: "Inventory", variant: "reserved" },
  PRICING_PACKAGING: { ar: "التسعير والتجهيز", en: "Pricing", variant: "reserved" },
  LAUNCH_READINESS: { ar: "جاهزية الإطلاق", en: "Launch Ready", variant: "available" },
  OFF_PLAN_LAUNCHED: { ar: "تم الإطلاق", en: "Launched", variant: "available" },
};

const OFF_PLAN_STATUSES = [
  "LAND_ACQUIRED", "CONCEPT_DESIGN", "SUBDIVISION_PLANNING", "AUTHORITY_SUBMISSION",
  "INFRASTRUCTURE_PLANNING", "INVENTORY_STRUCTURING", "PRICING_PACKAGING",
  "LAUNCH_READINESS", "OFF_PLAN_LAUNCHED",
];

const typeLabels: Record<string, { ar: string; en: string }> = {
  RESIDENTIAL: { ar: "سكني", en: "Residential" },
  COMMERCIAL: { ar: "تجاري", en: "Commercial" },
  MIXED_USE: { ar: "متعدد الاستخدامات", en: "Mixed Use" },
  VILLA_COMPOUND: { ar: "مجمع فلل", en: "Villa Compound" },
};

const typeColors: Record<string, string> = {
  RESIDENTIAL: "bg-primary/15 text-primary",
  COMMERCIAL: "bg-info/15 text-info",
  MIXED_USE: "bg-secondary/15 text-secondary",
  VILLA_COMPOUND: "bg-muted text-muted-foreground",
};

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const router = useRouter();

  React.useEffect(() => {
    getProjects()
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = React.useMemo(() => {
    if (filter === "offplan") return projects.filter((p) => OFF_PLAN_STATUSES.includes(p.status));
    if (filter === "regular") return projects.filter((p) => !OFF_PLAN_STATUSES.includes(p.status));
    return projects;
  }, [projects, filter]);

  const handleExport = async () => {
    const columns = [
      { header: lang === "ar" ? "الاسم" : "Name", key: "name", width: 25 },
      { header: lang === "ar" ? "النوع" : "Type", key: "type", width: 20, render: (val: string) => typeLabels[val]?.[lang] ?? val },
      { header: lang === "ar" ? "الحالة" : "Status", key: "status", width: 20, render: (val: string) => statusMap[val]?.[lang] ?? val },
      { header: lang === "ar" ? "الموقع" : "Location", key: "location", width: 25, render: () => "" },
      { header: lang === "ar" ? "عدد الوحدات" : "Units Count", key: "unitsCount", width: 15, render: () => "" },
      { header: lang === "ar" ? "تاريخ الإنشاء" : "Created Date", key: "createdAt", width: 20 },
    ];
    const data = filteredProjects.map((p) => ({
      ...p,
      location: [p.district, p.city].filter(Boolean).join(", ") || "—",
      unitsCount: p.buildings.reduce((sum, b) => sum + b.units.length, 0),
    }));
    await exportToExcel({
      data,
      columns,
      filename: "Mimaric_Projects",
      lang,
      title: lang === "ar" ? "المشاريع العقارية" : "Real Estate Projects",
    });
  };

  const offPlanCount = projects.filter((p) => OFF_PLAN_STATUSES.includes(p.status)).length;
  const regularCount = projects.length - offPlanCount;

  const filterOptions: FilterOption[] = [
    { label: lang === "ar" ? "الكل" : "All", value: "all", count: projects.length },
    { label: lang === "ar" ? "مشاريع تقليدية" : "Regular", value: "regular", count: regularCount },
    { label: lang === "ar" ? "بيع على الخارطة" : "Off-Plan", value: "offplan", count: offPlanCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageIntro
        title={lang === "ar" ? "المشاريع العقارية" : "Real Estate Projects"}
        description={lang === "ar"
          ? "إدارة ومتابعة جميع المشاريع العقارية ضمن واجهة تشغيلية أكثر فخامة ووضوحاً."
          : "Manage and track all real estate projects in your portfolio with full operational clarity."}
        actions={
          <>
            <Link href="/dashboard/projects/new">
              <Button size="sm" style={{ display: "inline-flex" }}>
                <Plus className="h-4 w-4" /> {lang === "ar" ? "مشروع جديد" : "New Project"}
              </Button>
            </Link>
            <Button variant="outline" size="sm" style={{ display: "inline-flex" }} onClick={handleExport}>
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </>
        }
      />

      {!loading && projects.length > 0 && (
        <FilterBar
          filters={filterOptions}
          activeFilter={filter}
          onFilterChange={(value) => setFilter(value)}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-6 animate-pulse">
              <div className="h-12 w-12 rounded-lg bg-muted mb-4" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground">{lang === "ar" ? "لا توجد مشاريع بعد" : "No projects yet"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? "ابدأ بإنشاء أول مشروع عقاري." : "Start by creating your first project."}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            {filter === "offplan"
              ? (lang === "ar" ? "لا توجد مشاريع بيع على الخارطة" : "No off-plan projects")
              : (lang === "ar" ? "لا توجد مشاريع تقليدية" : "No regular projects")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "offplan"
              ? (lang === "ar" ? "أنشئ مشروعاً جديداً وفعّل خيار 'بيع على الخارطة'" : "Create a new project and enable the 'Off-Plan' option")
              : (lang === "ar" ? "أنشئ مشروعاً تقليدياً جديداً" : "Create a new regular project")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} lang={lang} onClick={() => router.push(`/dashboard/projects/${project.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, lang, onClick }: { project: Project; lang: "ar" | "en"; onClick: () => void }) {
  const totalUnits = project.buildings.reduce((sum, b) => sum + b.units.length, 0);
  const soldUnits = project.buildings.reduce((sum, b) => sum + b.units.filter(u => u.status === "SOLD" || u.status === "RENTED").length, 0);
  const progress = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
  const status = statusMap[project.status] ?? { ar: "تخطيط", en: "Planning", variant: "draft" as const };
  const type = typeLabels[project.type] ?? { ar: "سكني", en: "Residential" };
  const isOffPlan = OFF_PLAN_STATUSES.includes(project.status);

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
          <Building2 className="h-6 w-6" />
        </div>
        <Badge variant={status.variant} className="text-[10px] font-bold px-2.5 py-0.5">
          {status[lang]}
        </Badge>
      </div>
      <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[project.type] ?? "bg-muted text-muted-foreground"}`}>
          {type[lang]}
        </span>
        {isOffPlan && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
            {lang === "ar" ? "على الخارطة" : "Off-Plan"}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{project.buildings.length} {lang === "ar" ? "مبنى" : "buildings"}</span>
      </div>
      {(project.city || project.district) ? (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
          <MapPin className="h-3 w-3" />
          <span>{[project.district, project.city].filter(Boolean).join(", ")}</span>
        </div>
      ) : null}
      {project.totalAreaSqm ? (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{project.totalAreaSqm.toLocaleString()} {lang === "ar" ? "م²" : "sqm"}</p>
      ) : null}
      {project.description ? (
        <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{project.description}</p>
      ) : null}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">{lang === "ar" ? "نسبة البيع/التأجير" : "Sales/Rental %"}</span>
          <span className="font-bold text-foreground tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 tabular-nums">{totalUnits} {lang === "ar" ? "وحدة" : "units"}</p>
      </div>
    </div>
  );
}
