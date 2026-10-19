"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { createWhyFoundersScene } from "@/lib/webgl/scenes/whyFounders";
import type { Scene } from "@/lib/webgl/scenes/whyFounders";

/**
 * "Move at the speed of breakthrough" -- three tinted cards over a WebGL wave
 * plane. Ported from the `whyFounders` Alpine component.
 *
 * The scene only exists at >=768px (the canvas is `hidden ... md:block`), and
 * the original creates/destroys it on the width crossing rather than just
 * hiding it -- so a narrow viewport never pays for a WebGL context. Resize is
 * compared on width alone because mobile browsers fire `resize` when the URL
 * bar collapses during scroll.
 */

const DESKTOP_BREAKPOINT = 768;

const CARDS = [
  {
    surface: "bg-electric-teal text-rich-carbon",
    title: "A team of senior operators, on demand.",
    src: "/images/files/why-1_2026-02-12-092025_pbzv.svg",
    height: 1960.78,
    number: "01",
    body: "Market analyst, compliance officer, growth lead, product manager and finance partner: Atlas Compass turns the first twelve months of building a company into a guided, gamified journey. Missions and levels, not a chat window.",
  },
  {
    surface: "bg-infrared text-rich-carbon",
    title: "Software on a canvas.",
    src: "/images/files/why-2.svg",
    height: 1960.78,
    number: "02",
    body: "Atlas Studio treats building software the way Figma treats design. The canvas is primary, components are direct manipulation, and the backend (data models, auth, integrations, jobs, APIs) lives on the same surface. Real software out, not prototypes.",
  },
  {
    surface: "bg-off-white text-rich-carbon",
    title: "Five platforms, ready today.",
    src: "/images/files/why-3.svg",
    height: 2000,
    number: "03",
    body: "Agnate, Kourier, Atlas ERP, Kanon and Nexcol are already in production: CRM, collaboration, ERP, task management and knowledge work, covered. Buy online, start the same day, with team and enterprise tiers when you need them.",
  },
];

export default function FoundersCards() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let scene: Scene | null = null;
    let previousWidth = window.innerWidth;

    const createScene = () => {
      if (scene) return;
      scene = createWhyFoundersScene(canvas, root);
      scene.init();
    };
    const destroyScene = () => {
      if (!scene) return;
      scene.destroy();
      scene = null;
    };

    if (previousWidth >= DESKTOP_BREAKPOINT) createScene();

    const onResize = () => {
      const width = window.innerWidth;
      if (width === previousWidth) return;
      const wasDesktop = previousWidth >= DESKTOP_BREAKPOINT;
      const isDesktop = width >= DESKTOP_BREAKPOINT;
      previousWidth = width;
      if (!wasDesktop && isDesktop) createScene();
      else if (wasDesktop && !isDesktop) destroyScene();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      destroyScene();
    };
  }, []);

  return (
    <div className="relative isolate" ref={rootRef}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 hidden h-dvh w-full md:block"
      />
      <section className="py-[120px] md:py-[200px]">
        <div className="container">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-start gap-x-[24px] gap-y-[40px]">
            <div className="col-span-12 flex flex-col items-start gap-[35px] md:col-span-5 xl:col-span-4">
              <div className="border-off-white/20 flex w-full flex-col gap-[15px] border-b pb-[15px]">
                <SplitTextReveal as="p" className="h4 uppercase">
                  build fast,
                  <br />
                  launch today.
                </SplitTextReveal>
              </div>
              <Button
                theme="light"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("contact-modal:open", { detail: "#contact" })
                  )
                }
              >
                Build with us
              </Button>
            </div>
            <div className="col-span-12 flex flex-col gap-[20px] md:col-span-6 md:col-start-7">
              {CARDS.map((card) => (
                <div
                  key={card.number}
                  className={`${card.surface} flex aspect-[1.3/1] max-h-[500px] min-h-[300px] w-full max-w-[668px] flex-col justify-between gap-[32px] rounded-[20px] px-[20px] py-[40px] md:min-h-[500px] md:px-[40px] md:py-[60px]`}
                >
                  <div className="flex items-center justify-between gap-[32px]">
                    <SplitTextReveal
                      as="h3"
                      className="h6 min-[830px]:h5 max-w-[360px] text-balance uppercase"
                    >
                      {card.title}
                    </SplitTextReveal>
                    <picture className="size-[32px] md:size-[60px] shrink-0 object-contain">
                      <Image
                        alt=""
                        className="h-full w-auto"
                        height={card.height}
                        sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
                        src={card.src}
                        width={2000}
                      />
                    </picture>
                  </div>
                  <div className="flex flex-col gap-[30px]">
                    <div className="border-rich-carbon/20 border-b pb-[9px]">
                      <p className="p1-mono">{card.number}</p>
                    </div>
                    <p className="md:pb p1">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
