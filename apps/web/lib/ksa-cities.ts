/**
 * KSA cities with bilingual labels and region grouping.
 * Sourced from Saudi Post / National Address standards.
 */
export interface KsaCity {
  value: string;
  labelAr: string;
  labelEn: string;
  region: string;
}

export const KSA_CITIES: KsaCity[] = [
  // Riyadh Region
  { value: "riyadh", labelAr: "الرياض", labelEn: "Riyadh", region: "riyadh" },
  { value: "kharj", labelAr: "الخرج", labelEn: "Al Kharj", region: "riyadh" },
  { value: "dawadmi", labelAr: "الدوادمي", labelEn: "Dawadmi", region: "riyadh" },
  { value: "majmaah", labelAr: "المجمعة", labelEn: "Al Majma'ah", region: "riyadh" },
  { value: "aflaj", labelAr: "الأفلاج", labelEn: "Al Aflaj", region: "riyadh" },
  { value: "zulfi", labelAr: "الزلفي", labelEn: "Zulfi", region: "riyadh" },
  { value: "muzahmiyya", labelAr: "المزاحمية", labelEn: "Al Muzahimiyah", region: "riyadh" },
  { value: "diriyah", labelAr: "الدرعية", labelEn: "Diriyah", region: "riyadh" },
  // Makkah Region
  { value: "jeddah", labelAr: "جدة", labelEn: "Jeddah", region: "makkah" },
  { value: "makkah", labelAr: "مكة المكرمة", labelEn: "Makkah", region: "makkah" },
  { value: "taif", labelAr: "الطائف", labelEn: "Taif", region: "makkah" },
  { value: "rabigh", labelAr: "رابغ", labelEn: "Rabigh", region: "makkah" },
  { value: "qunfudhah", labelAr: "القنفذة", labelEn: "Al Qunfudhah", region: "makkah" },
  // Madinah Region
  { value: "madinah", labelAr: "المدينة المنورة", labelEn: "Madinah", region: "madinah" },
  { value: "yanbu", labelAr: "ينبع", labelEn: "Yanbu", region: "madinah" },
  { value: "ula", labelAr: "العلا", labelEn: "Al Ula", region: "madinah" },
  // Eastern Province
  { value: "dammam", labelAr: "الدمام", labelEn: "Dammam", region: "eastern" },
  { value: "khobar", labelAr: "الخبر", labelEn: "Al Khobar", region: "eastern" },
  { value: "dhahran", labelAr: "الظهران", labelEn: "Dhahran", region: "eastern" },
  { value: "jubail", labelAr: "الجبيل", labelEn: "Jubail", region: "eastern" },
  { value: "ahsa", labelAr: "الأحساء", labelEn: "Al Ahsa", region: "eastern" },
  { value: "qatif", labelAr: "القطيف", labelEn: "Qatif", region: "eastern" },
  { value: "hafr_batin", labelAr: "حفر الباطن", labelEn: "Hafar Al Batin", region: "eastern" },
  { value: "khafji", labelAr: "الخفجي", labelEn: "Khafji", region: "eastern" },
  { value: "ras_tanura", labelAr: "رأس تنورة", labelEn: "Ras Tanura", region: "eastern" },
  // Qassim Region
  { value: "buraydah", labelAr: "بريدة", labelEn: "Buraydah", region: "qassim" },
  { value: "unayzah", labelAr: "عنيزة", labelEn: "Unayzah", region: "qassim" },
  { value: "rass", labelAr: "الرس", labelEn: "Ar Rass", region: "qassim" },
  // Asir Region
  { value: "abha", labelAr: "أبها", labelEn: "Abha", region: "asir" },
  { value: "khamis_mushait", labelAr: "خميس مشيط", labelEn: "Khamis Mushait", region: "asir" },
  { value: "bisha", labelAr: "بيشة", labelEn: "Bisha", region: "asir" },
  // Tabuk Region
  { value: "tabuk", labelAr: "تبوك", labelEn: "Tabuk", region: "tabuk" },
  { value: "neom", labelAr: "نيوم", labelEn: "NEOM", region: "tabuk" },
  { value: "wajh", labelAr: "الوجه", labelEn: "Al Wajh", region: "tabuk" },
  // Hail Region
  { value: "hail", labelAr: "حائل", labelEn: "Hail", region: "hail" },
  // Northern Borders
  { value: "arar", labelAr: "عرعر", labelEn: "Arar", region: "northern" },
  { value: "rafha", labelAr: "رفحاء", labelEn: "Rafha", region: "northern" },
  // Jazan Region
  { value: "jazan", labelAr: "جازان", labelEn: "Jazan", region: "jazan" },
  { value: "sabya", labelAr: "صبيا", labelEn: "Sabya", region: "jazan" },
  // Najran Region
  { value: "najran", labelAr: "نجران", labelEn: "Najran", region: "najran" },
  // Baha Region
  { value: "baha", labelAr: "الباحة", labelEn: "Al Baha", region: "baha" },
  // Jouf Region
  { value: "sakaka", labelAr: "سكاكا", labelEn: "Sakaka", region: "jouf" },
  { value: "dumat_jandal", labelAr: "دومة الجندل", labelEn: "Dumat Al Jandal", region: "jouf" },
];
