import type { Metadata } from "next";

import FoundersCards from "@/components/sections/why-wqf/FoundersCards";
import FoundersEthos from "@/components/sections/why-wqf/FoundersEthos";
import FoundersInfrastructure from "@/components/sections/why-wqf/FoundersInfrastructure";
import FoundersIntro from "@/components/sections/why-wqf/FoundersIntro";
import InvestorsCards from "@/components/sections/why-wqf/InvestorsCards";
import InvestorsIntro from "@/components/sections/why-wqf/InvestorsIntro";
import PartnerBlocks from "@/components/sections/why-wqf/PartnerBlocks";
import PartnersIntro from "@/components/sections/why-wqf/PartnersIntro";
import WhyHero from "@/components/sections/why-wqf/WhyHero";

const TITLE = "About Our Approach and Infrastructure | Atlas Intelligence";
const DESCRIPTION =
  "Capital. Mentorship. Full-stack support. At Atlas Intelligence, we create the infrastructure for scale. Discover more about our approach to…";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/why-wqf" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/why-wqf",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/transforms/cover-thumb.png",
        width: 1200,
        height: 630,
        alt: "Atlas Intelligence logo",
      },
    ],
  },
};

export default function WhyWqfPage() {
  return (
    <>
      <WhyHero />
      <FoundersIntro />
      <FoundersCards />
      <FoundersInfrastructure />
      <FoundersEthos />
      <InvestorsIntro />
      <InvestorsCards />
      <PartnersIntro />
      <PartnerBlocks />
      {/* Trailing spacer before the site footer, as in the original markup. */}
      <div className="pb-[48px] md:pb-[200px]" />
    </>
  );
}
