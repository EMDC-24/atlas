"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * "Our ethos" -- four cards that expand on hover.
 *
 * Two independent animations:
 *  1. The whole section wipes in left-to-right, scrubbed against the scroll
 *     between `top bottom-=10%` and `top center`. It's a `from` on a clip-path
 *     inset, so the resting state is the plain section.
 *  2. Card widths are driven off `activeCard` directly (not a CSS
 *     `group-has-[...]` selector -- Tailwind v4 silently fails to compile
 *     compound tag+class selectors like `group-has-[li.foo]`, which left
 *     inactive siblings at their base width with nowhere for the active card
 *     to grow but off the right edge of the container). The active card
 *     widens to 40%, every other card narrows to 20%, so the growth comes out
 *     of its neighbours' width and the row's total stays put.
 *     The inner panel is overwide (`md:w-[125%]`) while inactive so its artwork
 *     stays cropped, snapping to `w-full` when its own card is active.
 *
 * On mobile there's no hover, so each card instead wipes up on scroll --
 * registered through `gsap.matchMedia` so the ScrollTriggers are created and
 * reverted with the breakpoint.
 */

const CARDS = [
  {
    id: 1,
    surface: "bg-rich-carbon text-neural-fog",
    title: "Platform Fabric",
    src: "/images/files/exponential-foresight-icon.svg",
    height: 2985.07,
    counter: "01 / 04",
    body: "One security, identity, and deployment layer runs under every pillar we build. Government programmes, enterprise platforms, and founder products all inherit the same foundation.",
  },
  {
    id: 2,
    surface: "bg-electric-teal",
    title: "Sovereign By Default",
    src: "/images/files/full-stack-support-icon.svg",
    height: 2666.67,
    counter: "02 / 04",
    body: "Clients keep custody of their data, their infrastructure, and their exit path. We build the system. They keep the keys.",
  },
  {
    id: 3,
    surface: "bg-infrared",
    title: "Market Access Partnerships",
    src: "/images/files/financial-support-icon.svg",
    height: 2247.19,
    counter: "03 / 04",
    body: "We pair local execution with international manufacturing depth, so public-sector programmes can move from mandate to procurement, deployment, and support through one accountable route.",
  },
  {
    id: 4,
    surface: "bg-off-white",
    title: "Support Past Launch",
    src: "/images/files/intelligent-iteration-icon.svg",
    height: 3278.69,
    counter: "04 / 04",
    body: "Delivery doesn’t end at go-live. We stay on as the system runs, adapting it as the organisation around it changes.",
  },
];

export default function HomeEthos() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom-=10%",
        end: "top center",
        scrub: 1,
      },
    });

    tl.from(section, {
      css: { clipPath: "inset(0 100% 0 0)" },
      duration: 1.2,
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

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
    <section
      ref={sectionRef}
      className="bg-neural-fog text-rich-carbon overflow-hidden rounded-t-[20px] pt-[120px] pb-[200px] md:py-[220px]"
    >
      <div className="container" id="ethos">
        <div className="mb-[40px] grid grid-cols-1 gap-x-[24px] gap-y-[24px] md:mb-[60px] md:grid-cols-2">
          <div className="flex flex-col gap-[12px]">
            <h2 className="p2-mono">Our ethos</h2>
            <p className="h5 uppercase">
              Vision matters.
              <br />
              Velocity wins.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <p className="p1 border-rich-carbon/20 mb-[24px] border-t pt-[20px] md:mb-[32px]">
              One platform fabric powers everything we build. With security and identity
              that&apos;s shared, not rebuilt per project. With engineers who&apos;ve
              shipped under real stakes. With sovereignty that stays with the client, not
              us. This isn&apos;t a project shop. It&apos;s infrastructure built to
              outlast the first release.
            </p>
            <Button
              theme="dark"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("contact-modal:open", { detail: "#contact" })
                )
              }
            >
              Join Us
            </Button>
          </div>
        </div>

        <ul
          ref={listRef}
          className="group flex flex-col gap-[20px] md:flex-row md:gap-0"
          id="ethos-cards"
        >
          {CARDS.map((card) => {
            const isActive = activeCard === card.id;
            const liWidth = isActive
              ? "md:w-[40%]"
              : activeCard !== null
                ? "md:w-[20%]"
                : "md:w-[25%]";

            return (
              <li
                key={card.id}
                className={`w-full shrink-0 transition-[width] delay-100 duration-500 ease-(--easing) ${liWidth}`}
                onMouseEnter={() => setActiveCard(card.id)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div
                  className={`relative h-full w-full overflow-hidden rounded-[20px] transition-all delay-100 duration-500 ease-(--easing) ${
                    isActive ? "md:w-full" : "md:w-[125%]"
                  } ${card.surface}`}
                  id={`ethos-card-${card.id}`}
                >
                  <div className="flex size-full justify-center pt-[40px] pb-[20px] md:py-[40px]">
                    <div className="flex w-full flex-col items-center gap-[22px] px-[20px] text-center md:max-w-[300px] md:shrink-0 md:gap-[44px]">
                      <button
                        aria-controls={`ethos-card-${card.id}`}
                        aria-expanded={isActive}
                        onClick={() => setActiveCard(card.id)}
                        className="hidden md:block"
                      >
                        <SplitTextReveal
                          as="h3"
                          className="md:h5 h4 mx-auto max-w-[290px] uppercase"
                        >
                          {card.title}
                        </SplitTextReveal>
                      </button>
                      <h3 className="h4 md:h5 mx-auto max-w-[290px] uppercase md:hidden">
                        {card.title}
                      </h3>
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
                      <div className="p2-mono flex flex-col gap-[15px]">
                        <p>{card.counter}</p>
                        <p className="text-pretty">{card.body}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
