"use client";

import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { gsap } from "@/lib/gsap";
import { createHomeHero } from "@/lib/webgl/scenes/homeHero";

/**
 * Homepage hero: a WebGL particle sphere behind a title that assembles itself.
 *
 * The title animation is the intricate part. Words start stacked centre, then:
 *  1. all words wipe in from a bottom clip with a -48px lift
 *  2. `.hero-title--left` words slide to the container's left edge, and
 *     `.hero-title--right` words to its right edge -- each word offset by the
 *     cumulative width of its predecessors on the same visual line
 *  3. the bottom content fades up, overlapping the previous step by 0.9s
 *
 * Words are grouped into lines by their rounded `getBoundingClientRect().top`,
 * because line breaks depend on wrapping and can't be known up front.
 *
 * Runs after `document.fonts.ready` -- measuring word widths before the webfont
 * loads would place every word wrong.
 */

const LEFT_WORDS_DELAY = 1.5;

/** Groups elements that share a visual line, keyed by rounded top offset. */
function groupByLine(elements: HTMLElement[]): HTMLElement[][] {
  const lines = new Map<number, HTMLElement[]>();
  elements.forEach((el) => {
    const top = Math.round(el.getBoundingClientRect().top);
    if (!lines.has(top)) lines.set(top, []);
    lines.get(top)!.push(el);
  });
  return Array.from(lines.values());
}

export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const bottom = bottomRef.current;
    if (!container || !bottom) return;

    const left = gsap.utils.toArray<HTMLElement>(".hero-title--left", container);
    const right = gsap.utils.toArray<HTMLElement>(".hero-title--right", container);

    let timeline: gsap.core.Timeline | null = null;
    let lastWidth = window.innerWidth;

    const build = (delay = 1.5) => {
      if (!left.length && !right.length) return;

      // Reset to the measured starting layout before re-measuring.
      gsap.set([...left, ...right], { x: 0, clearProps: "clipPath,transform" });
      gsap.set(bottom, { opacity: 1, y: 0 });

      const tl = gsap.timeline({ delay });
      const leftLines = groupByLine(left);
      const rightLines = groupByLine(right);
      const bounds = container.getBoundingClientRect();
      const containerLeft = bounds.left;
      const containerRight = bounds.right;

      tl.from([...left, ...right], {
        css: { clipPath: "inset(100% 0 0 0)", translateY: "-48px" },
        duration: 1.4,
        ease: "power3.inOut",
      });

      // Left words pack against the container's left edge, in reading order.
      leftLines.forEach((line) => {
        tl.to(
          line,
          {
            x: (index, target: HTMLElement) => {
              const rect = target.getBoundingClientRect();
              let offset = 0;
              for (let i = 0; i < index; i++) {
                const prev = line[i].getBoundingClientRect();
                // A quarter-em word gap, scaled off the word's own font size.
                const gap = 0.25 * parseFloat(getComputedStyle(line[i]).fontSize);
                offset += prev.width + gap;
              }
              return containerLeft + offset - rect.left;
            },
            duration: 1.25,
            ease: "power4.inOut",
            stagger: 0.04,
          },
          1
        );
      });

      // Right words pack against the right edge, so they're walked in reverse.
      rightLines.forEach((line) => {
        tl.to(
          [...line].reverse(),
          {
            x: (index, target: HTMLElement) => {
              const rect = target.getBoundingClientRect();
              const sourceIndex = line.length - 1 - index;
              let offset = 0;
              for (let i = line.length - 1; i > sourceIndex; i--) {
                const prev = line[i].getBoundingClientRect();
                const gap = 0.25 * parseFloat(getComputedStyle(line[i]).fontSize);
                offset += prev.width + gap;
              }
              return containerRight - rect.width - offset - rect.left;
            },
            duration: 1.25,
            ease: "power4.inOut",
            stagger: 0.04,
          },
          1
        );
      });

      tl.from(
        bottom,
        { opacity: 0, y: 20, duration: 1, ease: "power4.inOut" },
        "-=0.9"
      );

      timeline = tl;
    };

    document.fonts.ready.then(() => build(LEFT_WORDS_DELAY));

    // Only rebuild on width changes -- mobile browsers fire resize on scroll as
    // the URL bar collapses, and replaying on that would be jarring.
    const onResize = () => {
      const width = window.innerWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      timeline?.kill();
      build(0);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      timeline?.kill();
    };
  }, []);

  // The particle sphere behind the title.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createHomeHero(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="container">
        <div className="flex h-dvh min-h-[550px] flex-col justify-between gap-[40px] md:gap-[40px]">
          <div className="hidden grow basis-0 md:block" />

          <div
            ref={containerRef}
            className="relative isolate flex w-full grow justify-center pt-(--header-height) max-md:items-center md:grow-0 md:pt-0"
          >
            <h1 className="h2 max-w-[800px] text-center leading-none uppercase" data-speed="1.1">
              <span className="hero-title--left">Building</span>
              <br className="md:hidden" />
              <span className="hero-title--left">The</span>
              <br />
              <span className="hero-title--left">Operating</span>
              <br className="md:hidden" />
              <span className="hero-title--right mt-[64px] md:mt-0">System</span>{" "}
              <span className="hero-title--right">For</span>
              <br />
              <span className="hero-title--right">Critical</span>
              <br className="md:hidden" />
              <span className="hero-title--right">Decisions</span>
            </h1>
          </div>

          <div
            ref={bottomRef}
            className="p3-mono text-off-white/60 mt-auto flex flex-col justify-end gap-[6px] pb-[24px] md:mt-0 md:grow md:basis-0 md:pb-[30px]"
          >
            <div className="border-off-white/20 flex w-full flex-col-reverse gap-[24px] border-t pt-[20px] md:flex-row">
              <div className="flex items-center justify-between md:w-[30%] xl:w-[50%]">
                <Button
                  theme="light"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("contact-modal:open", { detail: "#contact" })
                    )
                  }
                >
                  Contact Us
                </Button>
                <LogoMark className="text-neural-fog size-[40px] md:hidden" />
              </div>

              <div className="flex shrink-0 items-start justify-between md:w-[70%] xl:w-[50%]">
                <p className="md:max-w-[490px]">
                  Atlas Intelligence builds and runs software for organisations that
                  cannot afford for it to fail (government departments, banks, telecoms,
                  industrial groups), alongside founders building the next generation of
                  companies. Systems integration. Applied AI. Data platforms. Long-run
                  managed operations.
                </p>
                <LogoMark className="text-neural-fog hidden h-full w-auto md:block" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 -z-1 h-full w-full" />
    </section>
  );
}
