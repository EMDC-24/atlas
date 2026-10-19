import Image from "next/image";
import Link from "next/link";

import type { InsightArticle } from "@/lib/content/insights";

/**
 * One article teaser. Shared by /insights, /insights/news and the "Related
 * articles" rail, which all render this identical `<article>`.
 *
 * The trailing absolutely-positioned div draws the card's own border so the
 * rule sits inside the column padding on desktop but runs edge-to-edge on
 * mobile -- a border on the article itself couldn't do both.
 */
export default function InsightCard({ article }: { article: InsightArticle }) {
  return (
    <article className="group relative flex flex-col py-[24px] pb-[32px] text-center md:px-[24px] md:pt-[24px] md:pb-[64px]">
      <div className="relative aspect-square w-full overflow-hidden md:aspect-304/250">
        <Image
          alt=""
          className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-400 ease-(--easing)"
          src={article.image.src}
          width={article.image.width}
          height={article.image.height}
          sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
        />
      </div>
      <h3 className="h6 mt-[24px] uppercase md:mt-[32px]">
        <Link className="box-link" href={`/insights/${article.slug}`}>
          {article.heading}
        </Link>
      </h3>
      <p className="p3 text-off-white/60 mt-[16px]">{article.excerpt}</p>
      <div className="p3-mono text-neural-fog mt-[16px] flex justify-center gap-[12px] leading-none">
        <span>{article.readTime}</span>
        <span className="bg-off-white/20 w-px shrink-0" />
        <span>{article.date}</span>
      </div>
      <div className="border-off-white/20 pointer-events-none absolute inset-x-0 inset-y-0 border-b md:inset-x-[24px] md:border-y" />
    </article>
  );
}
