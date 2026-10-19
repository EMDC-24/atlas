"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { LegalContent } from "@/lib/content/legal/types";

/**
 * Shared layout for every legal page: pinned title + table of contents on the
 * left, rich text on the right.
 *
 * Two behaviours are ported from the original's inline `x-data`:
 *
 *  - the left column is pinned by ScrollTrigger for the height of the prose,
 *    from 768px up. `trigger` is the prose (not the column), `pinSpacing` is
 *    off, and `end` is a function so it re-measures on refresh.
 *  - an IntersectionObserver over the prose headings drives `activeIndex`,
 *    which highlights the matching TOC entry and moves the vertical bar. The
 *    `-80px 0px -80% 0px` root margin makes a heading "active" only while it
 *    sits in the top fifth of the viewport.
 *
 * The bar is a sibling of the `<li>`s inside the `<ul>`, exactly as the source
 * has it -- moving it out would break the `absolute` positioning it relies on.
 */

const PROSE_CLASS =
  "prose prose--rich [&_h3]:mt-[64px]! md:[&_h3]:mt-[80px]! [&_h4]:mt-[64px]! md:[&_h4]:mt-[80px]! [&_h5]:mt-[64px]! md:[&_h5]:mt-[80px]! [&_h6]:mt-[64px]! md:[&_h6]:mt-[80px]! [&_ol]:my-[24px]! [&_ul]:my-[24px]!";

export default function LegalArticle({ content }: { content: LegalContent }) {
  const { title, toc, html } = content;

  const columnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [indicator, setIndicator] = useState({ height: 0, offset: 0 });

  const updateIndicator = useCallback((index: number) => {
    const item = listRef.current?.querySelectorAll("li")[index];
    if (!item) return;
    setIndicator({ height: item.offsetHeight, offset: item.offsetTop });
  }, []);

  // Pin the left column for the height of the prose.
  useEffect(() => {
    const column = columnRef.current;
    const contentEl = contentRef.current;
    if (!column || !contentEl) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const st = ScrollTrigger.create({
        trigger: contentEl,
        start: "top 80px",
        end: (self) => {
          const pin = self.pin as HTMLElement | undefined;
          return "+=" + (contentEl.offsetHeight - (pin?.offsetHeight ?? 0));
        },
        pin: column,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  // Track which heading is in view.
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || toc.length === 0) return;

    const headings = [...contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    updateIndicator(0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = headings.indexOf(entry.target);
          if (index !== -1) {
            setActiveIndex(index);
            updateIndicator(index);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [toc.length, updateIndicator]);

  // The original re-measured on resize, since line wrapping changes item heights.
  useEffect(() => {
    if (toc.length === 0) return;
    const onResize = () => updateIndicator(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, toc.length, updateIndicator]);

  return (
    <article className="py-[100px] md:py-[220px]">
      <div className="container">
        <div className="grid grid-cols-12 items-start gap-x-[24px] gap-y-[32px]">
          <div ref={columnRef} className="col-span-12 flex flex-col gap-[15px] lg:col-span-4">
            <h1 className="h4 uppercase">{title}</h1>

            {toc.length > 0 && (
              <nav
                aria-label="Table of contents"
                className="border-off-white/20 hidden border-t pt-[35px] lg:block"
              >
                <ul
                  ref={listRef}
                  className="border-off-white/40 p-small relative flex flex-col gap-[6px] border-l pl-[16px]"
                  role="list"
                >
                  {toc.map((entry, i) => (
                    <li key={entry.id} className="flex">
                      <a
                        className={`p3-mono text-left text-balance transition-colors duration-400 ease-(--easing) ${
                          activeIndex === i ? "text-off-white" : "text-off-white/40"
                        }`}
                        href={`#${entry.id}`}
                      >
                        {entry.label}
                      </a>
                    </li>
                  ))}
                  <div
                    className="bg-off-white pointer-events-none absolute top-0 left-0 w-px transition-[height,top] duration-400 ease-(--easing)"
                    style={{ height: `${indicator.height}px`, top: `${indicator.offset}px` }}
                  />
                </ul>
              </nav>
            )}
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7 xl:col-span-5 xl:col-start-7">
            <div
              ref={contentRef}
              className={PROSE_CLASS}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
