"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { createInvestorsFoundersScene } from "@/lib/webgl/scenes/investorsFounders";

/**
 * "For Investors" and "Founders" -- two mirrored column/cards blocks over one
 * shared WebGL backdrop.
 *
 * Each text column pins from `top 80px` until its sibling card list is half
 * out of view (`endTrigger` on the cards, `end: 'bottom 50%'`), so the copy
 * holds while the cards scroll past it. `pinSpacing: false` keeps the grid
 * height unchanged. `data-lag` is read by ScrollSmoother to trail the column
 * slightly behind the scroll.
 *
 * The original also registered per-card ScrollTriggers, but it selected them
 * with `querySelectorAll('li')` while the cards are `div`s -- so those never
 * matched anything and no card animation runs on the live site. Reproduced as
 * such deliberately; adding it would change the visual.
 */

interface Card {
  surface: string;
  title: string;
  titleMaxWidth: string;
  src: string;
  height: number;
  number: string;
  body: string;
}

const INVESTOR_CARDS: Card[] = [
  {
    surface: "bg-electric-teal",
    title: "One platform, every pillar",
    titleMaxWidth: "max-w-[360px]",
    src: "/images/files/home-1.svg",
    height: 2040.82,
    number: "01",
    body: "A shared security, identity, and deployment layer across government, enterprise, and product work, so nothing is built twice.",
  },
  {
    surface: "bg-infrared",
    title: "Sovereign by default",
    titleMaxWidth: "max-w-[360px]",
    src: "/images/files/home-2.svg",
    height: 2000,
    number: "02",
    body: "You keep custody of your data, your infrastructure, and your exit path. We build the system; you hold the keys.",
  },
  {
    surface: "bg-off-white",
    title: "Support past go-live.",
    titleMaxWidth: "max-w-[360px]",
    src: "/images/files/home-3.svg",
    height: 2000,
    number: "03",
    body: "Multi-year agreements mean the system keeps getting supported long after the first release ships.",
  },
];

const FOUNDER_CARDS: Card[] = [
  {
    surface: "bg-electric-teal",
    title: "Atlas Compass: senior operators on demand",
    titleMaxWidth: "max-w-[450px]",
    src: "/images/files/home-4.svg",
    height: 2000,
    number: "01",
    body: "A market analyst, compliance officer, growth lead, product manager, and finance partner, guided as one product through your first 12 months.",
  },
  {
    surface: "bg-infrared",
    title: "Atlas Studio: software on a canvas",
    titleMaxWidth: "max-w-[450px]",
    src: "/images/files/home-5.svg",
    height: 2040.82,
    number: "02",
    body: "A no-code, canvas-first builder with the backend on the same surface. What you design is what ships.",
  },
  {
    surface: "bg-off-white",
    title: "Start the same day.",
    titleMaxWidth: "max-w-[450px]",
    src: "/images/files/home-6.svg",
    height: 1960.78,
    number: "03",
    body: "Monthly subscription, no onboarding queue. Sign up and start building today.",
  },
];

function ValueCard({ card }: { card: Card }) {
  return (
    <div
      className={`${card.surface} text-rich-carbon flex aspect-[1.3/1] max-h-[500px] min-h-[300px] w-full max-w-[668px] flex-col justify-between gap-[32px] rounded-[20px] px-[20px] py-[40px] md:min-h-[500px] md:px-[40px] md:py-[60px]`}
    >
      <div className="flex items-center justify-between gap-[32px]">
        <h3 className={`h6 min-[830px]:h5 ${card.titleMaxWidth} text-balance uppercase`}>
          {card.title}
        </h3>
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
  );
}

/** Pins a text column against its paired card list for the desktop breakpoint. */
function usePinnedColumn(endTriggerId: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 80px",
        endTrigger: endTriggerId,
        end: "bottom 50%",
        pin: el,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, [endTriggerId]);

  return ref;
}

export default function HomeInvestorsFounders() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const investorsColumnRef = usePinnedColumn("#investors-cards");
  const foundersColumnRef = usePinnedColumn("#founders-cards");

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const scene = createInvestorsFoundersScene(canvas, wrapper);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <div className="relative isolate overflow-hidden" id="investors-founders">
      <div ref={wrapperRef} className="absolute inset-0 -z-1 size-full">
        <canvas ref={canvasRef} className="size-full" />
      </div>

      <section className="py-[120px] md:py-[200px]" id="investors-section">
        <div className="container">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-start gap-x-[24px] gap-y-[40px]">
            <div
              ref={investorsColumnRef}
              className="col-span-12 flex flex-col items-start gap-[35px] md:col-span-5 xl:col-span-4"
              data-lag="0.2"
            >
              <div className="border-off-white/20 flex w-full flex-col gap-[15px] border-b pb-[15px]">
                <h2 className="p2-mono">For Government & Enterprise</h2>
                <SplitTextReveal as="p" className="h4 uppercase">
                  Systems built for institutions that can&apos;t afford failure.
                </SplitTextReveal>
              </div>
              <p className="p2-mono text-off-white/60">
                Government departments, banks, telecoms, and industrial groups trust
                Atlas to build and run the systems their operations depend on.
              </p>
              <Button
                theme="light"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("contact-modal:open", { detail: "investor" })
                  )
                }
              >
                Talk to us
              </Button>
            </div>

            <div
              className="col-span-12 flex flex-col gap-[20px] md:col-span-6 md:col-start-7"
              id="investors-cards"
            >
              {INVESTOR_CARDS.map((card) => (
                <ValueCard key={card.number} card={card} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="pb-[200px] md:pt-[300px] md:pb-[300px]"
        id="founders-section"
      >
        <div className="container" id="founders">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-start gap-x-[24px] gap-y-[40px]">
            <div
              className="order-2 col-span-12 flex flex-col gap-[20px] md:order-1 md:col-span-6"
              id="founders-cards"
            >
              {FOUNDER_CARDS.map((card) => (
                <ValueCard key={card.number} card={card} />
              ))}
            </div>

            <div
              ref={foundersColumnRef}
              className="order-1 col-span-12 flex flex-col items-start gap-[35px] md:order-2 md:col-span-5 md:col-start-8 xl:col-span-4 xl:col-start-9"
              data-lag="0.2"
            >
              <div className="border-off-white/20 flex w-full flex-col gap-[15px] border-b pb-[15px]">
                <h2 className="p2-mono">Founders</h2>
                <SplitTextReveal as="p" className="h4 uppercase">
                  A team of senior operators, on demand.
                </SplitTextReveal>
              </div>
              <p className="p2-mono text-off-white/60">
                Atlas Compass and Atlas Studio put a guided team and a canvas-first
                builder in your hands, live from day one, no code required to start.
              </p>
              <Button
                theme="light"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("contact-modal:open", { detail: "founder" })
                  )
                }
              >
                Explore Atlas Products
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
