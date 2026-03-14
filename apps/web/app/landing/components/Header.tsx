"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { t as translations } from "../translations";

export default function Header({ lang }: { lang: "ar" | "en" }) {
  const t = translations[lang];
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t.features, href: "#features" },
    { label: t.pricing, href: "#pricing" },
    { label: t.vision2030, href: "#vision2030" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-heavy shadow-lg border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/brand/Mimaric_Official_Logo_transparent.png"
              alt="Mimaric"
              className="h-16 w-auto brightness-0 invert sm:h-20"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-green-bright"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/30"
              style={{ display: "inline-flex" }}
            >
              {t.login}
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-bright hover:-translate-y-0.5"
              style={{ display: "inline-flex" }}
            >
              {t.startFreeTrial}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex rounded-lg p-2 text-white md:hidden"
          >
            {mobileOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 glass-heavy md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Link
                href="/auth/login"
                className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm font-medium text-white"
                style={{ display: "inline-flex", justifyContent: "center" }}
              >
                {t.login}
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-secondary px-4 py-2 text-center text-sm font-medium text-white"
                style={{ display: "inline-flex", justifyContent: "center" }}
              >
                {t.startFreeTrial}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
