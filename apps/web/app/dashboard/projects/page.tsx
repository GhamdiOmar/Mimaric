"use client";

import * as React from "react";
import { Buildings, Plus, MapPin } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
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
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  RESIDENTIAL: { ar: "سكني", en: "Residential" },
  COMMERCIAL: { ar: "تجاري", en: "Commercial" },
  MIXED_USE: { ar: "متعدد الاستخدامات", en: "Mixed Use" },
  VILLA_COMPOUND: { ar: "مجمع فلل", en: "Villa Compound" },
};

export default function ProjectsPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getProjects()
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "English" : "العربية"}
          </Button>
          <Link href="/dashboard/projects/new">
            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 px-5 h-10">
              <Plus size={18} weight="bold" />
              <span className="font-bold">{lang === "ar" ? "مشروع جديد" : "New Project"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-md shadow-card border border-border p-6 animate-pulse">
              <div className="h-12 w-12 rounded-md bg-muted mb-4" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-md border border-border">
          <Buildings size={48} className="mx-auto text-neutral/30 mb-4" />
          <h3 className="text-lg font-bold text-primary">{lang === "ar" ? "لا توجد مشاريع بعد" : "No projects yet"}</h3>
          <p className="text-sm text-neutral mt-1">{lang === "ar" ? "ابدأ بإنشاء أول مشروع عقاري." : "Start by creating your first project."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const totalUnits = project.buildings.reduce((sum, b) => sum + b.units.length, 0);
            const soldUnits = project.buildings.reduce((sum, b) => sum + b.units.filter(u => u.status === "SOLD" || u.status === "RENTED").length, 0);
            const progress = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
            const status = statusMap[project.status] ?? { ar: "تخطيط", en: "Planning", variant: "draft" as const };
            const type = typeLabels[project.type] ?? { ar: "سكني", en: "Residential" };

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="bg-white rounded-md shadow-card border border-border p-6 hover:shadow-raised hover:border-primary/20 transition-all group cursor-pointer block">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                    <Buildings size={28} weight="duotone" />
                  </div>
                  <Badge variant={status.variant} className="text-[10px]">
                    {status[lang]}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-primary font-primary">{project.name}</h3>
                <p className="text-xs text-neutral mt-1">{type[lang]} • {project.buildings.length} {lang === "ar" ? "مبنى" : "buildings"}</p>
                {(project.city || project.district) && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral/60">
                    <MapPin size={12} />
                    <span>{[project.district, project.city].filter(Boolean).join("، ")}</span>
                  </div>
                )}
                {project.totalAreaSqm && (
                  <p className="text-[10px] text-neutral/60 mt-0.5">{project.totalAreaSqm.toLocaleString()} {lang === "ar" ? "م²" : "sqm"}</p>
                )}
                {project.description && (
                  <p className="text-xs text-neutral/70 mt-2 line-clamp-2">{project.description}</p>
                )}
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
