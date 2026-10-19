"use client";

/**
 * Single place where GSAP plugins are registered.
 *
 * Registering more than once is harmless, but importing from here keeps the
 * plugin set in one spot and guarantees anything using ScrollTrigger/SplitText
 * has actually registered them first.
 *
 * All of these ship free in GSAP 3.13+.
 */
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, Flip, Observer);

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, Flip, Observer };

/** The site treats reduced-motion as "skip the animation entirely". */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
