"use client";

import { Buildings, House, CurrencyCircleDollar } from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function LogoBar({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const stats = [
    { value: "500+", label: t.projectsManaged, icon: Buildings },
    { value: "10,000+", label: t.unitsTracked, icon: House },
    { value: "50M+", label: t.sarProcessed, icon: CurrencyCircleDollar },
  ];

  const placeholderLogos = [
    "Al-Ofoq Real Estate",
    "Modern Construction",
    "Riyadh Oasis",
    "Gulf Developers",
    "Saudi Homes",
  ];

  return (
    <section id="social-proof" className="border-y border-border bg-muted/30 py-12 dark:bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground">
          {t.trustedBy}
        </p>

        {/* Logo placeholder row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {placeholderLogos.map((name) => (
            <div
              key={name}
              className="flex h-10 items-center rounded-md border border-border/50 bg-card/60 px-5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Icon
                  size={28}
                  weight="duotone"
                  className="text-secondary"
                />
                <span className="font-dm-sans text-3xl font-bold text-primary dark:text-white">
                  {value}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
