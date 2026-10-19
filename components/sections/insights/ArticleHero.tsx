import Image from "next/image";
import Link from "next/link";

import type { InsightArticle } from "@/lib/content/insights";

/**
 * Full-height article hero: the image fills the block, a 40% carbon wash keeps
 * the text legible over it, and the title card floats at the bottom.
 *
 * The content column is `pointer-events-none` with the two interactive elements
 * opting back in, so the empty area over the image stays draggable/selectable.
 */
export default function ArticleHero({ article }: { article: InsightArticle }) {
  return (
    <div className="relative isolate flex h-dvh min-h-[600px] items-end overflow-hidden rounded-b-[20px]">
      <Image
        alt=""
        className="absolute inset-0 size-full object-cover"
        src={article.image.src}
        width={article.image.width}
        height={article.image.height}
        sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
      />
      <div className="bg-rich-carbon/40 pointer-events-none absolute inset-0 z-2 transition" />
      <div className="pointer-events-none relative z-10 container w-full py-[32px] transition md:py-[64px]">
        <Link
          className="p2-mono text-neural-fog pointer-events-auto inline-flex items-center gap-[10px]"
          href="/insights"
        >
          <span className="bg-neural-fog size-[10px] rounded-[3px]" />
          Back to Insights
        </Link>
        <div className="bg-off-white/80 text-rich-carbon pointer-events-auto mt-[18px] max-w-[625px] rounded-[8px] p-[20px] pb-[24px] backdrop-blur-sm md:mt-[28px] md:p-[24px] md:pb-[32px]">
          <div className="flex items-center gap-[16px]">
            <span className="p2-mono bg-neural-fog hidden rounded-[7px] px-[8px] py-[3px] md:block">
              {article.category}
            </span>
            <div className="p3-mono flex justify-center gap-[12px] leading-none">
              <span>{article.readTime}</span>
              <span className="bg-rich-carbon/20 w-px shrink-0" />
              <span>{article.date}</span>
            </div>
          </div>
          <h1 className="h4 mt-[20px] uppercase md:mt-[24px]">{article.heading}</h1>
        </div>
      </div>
    </div>
  );
}
