import type { Metadata } from "next";
import LandingPage from "./landing/LandingPage";

export const metadata: Metadata = {
  title: "Mimaric | Saudi PropTech Platform for Property & Facility Management",
  description:
    "Manage projects, sales, rentals, and maintenance — all in one platform aligned with Saudi regulations. Compliant with Balady, ZATCA, Wafi, and Vision 2030.",
  openGraph: {
    title: "Mimaric | Saudi PropTech Platform",
    description:
      "The Saudi platform for property & facility management. Manage projects, sales, rentals, and maintenance in one place.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
