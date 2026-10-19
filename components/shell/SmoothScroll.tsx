"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/**
 * Wraps the app in GSAP ScrollSmoother, reproducing the original's structure:
 * the header, modals and loader live inside #smooth-wrapper but OUTSIDE
 * #smooth-content, so they stay fixed while only the page content is
 * transformed.
 *
 * Config values are the original's.
 *
 * ---------------------------------------------------------------------------
 * Note on the anchor handling below.
 *
 * The original bound a click handler to every <a> that called
 * `smoother.scrollTo(href.replace("/",""))` and then `preventDefault()`.
 * Because every href was an absolute URL, that produced an invalid selector
 * ("https:/www...") and scrollTo threw -- which, sitting before
 * preventDefault() in a comma expression, meant preventDefault never ran and
 * the browser navigated normally.
 *
 * In other words page navigation worked only because of a swallowed
 * exception. Replicating that verbatim would mean throwing on every click and
 * relying on Next's router losing the race. So this implements the observable
 * behaviour instead: in-page hashes smooth-scroll, everything else navigates.
 * ---------------------------------------------------------------------------
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: reduced ? 0.05 : 1.25,
      smoothTouch: !reduced,
      normalizeScroll: !reduced,
      effects: !reduced,
    });
    smootherRef.current = smoother;

    // Open off-site links in a new tab, as the original did.
    document.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
      const href = a.href;
      const offsite =
        (href.includes("http") || href.includes("mailto")) &&
        !href.includes("https://" + window.location.host);
      if (offsite) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // #main is the skip link -- it must keep its native focus behaviour.
      if (!href || !href.startsWith("#") || href === "#main") return;

      const el = document.querySelector(href);
      if (!el) return;

      // #founders sits flush to the top; everything else clears the header.
      smoother.scrollTo(el, true, href === "#founders" ? "top 0px" : "top 80px");
      e.preventDefault();
    };

    document.addEventListener("click", onClick);

    // Honour a hash in the URL on first paint.
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.querySelector("#" + CSS.escape(hash));
      if (el) smoother.scrollTo(el, true, "top 80px");
    }

    return () => {
      document.removeEventListener("click", onClick);
      smoother.kill();
      smootherRef.current = null;
    };
    // Rebuilt per route: ScrollSmoother caches content height and effects at
    // create time, so a client-side navigation needs a fresh instance.
  }, [pathname]);

  return (
    <div id="smooth-wrapper">
      {children}
    </div>
  );
}
