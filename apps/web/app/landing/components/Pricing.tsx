"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Crown,
  Sparkle,
  Buildings,
} from "@phosphor-icons/react";
import { t as translations } from "../translations";

type Plan = {
  slug: string;
  icon: typeof Buildings;
  name: string;
  desc: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: { projects: string; users: string; units: string };
  features: { key: string; label: string; included: boolean }[];
  supportLevel: string;
  highlighted: boolean;
  cta: string;
  ctaHref: string;
};

export default function Pricing({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];
  const [annual, setAnnual] = useState(true);

  const plans: Plan[] = [
    {
      slug: "starter",
      icon: Buildings,
      name: t.starter,
      desc: t.starterDesc,
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { projects: "3", users: "5", units: "50" },
      features: [
        { key: "cmms", label: t.cmmsAccess, included: false },
        { key: "offplan", label: t.offplanAccess, included: false },
        { key: "reports", label: t.reportsExport, included: false },
        { key: "pii", label: t.piiEncryption, included: false },
        { key: "audit", label: t.auditAccess, included: false },
        { key: "api", label: t.apiAccess, included: false },
        { key: "branding", label: t.customBranding, included: false },
      ],
      supportLevel: t.standardSupport,
      highlighted: false,
      cta: t.getStarted,
      ctaHref: "/auth/register",
    },
    {
      slug: "professional",
      icon: Sparkle,
      name: t.professional,
      desc: t.professionalDesc,
      monthlyPrice: 499,
      annualPrice: 4790,
      limits: { projects: "25", users: "25", units: "500" },
      features: [
        { key: "cmms", label: t.cmmsAccess, included: true },
        { key: "offplan", label: t.offplanAccess, included: true },
        { key: "reports", label: t.reportsExport, included: true },
        { key: "pii", label: t.piiEncryption, included: true },
        { key: "audit", label: t.auditAccess, included: true },
        { key: "api", label: t.apiAccess, included: false },
        { key: "branding", label: t.customBranding, included: false },
      ],
      supportLevel: t.businessSupport,
      highlighted: true,
      cta: t.startTrial,
      ctaHref: "/auth/register",
    },
    {
      slug: "enterprise",
      icon: Crown,
      name: t.enterprise,
      desc: t.enterpriseDesc,
      monthlyPrice: 1499,
      annualPrice: 14390,
      limits: {
        projects: t.unlimited,
        users: t.unlimited,
        units: t.unlimited,
      },
      features: [
        { key: "cmms", label: t.cmmsAccess, included: true },
        { key: "offplan", label: t.offplanAccess, included: true },
        { key: "reports", label: t.reportsExport, included: true },
        { key: "pii", label: t.piiEncryption, included: true },
        { key: "audit", label: t.auditAccess, included: true },
        { key: "api", label: t.apiAccess, included: true },
        { key: "branding", label: t.customBranding, included: true },
      ],
      supportLevel: t.premiumSupport,
      highlighted: false,
      cta: t.startTrial,
      ctaHref: "/auth/register",
    },
  ];

  function formatPrice(plan: Plan) {
    const price = annual ? plan.annualPrice : plan.monthlyPrice;
    if (price === 0) return t.free;
    return price.toLocaleString();
  }

  function priceSuffix(plan: Plan) {
    if (plan.monthlyPrice === 0) return "";
    return annual ? t.perYear : t.perMonth;
  }

  return (
    <section id="pricing" className="bg-muted/30 py-20 dark:bg-muted/10 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary dark:text-white sm:text-4xl">
            {t.pricingTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.pricingSubtitle}
          </p>
        </div>

        {/* Toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${!annual ? "text-primary dark:text-white" : "text-muted-foreground"}`}
          >
            {t.monthly}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? "bg-secondary" : "bg-muted-foreground/30"
            }`}
            style={{ display: "inline-flex" }}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                annual
                  ? lang === "ar"
                    ? "-translate-x-5"
                    : "translate-x-5"
                  : lang === "ar"
                    ? "-translate-x-0.5"
                    : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${annual ? "text-primary dark:text-white" : "text-muted-foreground"}`}
          >
            {t.annual}
          </span>
          {annual && (
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
              {t.annualSave}
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.slug}
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-secondary bg-card shadow-xl ring-2 ring-secondary/20 dark:bg-card dark:shadow-glow-green"
                    : "border-border/50 bg-card/80 shadow-elevation-1 backdrop-blur-sm dark:bg-card/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 inset-x-0 bg-secondary py-1 text-center text-xs font-semibold text-white">
                    {t.mostPopular}
                  </div>
                )}

                <div className={plan.highlighted ? "pt-4" : ""}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        plan.highlighted
                          ? "bg-secondary/10"
                          : "bg-muted dark:bg-muted/50"
                      }`}
                    >
                      <Icon
                        size={22}
                        weight="duotone"
                        className={
                          plan.highlighted
                            ? "text-secondary"
                            : "text-primary dark:text-white"
                        }
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary dark:text-white">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.desc}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-dm-sans text-4xl font-bold text-primary dark:text-white">
                      {formatPrice(plan)}
                    </span>
                    {priceSuffix(plan) && (
                      <span className="text-sm text-muted-foreground">
                        {priceSuffix(plan)}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      plan.highlighted
                        ? "bg-secondary text-white hover:bg-green-bright"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-primary dark:hover:bg-gray-100"
                    }`}
                    style={{ display: "inline-flex", justifyContent: "center" }}
                  >
                    {plan.cta}
                  </Link>

                  {/* Limits */}
                  <div className="mt-6 space-y-2 border-t border-border pt-6">
                    <p className="text-sm text-foreground/80">
                      <span className="font-semibold">{plan.limits.projects}</span>{" "}
                      {t.projects}
                    </p>
                    <p className="text-sm text-foreground/80">
                      <span className="font-semibold">{plan.limits.users}</span>{" "}
                      {t.users}
                    </p>
                    <p className="text-sm text-foreground/80">
                      <span className="font-semibold">{plan.limits.units}</span>{" "}
                      {t.units}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mt-4 space-y-2">
                    {plan.features.map(({ key, label, included }) => (
                      <div key={key} className="flex items-center gap-2">
                        {included ? (
                          <CheckCircle
                            size={16}
                            weight="fill"
                            className="shrink-0 text-secondary"
                          />
                        ) : (
                          <XCircle
                            size={16}
                            weight="fill"
                            className="shrink-0 text-muted-foreground/40"
                          />
                        )}
                        <span
                          className={`text-sm ${
                            included
                              ? "text-foreground/80"
                              : "text-muted-foreground/60"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Support level */}
                  <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                    {plan.supportLevel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
