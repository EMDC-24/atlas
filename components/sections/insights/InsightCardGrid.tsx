import type { InsightArticle } from "@/lib/content/insights";

import InsightCard from "./InsightCard";

/**
 * The four-column card grid used by every insights listing.
 *
 * Each cell carries the left rule and a -1px top offset so adjacent cells share
 * a single hairline instead of doubling it up.
 *
 * Certain cells span two columns, which is what makes a row hold three cards
 * instead of four. Which cells those are is not derivable -- the source markup
 * widens different positions on each listing -- so callers pass them in.
 */

const CELL = "border-off-white/20 md:-mt-px md:border-l [&_article]:h-full";
const CELL_WIDE = `md:col-span-2 ${CELL}`;

export default function InsightCardGrid({
  articles,
  wideIndexes,
  className,
}: {
  articles: InsightArticle[];
  /** Zero-based positions rendered two columns wide. */
  wideIndexes: number[];
  /** Grid classes, which differ per listing. */
  className: string;
}) {
  return (
    <div className={className}>
      {articles.map((article, index) => (
        <div key={article.slug} className={wideIndexes.includes(index) ? CELL_WIDE : CELL}>
          <InsightCard article={article} />
        </div>
      ))}
    </div>
  );
}
