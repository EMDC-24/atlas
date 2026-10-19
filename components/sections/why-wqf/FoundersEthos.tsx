"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * "Connections that move you forward" -- three cards that expand on hover.
 *
 * Widths are pure CSS: the hovered `<li>` gets `-active`, which both widens it
 * (`md:w-[40%]!`) and, via `group-has-[li.-active]`, narrows its siblings to
 * 30%. The inner panel is overwide (`md:w-[125%]`) while inactive so the image
 * stays cropped, snapping to `w-full` when its own card is active.
 *
 * On mobile there's no hover, so each card instead wipes in from the bottom on
 * scroll -- registered through `gsap.matchMedia` so the ScrollTriggers are
 * created and reverted with the breakpoint.
 */

const CARDS = [
  {
    id: 1,
    surface: "bg-urban-smoke text-neural-fog",
    title: "Five senior roles, one product.",
    src: "/images/transforms/why-card-1.png",
    height: 2020.2,
    body: "A market analyst, a compliance officer, a growth lead, a product manager and a finance partner, reasoning through your specific problem. Not generic advice. Evidence produced at every stage.",
  },
  {
    id: 2,
    surface: "bg-electric-teal text-rich-carbon",
    title: "Composable, not just configurable.",
    src: "/images/transforms/why-card-2.png",
    height: 2222.22,
    body: "Atlas Studio's canvas is the whole surface: design, data, auth, integrations, jobs, APIs. Compose real, deployable software without waiting on an engineering hire.",
  },
  {
    id: 3,
    surface: "bg-infrared text-rich-carbon",
    title: "Your company. Your decisions.",
    src: "/images/transforms/why-card-3.png",
    height: 1980.2,
    body: "Structured missions guide the work, but you make the calls: on product, growth, and finance. Atlas Compass produces evidence at every stage, so you decide with confidence, not guesswork.",
  },
];

export default function FoundersEthos() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(list.querySelectorAll("li"));
      cards.forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 50%",
            end: "bottom bottom",
          },
          clipPath: "inset(0 0 100% 0)",
          duration: 0.6,
          ease: "power3.inOut",
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="container overflow-hidden pt-[120px] pb-[80px] md:py-[200px]">
      <div className="mb-[56px] grid gap-[24px] md:mb-[64px] md:grid-cols-2">
        <SplitTextReveal as="p" className="h4 uppercase">
          Structure that
          <br />
          moves you forward.
        </SplitTextReveal>
        <div className="border-off-white/20 border-t pt-[20px] md:pt-[24px]">
          <p className="p1 mb-[24px] max-w-[604px] md:mb-[32px]">
            Senior-grade reasoning across every function. Missions and levels
            instead of a blank page. You stay in control of the company you&apos;re building.
          </p>
          <Button
            theme="light"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("contact-modal:open", { detail: "#contact" })
              )
            }
          >
            start today
          </Button>
        </div>
      </div>
      <ul
        ref={listRef}
        className="group flex flex-col gap-[20px] md:flex-row md:gap-0"
        id="ethos-cards"
      >
        {CARDS.map((card) => (
          <li
            key={card.id}
            className={`group/card w-full shrink-0 transition-[width] delay-100 duration-500 ease-(--easing) md:w-[33%] md:group-has-[li.-active]:w-[30%]${
              activeCard === card.id ? " -active md:w-[40%]!" : ""
            }`}
            onMouseEnter={() => setActiveCard(card.id)}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div
              className={`relative h-full w-full overflow-hidden rounded-[20px] transition-all delay-100 duration-500 ease-(--easing) md:w-[125%] md:group-[.-active]/card:w-full ${card.surface}`}
              id={`ethos-card-${card.id}`}
            >
              <div className="flex size-full justify-center pt-[40px] pb-[20px] md:py-[40px]">
                <div className="flex w-full flex-col items-center gap-[22px] px-[20px] text-center md:max-w-[300px] md:shrink-0 md:gap-[44px]">
                  <button
                    aria-controls={`ethos-card-${card.id}`}
                    aria-expanded={activeCard === card.id}
                    onClick={() => setActiveCard(card.id)}
                    className="hidden md:block"
                  >
                    <SplitTextReveal as="h3" className="md:h5 h4 uppercase">
                      {card.title}
                    </SplitTextReveal>
                  </button>
                  <h3 className="h5 uppercase md:hidden">{card.title}</h3>
                  <picture className="size-full max-h-[300px]">
                    <Image
                      alt=""
                      className="size-full object-contain object-center"
                      height={card.height}
                      sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
                      src={card.src}
                      width={2000}
                    />
                  </picture>
                  <div className="p4-mono flex flex-col gap-[15px]">
                    <p className="text-pretty">{card.body}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
