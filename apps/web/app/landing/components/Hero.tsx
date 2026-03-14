"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Buildings,
  Receipt,
  HardHat,
  CaretDown,
} from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function Hero({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const badges = [
    { icon: ShieldCheck, label: t.vision2030Aligned },
    { icon: Buildings, label: t.baladyCompliant },
    { icon: Receipt, label: t.zatcaInvoicing },
    { icon: HardHat, label: t.wafiReady },
  ];

  return (
    <section className="relative overflow-hidden mesh-bg">
      {/* Background pattern — architectural grid */}
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="arch-hero"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 0L40 40L80 0M0 80L40 40L80 80"
                stroke="hsl(148 76% 40%)"
                strokeWidth="0.5"
                fill="none"
              />
              <circle cx="40" cy="40" r="1.5" fill="hsl(148 76% 40%)" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arch-hero)" />
        </svg>
      </div>

      {/* Floating gradient mesh blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-[120px] animate-mesh-drift" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-accent/5 blur-[100px] animate-mesh-drift" style={{ animationDelay: "-10s" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-dm-sans text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            {t.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="rounded-xl bg-secondary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-secondary/30 transition-all hover:bg-green-bright hover:shadow-xl hover:shadow-green-bright/30 hover:-translate-y-0.5"
              style={{ display: "inline-flex" }}
            >
              {t.startFreeTrial}
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30"
              style={{ display: "inline-flex" }}
            >
              {t.watchDemo}
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {badges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass flex items-center gap-2 rounded-full px-4 py-2"
              >
                <Icon size={18} weight="fill" className="text-green-bright" />
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Dashboard preview */}
          <div className="relative mt-16">
            <div className="overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/40 ring-1 ring-secondary/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/screenshots/dashboard.png"
                alt="Mimaric Dashboard"
                className="h-auto w-full"
              />
            </div>

            {/* Floating glass stat cards */}
            <div className="glass absolute -top-4 -end-4 hidden rounded-lg px-4 py-3 animate-float lg:block" style={{ animationDelay: "-2s" }}>
              <p className="text-xs font-medium text-white/60">{lang === "ar" ? "نسبة الإشغال" : "Occupancy"}</p>
              <p className="font-dm-sans text-lg font-bold text-green-bright">+15%</p>
            </div>
            <div className="glass absolute -bottom-4 -start-4 hidden rounded-lg px-4 py-3 animate-float lg:block" style={{ animationDelay: "-5s" }}>
              <p className="text-xs font-medium text-white/60">{lang === "ar" ? "الإيرادات" : "Revenue"}</p>
              <p className="font-dm-sans text-lg font-bold text-accent">2.4M SAR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <a href="#social-proof" className="animate-bounce text-white/40">
          <CaretDown size={28} />
        </a>
      </div>
    </section>
  );
}
