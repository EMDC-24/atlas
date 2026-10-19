"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CornerAccents from "@/components/ui/CornerAccents";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { createFocusIndustriesScene } from "@/lib/webgl/scenes/focusIndustries";

/**
 * "Our focus" + the industries list, sharing one pinned WebGL backdrop.
 *
 * `#focus-industries` is the scroll container for two pinned layers:
 *  - the canvas wrapper, pinned with `scrub: true` for the whole block
 *  - a desktop-only gradient veil, pinned only while the first screen is in
 *    view (`end: 'bottom top'`), which fades the torus into the page at the
 *    top and bottom edges
 *
 * The industries list draws a single set of corner brackets that travel to
 * whichever row is active. Its geometry can't be derived from CSS because the
 * row is mid-transition when the pointer lands, so the brackets re-measure the
 * row every frame for 300ms (after a 200ms lead-in) and follow it as it grows.
 */

const INDUSTRIES = [
  {
    title: "Civil Security",
    body: "Decision-intelligence for investigation, monitoring, and operational response, built for teams who can't afford to miss a signal.",
  },
  {
    title: "Financial Crime & Banking",
    body: "Unified signal layers and investigative workflows that give banks and regulators one place to see, route, and act.",
  },
  {
    title: "Critical Infrastructure",
    body: "Systems integration and long-run managed operations for the infrastructure that can't go down.",
  },
  {
    title: "Regulatory Bodies",
    body: "Audit and accountability built into the platform, not bolted on after the fact.",
  },
  {
    title: "Telecommunications",
    body: "Enterprise data platforms that connect every system of record into one living ontology.",
  },
  {
    title: "Energy",
    body: "Applied AI and cloud infrastructure for operators running assets at national scale.",
  },
  {
    title: "Agriculture",
    body: "Predictive systems that turn field and herd data into decisions farmers can act on.",
  },
  {
    title: "Education",
    body: "AI-driven learning platforms built to scale expertise, not just distribute content.",
  },
  {
    title: "Logistics & Hospitality",
    body: "CRM and operations platforms that keep fast-moving fleets and properties running on schedule.",
  },
];

const CANVAS_MASK =
  "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)";

/** How long the brackets keep re-measuring the row they're tracking. */
const TRACK_DURATION = 300;
/** Lead-in before tracking starts, so the row's own transition is underway. */
const TRACK_DELAY = 200;

