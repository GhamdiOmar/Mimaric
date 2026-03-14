"use client";

import {
  CloudArrowUp,
  ShieldCheck,
  TrendUp,
} from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function Vision2030({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const pillars = [
    {
      icon: CloudArrowUp,
      title: t.digitalTransformation,
      desc: t.digitalTransformationDesc,
    },
    {
      icon: ShieldCheck,
      title: t.regulatoryCompliance,
      desc: t.regulatoryComplianceDesc,
    },
    {
      icon: TrendUp,
      title: t.economicDiversification,
      desc: t.economicDiversificationDesc,
    },
  ];

  return (
    <section
      id="vision2030"
      className="relative overflow-hidden mesh-bg py-20 lg:py-28"
    >
      {/* Floating gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-[100px] animate-mesh-drift" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[80px] animate-mesh-drift" style={{ animationDelay: "-7s" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Vision 2030 badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-bright" />
            <span className="text-sm font-medium text-green-bright">
              {t.vision2030}
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold text-white sm:text-4xl">
          {t.vision2030Title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/60">
          {t.vision2030Subtitle}
        </p>

        {/* Pillars */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group glass rounded-2xl p-8 transition-all duration-300 hover:border-secondary/30 hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 transition-colors group-hover:bg-secondary/20">
                <Icon size={28} weight="duotone" className="text-green-bright" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 leading-relaxed text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
