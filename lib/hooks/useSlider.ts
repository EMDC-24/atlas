"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";

export interface SliderState {
  ready: boolean;
  activeIndex: number;
  isBeginning: boolean;
  isEnd: boolean;
  allowSlideNext: boolean;
  allowSlidePrev: boolean;
  /** True when every slide fits, so navigation should be hidden/disabled. */
  isLocked: boolean;
}

/**
 * Swiper wrapper ported from the `slider` Alpine component.
 *
 * Two details carried over deliberately:
 *  - `sliderMove` re-broadcasts the pointer as `drag-cursor:move`, because the
 *    browser stops firing mousemove mid-drag and the custom cursor would
 *    otherwise freeze.
 *  - `update()` is called inside rAF after init and after each transition;
 *    Swiper can mis-measure while layout is still settling.
 */
export function useSlider(options: SwiperOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<Swiper | null>(null);

  const [state, setState] = useState<SliderState>({
    ready: false,
    activeIndex: 0,
    isBeginning: true,
    isEnd: false,
    allowSlideNext: true,
    allowSlidePrev: true,
    isLocked: false,
  });

  // Options are typically an inline literal; a ref keeps them out of the deps
  // so the slider isn't torn down and rebuilt on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sync = (s: Swiper) =>
      setState((prev) => ({
        ...prev,
        activeIndex: s.activeIndex,
        isBeginning: s.isBeginning,
        isEnd: s.isEnd,
        allowSlideNext: s.allowSlideNext,
        allowSlidePrev: s.allowSlidePrev,
        isLocked: s.isLocked,
      }));

    let onSetup: (() => void) | null = null;

    const swiper = new Swiper(el, {
      keyboard: { enabled: true, onlyInViewport: true },
      ...optionsRef.current,
      observer: true,
      observeParents: true,
      on: {
        sliderMove: (_s, event) => {
          document.dispatchEvent(
            new CustomEvent("drag-cursor:move", { detail: event })
          );
        },
        afterInit: (s) => {
          setState((prev) => ({ ...prev, ready: true }));
          onSetup = () => setState((prev) => ({ ...prev, isLocked: s.isLocked }));
          window.addEventListener("drag-cursor:setup", onSetup);
          requestAnimationFrame(() => {
            s.update();
            sync(s);
          });
        },
        slideChange: (s) => sync(s),
        transitionEnd: (s) => {
          requestAnimationFrame(() => s.update());
        },
      },
    });

    swiperRef.current = swiper;

    return () => {
      if (onSetup) window.removeEventListener("drag-cursor:setup", onSetup);
      swiper.destroy(true, true);
      swiperRef.current = null;
    };
  }, []);

  const prev = useCallback(() => swiperRef.current?.slidePrev(), []);
  const next = useCallback(() => swiperRef.current?.slideNext(), []);
  const slideTo = useCallback((i: number) => swiperRef.current?.slideTo(i), []);

  return { containerRef, swiper: swiperRef, ...state, prev, next, slideTo };
}

/** Zero-pads slide numbers for the "01 / 04" counters. */
export function pad(n: number) {
  return n.toString().padStart(2, "0");
}
