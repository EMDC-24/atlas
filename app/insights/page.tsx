import type { Metadata } from "next";

import InsightsHero from "@/components/sections/insights/InsightsHero";
import LatestNews from "@/components/sections/insights/LatestNews";
import { insightMetadata } from "@/lib/content/insights";

export const metadata: Metadata = insightMetadata("Insights", "/insights");

export default function InsightsPage() {
  return (
    <>
      <InsightsHero />
      <LatestNews />
      {/* Trailing spacer from the source markup, before the footer. */}
      <div className="h-[100px]" />
    </>
  );
}
