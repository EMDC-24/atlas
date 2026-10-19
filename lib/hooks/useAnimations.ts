"use client";

import { useEffect, useRef } from "react";

import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from "@/lib/gsap";

/**
 * The three reveal behaviours used across every page, ported from the
 * `fadeIn`, `splitTextReveal` and `sticky` Alpine components.
 *
 * A shared convention in all three: when `scrollTriggered` is false the element
 * is first forced to opacity 1. Elements start at opacity-0 in the markup so
 * they don't flash before JS runs; a non-scroll-triggered reveal has to undo
 * that immediately, since no ScrollTrigger will ever fire to do it.
 */

/** Fades in from transparent. `gsap.from`, so the resting state is the markup's. */
export function useFadeIn<T extends HTMLElement>(scrollTriggered = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!scrollTriggered) gsap.set(el, { opacity: 1 });
    if (prefersReducedMotion()) return;

    const tween = gsap.from(el, {
      opacity: 0,
      duration: 0.8,
      ease: "power3.inOut",
      ...(scrollTriggered && {
        scrollTrigger: { trigger: el, start: "top 70%" },
      }),
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scrollTriggered]);

  return ref;
}

/**
 * Splits text into lines and slides each up from behind a mask.
 *
 * `autoSplit` re-splits on resize/font load, and the split is reverted on
 * complete so the DOM is left clean (and text stays selectable/readable).
 */
export function useSplitTextReveal<T extends HTMLElement>(scrollTriggered = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!scrollTriggered) gsap.set(el, { opacity: 1 });
    if (prefersReducedMotion()) return;

    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.4,
          stagger: 0.08,
          ease: "expo.out",
          ...(scrollTriggered && {
            scrollTrigger: { trigger: el, start: "top 70%" },
          }),
          onComplete: () => self.revert(),
        }),
    });

    return () => {
      split.revert();
    };
  }, [scrollTriggered]);

  return ref;
}

/**
 * Pins an element for the height of its parent.
 *
 * `end` is a function so it re-measures on refresh -- with `invalidateOnRefresh`
 * this keeps the pin correct when fonts load or the viewport changes.
 */
export function useSticky<T extends HTMLElement>(desktopOnly = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add(desktopOnly ? "(min-width: 768px)" : "(min-width: 1px)", () => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: (self) => {
          const pin = self.pin as HTMLElement | undefined;
          const parentHeight = el.parentElement?.offsetHeight ?? 0;
          return "+=" + (parentHeight - (pin?.offsetHeight ?? 0));
        },
        pin: el,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, [desktopOnly]);

  return ref;
}
