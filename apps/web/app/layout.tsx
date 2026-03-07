import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { IBM_Plex_Sans_Arabic, DM_Sans } from 'next/font/google';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: "Mimaric | Property Management",
  description: "Saudi PropTech platform for real estate developers — manage projects, sales, and rentals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} ${dmSans.variable}`}>
      <body className="font-ibm-plex-arabic antialiased text-body">
        {children}
      </body>
    </html>
  );
}
