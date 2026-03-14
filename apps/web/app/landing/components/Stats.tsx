"use client";

import { Star } from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function Stats({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const stats = [
    { value: t.statVat, label: t.statVatLabel },
    { value: t.statCompliance, label: t.statComplianceLabel },
    { value: t.statTrial, label: t.statTrialLabel },
    { value: t.statPlans, label: t.statPlansLabel },
  ];

  const testimonials = [
    {
      quote: t.testimonial1,
      author: t.testimonial1Author,
      role: t.testimonial1Role,
    },
    {
      quote: t.testimonial2,
      author: t.testimonial2Author,
      role: t.testimonial2Role,
    },
    {
      quote: t.testimonial3,
      author: t.testimonial3Author,
      role: t.testimonial3Role,
    },
  ];

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <span className="text-sm font-medium text-secondary">
              {t.statsTitle}
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold text-primary dark:text-white sm:text-4xl">
          {t.statsTitle}
        </h2>

        {/* Stats grid */}
        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/50 bg-card/80 p-6 text-center shadow-elevation-1 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevation-2 dark:bg-card/50"
            >
              <p className="font-dm-sans text-4xl font-bold text-primary dark:text-white sm:text-5xl">
                {value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {testimonials.map(({ quote, author, role }) => (
            <div
              key={author}
              className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-elevation-1 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevation-2 dark:bg-card/50"
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    weight="fill"
                    className="text-accent"
                  />
                ))}
              </div>
              <p className="mt-4 leading-relaxed text-foreground/80">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-semibold text-primary dark:text-white">
                  {author}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
