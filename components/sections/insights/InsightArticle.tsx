import Button from "@/components/ui/Button";
import type { InsightArticle as InsightArticleData } from "@/lib/content/insights";

import ArticleAside from "./ArticleAside";
import ArticleHero from "./ArticleHero";
import ArticleShare from "./ArticleShare";

/**
 * A single insight article: hero, then a three-column body (pinned CTA rail,
 * copy, pinned share rail).
 *
 * `flex-col-reverse` puts the CTA rail after the copy on mobile while keeping
 * it first in the DOM for the desktop row.
 */
export default function InsightArticle({ article }: { article: InsightArticleData }) {
  return (
    <article>
      <ArticleHero article={article} />
      <div className="container flex flex-col-reverse pb-[80px] md:flex-row md:pb-[100px]">
        <ArticleAside />
        <div className="flex w-full gap-[10px] md:gap-[80px] md:pl-[70px]">
          <div className="w-full max-w-[784px] pt-[80px]">
            {/* Static, trusted markup lifted verbatim from the scraped page. */}
            <div
              className="prose prose--rich"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />
            {article.externalLink && (
              <div className="mt-[20px] flex md:mt-[24px]">
                <Button theme="light" href={article.externalLink.href} className="block">
                  {article.externalLink.label}
                </Button>
              </div>
            )}
          </div>
          <ArticleShare slug={article.slug} title={article.heading} />
        </div>
      </div>
    </article>
  );
}
