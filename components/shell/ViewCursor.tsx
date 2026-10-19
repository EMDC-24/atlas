"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Follows the pointer over grid items inside `[data-view-cursor-target]`,
 * reading "View" and flipping to "Hide" when the hovered item is already open
 * (`data-active="true"`).
 *
 * Ported from the original `viewCursor` Alpine component. Unlike DragCursor it
 * sets no xPercent/yPercent -- centring comes from the element's own
 * `-translate-x-1/2 -translate-y-1/2` classes.
 *
 * Gated behind gsap.matchMedia("(min-width: 768px)") to match the
 * `(pointer:fine) and (min-width:48rem)` rule that hides the native cursor;
 * below that breakpoint the native cursor stays and this must not appear.
 */
export default function ViewCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setSupported(false);
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const quickX = gsap.quickTo(el, "x", { duration: 0.3, ease: "power2.out" });
      const quickY = gsap.quickTo(el, "y", { duration: 0.3, ease: "power2.out" });

      const show = () =>
        gsap.to(el, { opacity: 1, scale: 1, duration: 0.2, ease: "power4.inOut" });
      const hide = () =>
        gsap.to(el, { opacity: 0, scale: 0.2, duration: 0.2, ease: "power4.inOut" });

      const updateText = (isActive: boolean) =>
        gsap.to(el.querySelectorAll("span"), {
          y: isActive ? "-100%" : "0%",
          duration: 0.3,
          ease: "power2.out",
        });

      const target = document.querySelector("[data-view-cursor-target]");
      if (!target) return;

      let activeItem: HTMLElement | null = null;
      const bound: Array<[Element, string, EventListener]> = [];
      const on = (t: Element, type: string, fn: EventListener) => {
        t.addEventListener(type, fn);
        bound.push([t, type, fn]);
      };

      target.querySelectorAll<HTMLElement>(".grid-item").forEach((item) => {
        on(item, "mouseenter", () => {
          activeItem = item;
          updateText(item.dataset.active === "true");
          show();
        });
        on(item, "mouseleave", () => {
          activeItem = null;
          hide();
        });
        // data-active flips on click; re-read it next frame so the label
        // reflects the new state while the pointer is still over the item.
        on(item, "click", () => {
          requestAnimationFrame(() => {
            if (activeItem === item) updateText(item.dataset.active === "true");
          });
        });
      });

      const onMouseMove = (e: Event) => {
        const { clientX, clientY } = e as MouseEvent;
        if (clientX === 0 && clientY === 0) return;
        quickX(clientX);
        quickY(clientY);
      };
      document.addEventListener("mousemove", onMouseMove);

      return () => {
        document.removeEventListener("mousemove", onMouseMove);
        bound.forEach(([t, type, fn]) => t.removeEventListener(type, fn));
      };
    });

    return () => mm.revert();
  }, []);

  if (!supported) return null;

  return (
    <div
      ref={ref}
      className="p3-mono bg-off-white text-rich-carbon pointer-events-none fixed z-50 flex h-[32px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full px-[16px] uppercase opacity-0"
    >
      <div className="relative flex w-full flex-col overflow-hidden text-center">
        <span className="whitespace-nowrap">View</span>
        <span aria-hidden="true" className="absolute top-full w-full whitespace-nowrap">
          Hide
        </span>
      </div>
    </div>
  );
}
