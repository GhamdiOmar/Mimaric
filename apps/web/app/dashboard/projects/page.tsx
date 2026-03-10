"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { Buildings, Plus, MapPin } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProjects } from "../../actions/projects";

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
  RESIDENTIAL: "bg-secondary/15 text-secondary",
  COMMERCIAL: "bg-primary/15 text-primary",
  MIXED_USE: "bg-accent/15 text-amber-700",
  VILLA_COMPOUND: "bg-info/15 text-info",
};

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "regular" | "offplan">("all");
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

  const offPlanCount = projects.filter((p) => OFF_PLAN_STATUSES.includes(p.status)).length;
  const regularCount = projects.length - offPlanCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "المشاريع العقارية" : "Real Estate Projects"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة ومتابعة جميع المشاريع العقارية في محفظتك." : "Manage and track all real estate projects in your portfolio."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/projects/new">
            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 px-5 h-10">
              <Plus size={18} weight="bold" />
              <span className="font-bold">{lang === "ar" ? "مشروع جديد" : "New Project"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          {([
            { key: "all" as const, ar: "الكل", en: "All", count: projects.length },
            { key: "regular" as const, ar: "مشاريع تقليدية", en: "Regular", count: regularCount },
            { key: "offplan" as const, ar: "بيع على الخارطة", en: "Off-Plan", count: offPlanCount },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === tab.key
                  ? tab.key === "offplan"
                    ? "bg-secondary text-white"
                    : "bg-primary text-white"
                  : "bg-muted/30 text-neutral hover:bg-muted/50"
              }`}
             
            >
              {tab[lang]} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-md shadow-card border border-border p-6 animate-pulse">
              <div className="h-12 w-12 rounded-md bg-muted mb-4" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-md border border-border">
          <Buildings size={48} className="mx-auto text-neutral/30 mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد مشاريع بعد" : "No projects yet"}</h3>
          <p className="text-sm text-neutral mt-1">{lang === "ar" ? "ابدأ بإنشاء أول مشروع عقاري." : "Start by creating your first project."}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-md border border-border">
          <MapPin size={40} className="mx-auto text-neutral/30 mb-3" />
          <h3 className="text-base font-bold text-primary">
            {filter === "offplan"
              ? (lang === "ar" ? "لا توجد مشاريع بيع على الخارطة" : "No off-plan projects")
              : (lang === "ar" ? "لا توجد مشاريع تقليدية" : "No regular projects")}
          </h3>
          <p className="text-sm text-neutral mt-1">
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
      className="bg-card rounded-md shadow-card border border-border p-6 hover:shadow-raised hover:border-primary/20 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
          <Buildings size={28} weight="duotone" />
        </div>
        <Badge variant={status.variant} className="text-[10px] font-bold px-2.5 py-0.5">
          {status[lang]}
        </Badge>
      </div>
      <h3 className="text-lg font-bold text-primary font-primary">{project.name}</h3>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[project.type] ?? "bg-muted text-neutral"}`}>
          {type[lang]}
        </span>
        {isOffPlan && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
            {lang === "ar" ? "على الخارطة" : "Off-Plan"}
          </span>
        )}
        <span className="text-[10px] text-neutral">{project.buildings.length} {lang === "ar" ? "مبنى" : "buildings"}</span>
      </div>
      {(project.city || project.district) ? (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral/60">
          <MapPin size={12} />
          <span>{[project.district, project.city].filter(Boolean).join(", ")}</span>
        </div>
      ) : null}
      {project.totalAreaSqm ? (
        <p className="text-[10px] text-neutral/60 mt-0.5">{project.totalAreaSqm.toLocaleString()} {lang === "ar" ? "م²" : "sqm"}</p>
      ) : null}
      {project.description ? (
        <p className="text-xs text-neutral/70 mt-2 line-clamp-2">{project.description}</p>
      ) : null}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-neutral font-primary">{lang === "ar" ? "نسبة البيع/التأجير" : "Sales/Rental %"}</span>
          <span className="font-bold text-primary font-latin">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-neutral mt-3 font-latin">{totalUnits} {lang === "ar" ? "وحدة" : "units"}</p>
      </div>
    </div>
  );
}
