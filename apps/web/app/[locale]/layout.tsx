import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale !== "en";

  return {
    title: isAr
      ? "ميماريك | منصة إدارة العقارات السعودية"
      : "Mimaric | Saudi PropTech Platform for Property Management",
    description: isAr
      ? "منصة PropTech السعودية لمطوري العقارات — إدارة المشاريع والمبيعات والإيجارات متوافقة مع بلدي وزاتكا ووافي ورؤية 2030."
      : "The Saudi PropTech platform for real estate developers — manage projects, sales, and rentals compliant with Balady, ZATCA, Wafi, and Vision 2030.",
    alternates: {
      canonical: `https://mimaric.app/${locale}`,
      languages: {
        "ar-SA": "https://mimaric.app/ar",
        en: "https://mimaric.app/en",
        "x-default": "https://mimaric.app/ar",
      },
    },
    openGraph: {
      title: isAr
        ? "ميماريك | منصة إدارة العقارات السعودية"
        : "Mimaric | Saudi PropTech Platform",
      description: isAr
        ? "منصة PropTech السعودية — إدارة المشاريع والمبيعات والإيجارات في مكان واحد."
        : "The Saudi PropTech platform — manage projects, sales, and rentals in one place.",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? ["en_US"] : ["ar_SA"],
      type: "website",
      url: `https://mimaric.app/${locale}`,
    },
  };
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
