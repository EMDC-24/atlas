"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ScrollSmoother } from "gsap/ScrollSmoother";

import CornerAccents from "@/components/ui/CornerAccents";
import { LogoMark, LogoWordmark } from "@/components/ui/Logo";

/**
 * Fixed site header.
 *
 * Three scroll-driven states, all matching the original:
 *  -scrolled           past a quarter viewport: collapses to a pill, wordmark
 *                      swaps to the mark
 *  -translate-y-full   past a full viewport and scrolling down: hides
 *  -mobile-menu-open   menu panel open
 *
 * The 50px scroll threshold, and only updating lastScrollY once that threshold
 * is exceeded, are the original's -- it's what stops the header flickering on
 * small scroll jitter.
 */

const NAV_LINKS = [
  { label: "WHY ATLAS", href: "/why-wqf" },
  { label: "ABOUT", href: "/about" },
] as const;

const SCROLL_THRESHOLD = 50;

/** Opens the contact modal; listened for by the ContactModal component. */
function openContactModal() {
  window.dispatchEvent(new CustomEvent("contact-modal:open", { detail: "#contact" }));
}

/** Desktop link: a blurred dot slides in and the label rolls over on hover. */
function DesktopNavLink({ label, href, onClick }: { label: string; href: string; onClick?: () => void }) {
  const inner = (
    <div className="flex h-[40px] items-center px-[20px]">
      <div className="bg-neural-fog size-[10px] -translate-x-[24px] rounded-[3px] opacity-0 blur-[20px] transition-all duration-400 ease-(--easing) group-hover/link:-translate-x-[5px] group-hover/link:opacity-100 group-hover/link:blur-[0px] motion-reduce:hidden" />
      <div className="p2-mono relative isolate flex overflow-hidden transition-transform duration-400 ease-(--easing) motion-safe:-translate-x-[5px] motion-safe:group-hover/link:translate-x-[5px] motion-reduce:duration-[0ms]">
        <span className="transition-transform duration-400 ease-(--easing) motion-safe:group-hover/link:-translate-y-full motion-reduce:duration-[0ms]">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full transition-transform duration-400 ease-(--easing) motion-safe:group-hover/link:translate-y-0 motion-reduce:duration-[0ms]"
        >
          {label}
        </span>
      </div>
    </div>
  );

  const className = "group/link motion-safe:hover:animate-glitch-hover relative isolate";

  if (onClick) {
    return (
      <a
        className={className}
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {inner}
    </Link>
  );
}

function MobileNavLink({
  label,
  href,
  className = "relative isolate",
  onClick,
  // Only the Contact entry suppresses navigation -- it opens a modal instead.
  // Real nav links must keep their default behaviour and merely close the menu.
  preventNavigation = false,
}: {
  label: string;
  href: string;
  className?: string;
  onClick?: () => void;
  preventNavigation?: boolean;
}) {
  const inner = (
    <div className="flex h-[60px] items-center justify-center text-center">
      <span className="p3-mono">{label}</span>
    </div>
  );

  return (
    <li className={className}>
      {preventNavigation ? (
        <a
          className="w-full text-center"
          href={href}
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
          }}
        >
          {inner}
        </a>
      ) : (
        <Link className="w-full text-center" href={href} onClick={onClick}>
          {inner}
        </Link>
      )}
      <CornerAccents />
    </li>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hover indicator that tracks the width/offset of the hovered nav item.
  const [indicator, setIndicator] = useState({ width: 0, offset: 0 });

  const lastScrollY = useRef(0);
  const windowHeight = useRef(0);
  const mobileMenuOpenRef = useRef(false);
  const navRef = useRef<HTMLElement>(null);

  mobileMenuOpenRef.current = mobileMenuOpen;

  useEffect(() => {
    windowHeight.current = window.innerHeight;

    const onScroll = () => {
      // Frozen while the menu is open, so the header can't slide away under it.
      if (mobileMenuOpenRef.current) return;

      const currentScrollY = window.scrollY;
      const pastQuarterViewport = currentScrollY > windowHeight.current / 4;
      const pastFullViewport = currentScrollY > windowHeight.current;

      const scrollDelta = currentScrollY - lastScrollY.current;
      const scrollingDown = scrollDelta > SCROLL_THRESHOLD;
      const scrollingUp = scrollDelta < -SCROLL_THRESHOLD;

      setScrolled(pastQuarterViewport);

      if (pastFullViewport) {
        if (scrollingDown) setHidden(true);
        else if (scrollingUp) setHidden(false);
      } else {
        setHidden(false);
      }

      // Only re-baseline once past the threshold -- this is what gives the
      // hide/show its hysteresis.
      if (Math.abs(scrollDelta) > SCROLL_THRESHOLD) {
        lastScrollY.current = currentScrollY;
      }
    };

    const onResize = () => {
      windowHeight.current = window.innerHeight;
      if (mobileMenuOpenRef.current && window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Freeze smooth scrolling behind the mobile menu.
  useEffect(() => {
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.paused(mobileMenuOpen);
  }, [mobileMenuOpen]);

  // Escape closes the menu (Alpine's x-trap gave this for free).
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const handleContact = useCallback(() => {
    setMobileMenuOpen(false);
    // Next tick, so the menu's close transition starts before the modal opens.
    requestAnimationFrame(openContactModal);
  }, []);

  const onLinkHover = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const li = e.currentTarget;
    setIndicator({ width: li.offsetWidth, offset: li.offsetLeft });
  }, []);

  return (
    <header
      className={[
        "layout--header group fixed top-0 isolate z-50 flex w-full items-center transition-transform duration-400 ease-(--easing) motion-reduce:duration-[0ms] lg:h-(--header-height) lg:overflow-hidden",
        scrolled ? "-scrolled" : "",
        mobileMenuOpen ? "-mobile-menu-open" : "",
        hidden ? "-translate-y-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-full lg:container">
        <div className="lg:group-[.-scrolled]:bg-urban-smoke group-[.-scrolled]:bg-rich-carbon group-[.-mobile-menu-open]:bg-rich-carbon relative isolate mx-auto flex h-(--header-height) w-fit grow items-center justify-between gap-[20px] bg-transparent px-[10px] transition-all duration-600 ease-(--easing) motion-reduce:duration-[0ms] lg:h-auto lg:px-0 lg:group-[.-scrolled]:w-fit lg:group-[.-scrolled]:grow-0 lg:group-[.-scrolled]:rounded-[8px] lg:group-[.-scrolled]:px-[12px] lg:group-[.-scrolled]:py-[4px]">
          <Link
            aria-label="Atlas Intelligence"
            className="relative isolate h-[30px] w-[120px] shrink-0 overflow-hidden transition-[width] duration-600 ease-(--easing) group-[.-scrolled]:w-[30px] motion-reduce:duration-[0ms]"
            href="/"
          >
            <LogoWordmark className="h-auto w-full transition-transform duration-600 motion-reduce:duration-[0ms] ease-(--easing) group-[.-scrolled]:-translate-y-full" />
            <LogoMark className="absolute top-0 left-0 h-auto w-[30px] translate-y-full transition-transform duration-600 motion-reduce:duration-[0ms] ease-(--easing) group-[.-scrolled]:translate-y-0" />
          </Link>

          <nav ref={navRef} className="group/links relative isolate hidden lg:block">
            <ul className="flex items-center">
              {NAV_LINKS.map((l) => (
                <li key={l.href} onMouseEnter={onLinkHover}>
                  <DesktopNavLink label={l.label} href={l.href} />
                </li>
              ))}
              <li onMouseEnter={onLinkHover}>
                <DesktopNavLink label="Contact" href="#contact" onClick={handleContact} />
              </li>
            </ul>

            {/* Frame that slides between nav items on hover. */}
            <div
              className="pointer-events-none absolute top-0 left-0 h-full w-full opacity-0 transition-[width,left,opacity] duration-400 ease-(--easing) group-hover/links:opacity-40 group-has-active/links:opacity-100 motion-reduce:hidden"
              style={{ width: `${indicator.width}px`, left: `${indicator.offset}px` }}
            >
              <CornerAccents className="size-[9px] corner-accent transition-opacity ease-(--easing) duration-400 group-active/link:opacity-100" />
            </div>
          </nav>

          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
            className="relative isolate flex size-[40px] items-center justify-center lg:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <div className="bg-neural-fog size-[10px] rounded-[3px]" />
            <CornerAccents className="size-[9px] corner-accent duration-400 opacity-40 group-[.-mobile-menu-open]:rotate-180 transition-transform ease-(--easing)" />
          </button>

          {/* Mobile panel. Kept mounted and driven by classes so the enter and
              leave transitions both play, as Alpine's x-transition did. */}
          <div
            className={[
              "bg-rich-carbon/1 absolute top-full left-0 h-[calc(100dvh-var(--header-height))] w-full backdrop-blur-[10px] transition-opacity duration-400 lg:hidden",
              mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
            onClick={() => setMobileMenuOpen(false)}
          >
            <ul
              className={[
                "bg-rich-carbon border-off-white/20 grid grid-cols-2 border-b px-[10px] py-[12px] transition-[clip-path] duration-400 ease-(--easing)",
                mobileMenuOpen
                  ? "delay-100 [clip-path:inset(0_0_0_0)]"
                  : "[clip-path:inset(0_0_100%_0)]",
              ].join(" ")}
              onClick={(e) => e.stopPropagation()}
            >
              {NAV_LINKS.map((l) => (
                <MobileNavLink
                  key={l.href}
                  label={l.label}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              <MobileNavLink
                label="Contact"
                href="#contact"
                className="relative isolate col-span-2 mt-[24px]"
                onClick={handleContact}
                preventNavigation
              />
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
