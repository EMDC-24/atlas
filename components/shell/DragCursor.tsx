"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Follows the pointer over sliders, reading "Drag" and swapping to
 * "Go to website" when hovering a link that leaves the site.
 *
 * Ported from the original `dragCursor` Alpine component; durations, eases and
 * the 135px expanded width are the original's.
 *
 * Sliders are bound lazily and re-bound on the `drag-cursor:setup` event, since
 * Swiper can create slides after this mounts. The `drag-cursor:move` event lets
 * a slider drive the cursor while dragging, when the browser stops emitting
 * mousemove.
 */
export default function DragCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // The original removes the element outright on touch/coarse pointers.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setSupported(false);
      return;
    }

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const quickX = gsap.quickTo(el, "x", { duration: 0.3, ease: "power2.out" });
    const quickY = gsap.quickTo(el, "y", { duration: 0.3, ease: "power2.out" });

    const show = () =>
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.2, ease: "power4.inOut" });
    const hide = () =>
      gsap.to(el, { opacity: 0, scale: 0.2, duration: 0.2, ease: "power4.inOut" });

    const spans = () => el.querySelectorAll("span");

    const animateToVisit = () => {
      gsap.to(el, { width: 135, duration: 0.3, ease: "power2.out" });
      gsap.to(spans(), { y: "-100%", duration: 0.3, ease: "power2.out" });
    };
    const animateToDrag = () => {
      gsap.to(el, { width: "auto", duration: 0.3, ease: "power2.out" });
      gsap.to(spans(), { y: "0%", duration: 0.3, ease: "power2.out" });
    };

    const isExternalUrl = (href: string) =>
      (href.includes("http") || href.includes("mailto")) &&
      !href.includes("https://" + window.location.host);

    let isExternalLink = false;

    // Track every listener so we can detach cleanly on unmount.
    const bound: Array<[Element, string, EventListener]> = [];
    const on = (target: Element, type: string, fn: EventListener) => {
      target.addEventListener(type, fn);
      bound.push([target, type, fn]);
    };

    const bindSlides = (root: ParentNode = document) => {
      root.querySelectorAll(".swiper .swiper-slide").forEach((slide) => {
        // Slides persist across re-binds; don't stack duplicate listeners.
        if ((slide as HTMLElement).dataset.dragCursorBound === "true") return;
        (slide as HTMLElement).dataset.dragCursorBound = "true";

        on(slide, "mouseenter", show as EventListener);
        on(slide, "mouseleave", hide as EventListener);

        slide.querySelectorAll("a[href]").forEach((link) => {
          on(link, "mouseenter", () => {
            const href = link.getAttribute("href");
            if (href && isExternalUrl(href)) {
              isExternalLink = true;
              animateToVisit();
            }
          });
          on(link, "mouseleave", () => {
            if (isExternalLink) {
              isExternalLink = false;
              animateToDrag();
            }
          });
        });

        slide.querySelectorAll("button").forEach((btn) => {
          on(btn, "mouseenter", hide as EventListener);
          on(btn, "mouseleave", show as EventListener);
        });

        slide.querySelectorAll(".cursor--hide").forEach((node) => {
          on(node, "mouseenter", hide as EventListener);
          on(node, "mouseleave", show as EventListener);
        });
      });
    };

    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      // Ignore the synthetic 0,0 event some browsers fire.
      if (e.clientX === 0 && e.clientY === 0) return;
      quickX(e.clientX);
      quickY(e.clientY);
    };

    bindSlides();

    const onSetup = () => bindSlides();
    const onMove = (e: Event) => handleMouseMove((e as CustomEvent).detail);
    const onMouseMove = (e: Event) => handleMouseMove(e as MouseEvent);

    window.addEventListener("drag-cursor:setup", onSetup);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onMouseMove);
    document.addEventListener("drag-cursor:move", onMove);

    return () => {
      window.removeEventListener("drag-cursor:setup", onSetup);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("drag-cursor:move", onMove);
      bound.forEach(([t, type, fn]) => t.removeEventListener(type, fn));
      document
        .querySelectorAll<HTMLElement>(".swiper .swiper-slide")
        .forEach((s) => delete s.dataset.dragCursorBound);
    };
  }, []);

  if (!supported) return null;

  return (
    <div
      ref={ref}
      className="p3-mono bg-rich-carbon text-off-white pointer-events-none fixed top-0 left-0 z-1000 flex h-[32px] items-center justify-center overflow-hidden rounded-full px-[16px] uppercase opacity-0"
    >
      <div className="relative flex w-full flex-col overflow-hidden text-center">
        <span className="whitespace-nowrap">Drag</span>
        <span aria-hidden="true" className="absolute top-full w-full whitespace-nowrap">
          Go to website
        </span>
      </div>
    </div>
  );
}
