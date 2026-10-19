import { insightArticles } from "@/lib/content/insights";

import InsightCardGrid from "./InsightCardGrid";

/** Cells widened to two columns on /insights/news, per the source markup. */
const WIDE_INDEXES = [1];

export default function NewsGrid() {
  return (
    <section className="container pt-[64px] pb-[80px] md:py-[80px]">
      <div className="border-neural-fog overflow-hidden border-t">
        <InsightCardGrid
          articles={insightArticles}
          wideIndexes={WIDE_INDEXES}
          className="-mt-px grid md:mx-[-24px] md:grid-cols-4 md:gap-y-[80px] md:pb-[80px]"
        />
      </div>
    </section>
  );
}
