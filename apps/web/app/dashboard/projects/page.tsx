"use client";

import * as React from "react";
import { Buildings, Plus, MapPin, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

const mockProjects = [
  { id: "1", name: "مجمع الأرجوان السكني", nameEn: "Al Arjuan Residential", location: "الرياض، حي الملقا", units: 48, status: "active", progress: 72 },
  { id: "2", name: "برج الأفق التجاري", nameEn: "Horizon Commercial Tower", location: "جدة، الكورنيش", units: 120, status: "active", progress: 45 },
  { id: "3", name: "فلل الواحة", nameEn: "Al Waha Villas", location: "الرياض، حي النرجس", units: 24, status: "planning", progress: 10 },
];

export default function ProjectsPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-md shadow-card border border-border p-6 hover:shadow-raised hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <Buildings size={28} weight="duotone" />
              </div>
              <Badge variant={project.status === "active" ? "available" : "draft"} className="text-[10px]">
                {project.status === "active" ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "تخطيط" : "Planning")}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-primary font-primary">{lang === "ar" ? project.name : project.nameEn}</h3>
            <div className="flex items-center gap-2 text-xs text-neutral mt-1">
              <MapPin size={14} />
              <span className="font-primary">{project.location}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-neutral font-primary">{lang === "ar" ? "التقدم" : "Progress"}</span>
                <span className="font-bold text-primary font-latin">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
              </div>
              <p className="text-[10px] text-neutral mt-3 font-latin">{project.units} {lang === "ar" ? "وحدة" : "units"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
