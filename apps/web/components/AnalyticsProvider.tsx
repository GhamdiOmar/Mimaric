"use client";

import { useEffect } from "react";

const GTM_PATTERN = /^GTM-[A-Z0-9]+$/;
const GA4_PATTERN = /^G-[A-Z0-9]+$/;

export function AnalyticsProvider({
  gtmContainerId,
  ga4MeasurementId,
}: {
  gtmContainerId?: string | null;
  ga4MeasurementId?: string | null;
}) {
  useEffect(() => {
    if (gtmContainerId && GTM_PATTERN.test(gtmContainerId)) {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`;
      document.head.appendChild(script);
    } else if (ga4MeasurementId && GA4_PATTERN.test(ga4MeasurementId)) {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.gtag = function (...args: unknown[]) { w.dataLayer.push(args); };
      w.gtag("js", new Date());
      w.gtag("config", ga4MeasurementId);

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`;
      document.head.appendChild(script);
    }
  }, [gtmContainerId, ga4MeasurementId]);

  return null;
}
