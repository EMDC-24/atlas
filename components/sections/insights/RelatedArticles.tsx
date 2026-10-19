"use client";

import type { InsightArticle } from "@/lib/content/insights";
import { pad, useSlider } from "@/lib/hooks/useSlider";

import InsightCard from "./InsightCard";
import InsightCardGrid from "./InsightCardGrid";

import "swiper/css";

/**
 * "Related articles" footer.
 *
 * Desktop gets the same static grid as the listings; below `md` the cards
 * become a one-per-view Swiper. Both sets of cards are rendered -- the source
 * does the same and toggles them with `hidden` / `md:hidden`.
 */

/** Slider options copied from the source's inline `x-data="slider({...})"`. */
const SLIDER_OPTIONS = {
  slidesPerView: 1,
  speed: 500,
  spaceBetween: 16,
  slideToClickedSlide: true,
  mousewheel: {
    forceToAxis: true,
    releaseOnEdges: true,
  },
  longSwipesRatio: 0.15,
  longSwipesMs: 250,
  threshold: 3,
  resistanceRatio: 0.6,
  touchRatio: 1.3,
};

/** Cells widened to two columns in the related grid, per the source markup. */
const WIDE_INDEXES = [1];

export default function RelatedArticles({ articles }: { articles: InsightArticle[] }) {
  const { containerRef, activeIndex, isBeginning, isEnd, prev, next } =
    useSlider(SLIDER_OPTIONS);

  return (
    <section className="from-urban-smoke container rounded-t-[20px] bg-linear-to-b py-[80px] md:pt-[100px] md:pb-[116px]">
      <h2 className="h6 border-neural-fog border-b pb-[16px] uppercase">Related articles</h2>
      <div className="overflow-hidden">
        <InsightCardGrid
          articles={articles}
          wideIndexes={WIDE_INDEXES}
          className="-mt-px hidden pb-[80px] md:mx-[-24px] md:grid md:grid-cols-4 md:gap-y-[80px]"
        />
        <div className="md:hidden">
          <div className="swiper" ref={containerRef}>
            <div className="swiper-wrapper">
              {articles.map((article) => (
                <div className="swiper-slide overflow-hidden" key={article.slug}>
                  <div className="[&_article]:h-full">
                    <InsightCard article={article} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-[24px] flex items-center justify-between gap-[12px]">
            <button
              disabled={isBeginning}
              onClick={prev}
              aria-label="Previous"
              className="button -arrow bg-neural-fog size-[32px] disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                className="size-[18px]"
                fill="none"
                height="18"
                viewBox="0 0 18 18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0833 13H8.01667L4 9.02474L8.01667 5H10.0833L8.38333 6.69897L6.56667 8.38144L9.08333 8.29897H14V9.75052H9.08333L6.58333 9.66804L8.43333 11.367L10.0833 13Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <p className="p2-mono md:hidden">
              <span>{pad(activeIndex + 1)}</span> / {pad(articles.length)}
            </p>
            <button
              disabled={isEnd}
              onClick={next}
              aria-label="Next"
              className="button -arrow bg-neural-fog size-[32px] disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                className="size-[18px]"
                fill="none"
                height="18"
                viewBox="0 0 18 18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.91667 13H9.98333L14 9.02474L9.98333 5H7.91667L9.61667 6.69897L11.4333 8.38144L8.91667 8.29897H4V9.75052H8.91667L11.4167 9.66804L9.56667 11.367L7.91667 13Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
