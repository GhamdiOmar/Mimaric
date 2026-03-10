"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

/**
 * Provides consistent Recharts styling tokens that adapt to light/dark mode.
 * All chart components should use these values instead of hardcoded colors.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return useMemo(
    () => ({
      // Axis tick/label text color
      tickFill: isDark ? "hsl(215 16% 66%)" : "hsl(218 17% 35%)",
      // Grid stroke color
      gridStroke: isDark ? "hsl(216 30% 20%)" : "hsl(214 32% 91%)",
      // Axis line stroke
      axisStroke: isDark ? "hsl(216 30% 20%)" : "hsl(214 32% 91%)",
      // Label color (bar labels, value callouts)
      labelFill: isDark ? "hsl(0 0% 90%)" : "hsl(216 45% 17%)",
      // Tooltip styling
      tooltipBg: isDark ? "hsl(216 45% 13%)" : "hsl(0 0% 100%)",
      tooltipBorder: isDark ? "hsl(216 30% 22%)" : "hsl(214 32% 91%)",
      tooltipStyle: {
        borderRadius: 8,
        fontSize: 12,
        direction: "rtl" as const,
        backgroundColor: isDark ? "hsl(216 45% 13%)" : "hsl(0 0% 100%)",
        border: `1px solid ${isDark ? "hsl(216 30% 22%)" : "hsl(214 32% 91%)"}`,
        color: isDark ? "hsl(0 0% 90%)" : "hsl(218 17% 35%)",
      },
      isDark,
    }),
    [isDark]
  );
}
