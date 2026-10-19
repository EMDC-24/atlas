import Button from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/Reveal";
import { featuredInsightSlugs, getInsights } from "@/lib/content/insights";

import InsightCardGrid from "./InsightCardGrid";

/** Cells widened to two columns on /insights, per the source markup. */
const WIDE_INDEXES = [1, 4];

export default function LatestNews() {
  const articles = getInsights(featuredInsightSlugs);

  return (
    <FadeIn as="section" className="container pt-[64px] pb-[176px] md:py-[80px]">
      <h2 className="h6 border-neural-fog border-b pb-[16px] uppercase">Latest News</h2>
      <div className="overflow-hidden">
        <InsightCardGrid
          articles={articles}
          wideIndexes={WIDE_INDEXES}
          className="-mt-px grid pb-[80px] md:mx-[-24px] md:grid-cols-4 md:gap-y-[80px]"
        />
        <div className="mx-auto max-w-[260px] [&_a]:w-full">
          <Button theme="light" href="/insights/news" className="block">
            See All Latest News
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}
