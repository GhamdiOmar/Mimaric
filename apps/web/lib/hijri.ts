/**
 * Hijri/Gregorian dual-date utilities.
 * Default display is Gregorian with Hijri as secondary.
 */

export function formatHijri(date: Date | string, lang: "ar" | "en" = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    const locale = lang === "ar" ? "ar-SA-u-ca-islamic" : "en-US-u-ca-islamic";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export function formatGregorian(date: Date | string, lang: "ar" | "en" = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export function formatDualDate(date: Date | string, lang: "ar" | "en" = "ar"): string {
  const greg = formatGregorian(date, lang);
  const hijri = formatHijri(date, lang);
  if (!greg) return "";
  if (!hijri) return greg;
  return `${greg} | ${hijri}`;
}