interface BracketBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export default function HomeFocusIndustries() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const focusRef = useRef<HTMLElement>(null);
  const preheadingRef = useRef<HTMLHeadingElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const industriesRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [activeLink, setActiveLink] = useState<number | null>(null);
  const [box, setBox] = useState<BracketBox>({ width: 0, height: 0, left: 0, top: 0 });

  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileRef = useRef(false);
  const activeRef = useRef<number | null>(null);

  // The particle torus, pinned behind both sections.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !wrapper) return;

    const scene = createFocusIndustriesScene(canvas);
    scene.init();

    const st = ScrollTrigger.create({
      trigger: "#focus-industries",
      start: "top top",
      end: "bottom bottom",
      pin: wrapper,
      pinSpacing: false,
      scrub: true,
    });

    return () => {
      st.kill();
      scene.destroy();
    };
  }, []);

  // Desktop-only gradient veil, pinned for the height of the first screen.
  useEffect(() => {
    const veil = veilRef.current;
    if (!veil) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const st = ScrollTrigger.create({
        trigger: "#focus-industries",
        start: "top top",
        end: "bottom top",
        pin: veil,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    const section = focusRef.current;
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top 50%" },
    });

    tl.from([preheadingRef.current, headingRef.current, descriptionRef.current], {
      opacity: 0,
      y: 64,
      ease: "power4.inOut",
      duration: 1.2,
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const section = industriesRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const tween = gsap.from(content, {
      opacity: 0,
      y: 80,
      duration: 1.2,
      ease: "power4.inOut",
      scrollTrigger: { trigger: section, start: "top 60%" },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const cancelTracking = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * The +30/-60 offsets inset the brackets into the row's expanded padding
   * (`data-active:py-[60px]`) so they frame the text rather than the whole row.
   */
  const measure = useCallback((link: HTMLElement) => {
    const list = listRef.current;
    if (!list) return;
    setBox({
      width: link.offsetWidth,
      height: link.offsetHeight - 60,
      left: list.offsetLeft + link.offsetLeft,
      top: list.offsetTop + link.offsetTop + 30,
    });
  }, []);

  const setActive = useCallback(
    (index: number) => {
      const target = index - 1;
      activeRef.current = target;
      setActiveLink(target);
      cancelTracking();

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        const link = listRef.current?.querySelectorAll("li")[target] as
          | HTMLElement
          | undefined;
        if (!link) return;

        const start = Date.now();
        const step = () => {
          measure(link);
          if (Date.now() - start < TRACK_DURATION) {
            frameRef.current = requestAnimationFrame(step);
          } else {
            frameRef.current = null;
          }
        };
        step();
      }, TRACK_DELAY);
    },
    [cancelTracking, measure]
  );

  const clearActive = useCallback(() => {
    activeRef.current = null;
    setActiveLink(null);
    cancelTracking();
  }, [cancelTracking]);

  const handleHover = useCallback(
    (index: number) => {
      if (!isMobileRef.current) setActive(index);
    },
    [setActive]
  );

  const handleClick = useCallback(
    (index: number) => {
      if (activeRef.current === index - 1) clearActive();
      else setActive(index);
    },
    [clearActive, setActive]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isMobileRef.current) clearActive();
  }, [clearActive]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    // Seed the brackets on the first row. Note the initial height is the row's
    // full height -- the -60 inset only applies once tracking starts.
    const first = list.querySelectorAll("li")[0] as HTMLElement | undefined;
    if (first) {
      setBox({
        width: first.offsetWidth,
        height: first.offsetHeight,
        left: list.offsetLeft + first.offsetLeft,
        top: list.offsetTop + first.offsetTop + 30,
      });
    }

    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };

    checkMobile();
    // Mobile has no hover, so the first row is opened by default.
    if (isMobileRef.current) setActive(1);

    const onResize = () => {
      checkMobile();
      if (isMobileRef.current) setActive(1);
      else clearActive();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelTracking();
    };
  }, [cancelTracking, clearActive, setActive]);

  return (
    <div className="relative isolate -mt-[2px] overflow-hidden" id="focus-industries">
      <div ref={canvasWrapperRef} className="absolute inset-0 -z-1 size-full">
        <canvas
          ref={canvasRef}
          className="size-full"
          style={{ maskImage: CANVAS_MASK, WebkitMaskImage: CANVAS_MASK }}
        />
      </div>

      <div
        ref={veilRef}
        className="from-neural-fog to-neural-fog pointer-events-none absolute inset-0 z-1 hidden h-screen w-full bg-linear-to-b via-transparent md:block"
      />

      <section
        ref={focusRef}
        className="flex h-dvh items-center overflow-hidden"
        id="focus"
      >
        <div className="container text-center">
          <div className="mx-auto flex max-w-[895px] flex-col items-center gap-[30px]">
            <div className="flex flex-col gap-[12px]">
              <h2 ref={preheadingRef} className="p1-mono">
                Our focus
              </h2>
              <h3 ref={headingRef} className="h2 uppercase">
                Systems that can&apos;t fail. Sectors that can&apos;t wait.
              </h3>
            </div>
            <p
              ref={descriptionRef}
              className="p3 md:p1 max-w-[305px] md:max-w-[550px]"
            >
              Government departments, banks, telecoms, industrial groups: these
              aren&apos;t organisations that can experiment with failure. They run on
              systems that have to work every time. We build for that standard.
            </p>
          </div>
        </div>
      </section>

      <section
        ref={industriesRef}
        className="-mt-px min-h-dvh py-[40px] md:py-[100px]"
        id="industries"
      >
        <div ref={contentRef} className="relative container">
          <ul ref={listRef} className="relative isolate flex flex-col items-center text-center">
            {INDUSTRIES.map((industry, index) => {
              const isActive = activeLink === index;
              return (
                <li
                  key={industry.title}
                  data-active={isActive ? "true" : undefined}
                  onMouseEnter={() => handleHover(index + 1)}
                  onMouseLeave={handleMouseLeave}
                  className="group grid grid-rows-[auto_0fr] px-[40px] py-[10px] text-center transition-[grid-template-rows,padding] duration-500 ease-(--easing) data-active:grid-rows-[auto_1fr] data-active:py-[60px] motion-reduce:duration-[0ms] md:py-0"
                >
                  <button
                    aria-expanded={isActive}
                    onClick={() => handleClick(index + 1)}
                    aria-controls={`industry-content-${index + 1}`}
                    className="relative isolate w-full overflow-hidden md:cursor-default"
                  >
                    <h3 className="h4 min-[360px]:h-vw uppercase transition-transform duration-500 ease-(--easing) group-data-active:-translate-y-full motion-reduce:duration-[0ms]">
                      {industry.title}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="h4 min-[360px]:h-vw absolute inset-0 translate-y-full uppercase transition-transform duration-500 ease-(--easing) group-data-active:translate-y-0 motion-reduce:duration-[0ms]"
                    >
                      {industry.title}
                    </span>
                  </button>
                  <div
                    className="flex justify-center overflow-hidden"
                    id={`industry-content-${index + 1}`}
                  >
                    <p className="p2 max-w-[430px] pt-[4px] ease-(--easing) motion-reduce:duration-[0ms]">
                      {industry.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className={`pointer-events-none absolute top-0 left-0 h-full w-full transition-[width,left,top,height,opacity,transform,scale] duration-500 ease-(--easing) motion-reduce:hidden ${
              activeLink !== null
                ? "opacity-100 scale-100 blur-none"
                : "opacity-0 scale-200 blur-[10px]"
            }`}
            style={{
              width: `${box.width}px`,
              height: `${box.height}px`,
              left: `${box.left}px`,
              top: `${box.top}px`,
            }}
          >
            <CornerAccents className="md:size-[32px] size-[20px] corner-accent text-pulse-ash ease-(--easing) duration-400" />
          </div>
        </div>
      </section>
    </div>
  );
}
