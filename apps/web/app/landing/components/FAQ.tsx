"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function FAQ({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
    { q: t.faq7Q, a: t.faq7A },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-primary dark:text-white sm:text-4xl">
          {t.faqTitle}
        </h2>

        <div className="mt-12 divide-y divide-border">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="py-5 transition-colors rounded-lg hover:bg-muted/30">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-2 text-start"
                style={{ display: "flex" }}
              >
                <span className="text-base font-semibold text-primary dark:text-white">
                  {q}
                </span>
                <CaretDown
                  size={20}
                  className={`shrink-0 text-muted-foreground transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <p className="mt-3 px-2 leading-relaxed text-muted-foreground">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
