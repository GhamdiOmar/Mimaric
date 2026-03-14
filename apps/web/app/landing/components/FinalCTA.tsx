"use client";

import Link from "next/link";
import { t as translations } from "../translations";

export default function FinalCTA({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-green-bright to-secondary py-20 lg:py-24">
      {/* Decorative circles */}
      <div className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
      <div className="absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {t.finalCtaTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          {t.finalCtaSubtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-secondary shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5"
            style={{ display: "inline-flex" }}
          >
            {t.startFreeTrial}
          </Link>
          <Link
            href="#pricing"
            className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
            style={{ display: "inline-flex" }}
          >
            {t.contactSales}
          </Link>
        </div>
      </div>
    </section>
  );
}
