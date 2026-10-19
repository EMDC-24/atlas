import type { Metadata } from "next";

import AboutHero from "@/components/sections/about/AboutHero";
import AboutOutro from "@/components/sections/about/AboutOutro";

const TITLE = "About Atlas Intelligence";
const DESCRIPTION =
  "Atlas Intelligence is a technology company headquartered in Islamabad, spanning government technology programmes, enterprise data platforms, and globally-distributed AI products.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/about",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/transforms/cover-thumb.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/transforms/cover-thumb.png"],
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutOutro />
    </>
  );
}
