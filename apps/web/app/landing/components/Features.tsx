"use client";

import { useState } from "react";
import {
  Buildings,
  Storefront,
  House,
  Wrench,
  CurrencyCircleDollar,
  CheckCircle,
} from "@phosphor-icons/react";
import { t as translations } from "../translations";

type FeatureTab = {
  id: string;
  icon: typeof Buildings;
  title: string;
  desc: string;
  features: string[];
};

export default function Features({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];

  const tabs: FeatureTab[] = [
    {
      id: "projects",
      icon: Buildings,
      title: t.projectManagement,
      desc: t.projectManagementDesc,
      features: [
        t.projectFeature1,
        t.projectFeature2,
        t.projectFeature3,
        t.projectFeature4,
      ],
    },
    {
      id: "sales",
      icon: Storefront,
      title: t.salesOffplan,
      desc: t.salesOffplanDesc,
      features: [
        t.salesFeature1,
        t.salesFeature2,
        t.salesFeature3,
        t.salesFeature4,
      ],
    },
    {
      id: "rentals",
      icon: House,
      title: t.rentalManagement,
      desc: t.rentalManagementDesc,
      features: [
        t.rentalFeature1,
        t.rentalFeature2,
        t.rentalFeature3,
        t.rentalFeature4,
      ],
    },
    {
      id: "maintenance",
      icon: Wrench,
      title: t.maintenance,
      desc: t.maintenanceDesc,
      features: [
        t.maintenanceFeature1,
        t.maintenanceFeature2,
        t.maintenanceFeature3,
        t.maintenanceFeature4,
      ],
    },
    {
      id: "finance",
      icon: CurrencyCircleDollar,
      title: t.financeBilling,
      desc: t.financeBillingDesc,
      features: [
        t.financeFeature1,
        t.financeFeature2,
        t.financeFeature3,
        t.financeFeature4,
      ],
    },
  ];

  const [active, setActive] = useState(0);
  const activeTab = tabs[active]!;
  const ActiveIcon = activeTab.icon;

  return (
    <section id="features" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary dark:text-white sm:text-4xl">
            {t.featuresTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.featuresSubtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-12 flex flex-wrap justify-center gap-2 sm:gap-3">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all sm:px-5 ${
                  active === i
                    ? "bg-primary text-primary-foreground shadow-md dark:bg-secondary dark:text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:shadow-sm"
                }`}
                style={{ display: "inline-flex" }}
              >
                <Icon size={18} weight={active === i ? "fill" : "regular"} />
                <span className="hidden sm:inline">{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          {/* Text side */}
          <div className={lang === "ar" ? "lg:order-2" : "lg:order-1"}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <ActiveIcon
                  size={24}
                  weight="duotone"
                  className="text-secondary"
                />
              </div>
              <h3 className="text-2xl font-bold text-primary dark:text-white">
                {activeTab.title}
              </h3>
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {activeTab.desc}
            </p>
            <ul className="mt-6 space-y-3">
              {activeTab.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-secondary"
                  />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Screenshot side */}
          <div className={lang === "ar" ? "lg:order-1" : "lg:order-2"}>
            <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-muted shadow-elevation-2 dark:from-card dark:to-card/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/screenshots/${activeTab.id}.png`}
                alt={activeTab.title}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
