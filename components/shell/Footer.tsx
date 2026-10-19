"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import CornerAccents from "@/components/ui/CornerAccents";
import { createFooterScene } from "@/lib/webgl/scenes/footerScene";

/**
 * Site footer.
 *
 * Two columns on desktop: a WebGL canvas on the left and the infrared panel on
 * the right. The canvas is `hidden lg:block`, so the scene only ever exists at
 * desktop widths -- on mobile the panel is the whole footer.
 *
 * The original was `x-data="footer"`:
 *
 *   init()    { this.scene = footerScene(this.$refs.canvas); this.scene.init() }
 *   destroy() { this.scene.destroy() }
 *
 * Contact is dispatched as a window event rather than wired directly, matching
 * Alpine's `$dispatch('contact-modal:open', '#contact')` -- the modal lives
 * elsewhere in the tree and listens on the window.
 */

/** Opens the contact modal; listened for by the ContactModal component. */
function openContactModal() {
  window.dispatchEvent(new CustomEvent("contact-modal:open", { detail: "#contact" }));
}

const NAV_LINKS = [
  { label: "WHY ATLAS", href: "/why-wqf" },
  { label: "ABOUT", href: "/about" },
] as const;

const ATLAS_PRODUCT_LINKS = [
  { label: "Sentinel", href: "/why-wqf#partners" },
  { label: "Forge", href: "/why-wqf#partners" },
  { label: "Compass", href: "/why-wqf#founders" },
  { label: "Studio", href: "/why-wqf#founders" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms and Conditions", href: "/legal/terms-and-conditions" },
  { label: "Cookie Policy", href: "/legal/cookie-policy" },
] as const;

/** Inner markup of a primary footer nav link -- blurred dot + rolling label. */
function NavLinkInner({ label }: { label: string }) {
  return (
    <>
      <div className="bg-rich-carbon -mt-[3.5px] size-[25px] -translate-x-full rounded-[8px] opacity-0 blur-[32px] transition-[transform,translate,opacity,filter] duration-500 ease-(--easing) group-hover/button:translate-x-0 group-hover/button:opacity-100 group-hover/button:blur-[0px]" />
      <div className="relative isolate flex -translate-x-[33px] overflow-hidden transition-transform duration-500 ease-(--easing) group-hover/button:translate-x-0">
        <span className="transition-transform duration-500 ease-(--easing) group-hover/button:-translate-y-full">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full transition-transform duration-500 ease-(--easing) group-hover/button:translate-y-0"
        >
          {label}
        </span>
      </div>
    </>
  );
}

/** Smaller variant used by the "Atlas products" list. */
function SmallNavLinkInner({ label }: { label: string }) {
  return (
    <>
      <div className="bg-rich-carbon -mt-[3.5px] size-[16px] -translate-x-full rounded-[4px] opacity-0 blur-[32px] transition-[transform,translate,opacity,filter] duration-500 ease-(--easing) group-hover/button:translate-x-0 group-hover/button:opacity-100 group-hover/button:blur-[0px]" />
      <div className="relative isolate flex -translate-x-[24px] overflow-hidden transition-transform duration-500 ease-(--easing) group-hover/button:translate-x-0">
        <span className="transition-transform duration-500 ease-(--easing) group-hover/button:-translate-y-full">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full transition-transform duration-500 ease-(--easing) group-hover/button:translate-y-0"
        >
          {label}
        </span>
      </div>
    </>
  );
}

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The rippling tube behind the footer. The scene's own init() no-ops below
  // 1024px (the canvas is `hidden` until lg), so it's safe to create here
  // unconditionally; destroy() still runs on unmount either way.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createFooterScene(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <footer id="footer">
      <div className="container px-0!">
        <div className="bg-rich-carbon relative grid lg:grid-cols-2">
          <canvas ref={canvasRef} className="hidden size-full lg:block" />

          <div className="bg-infrared text-rich-carbon grid w-full grid-cols-2 gap-[12px] gap-y-[60px] rounded-t-[20px] px-[10px] pt-[30px] pb-[10px] md:min-h-[666px] md:gap-[32px] md:gap-y-[210px] md:rounded-bl-[20px] md:pt-[40px] md:pb-[30px] lg:px-[24px] xl:px-[40px]">
            <div className="flex w-full flex-col items-start justify-start gap-[12px]">
              <h2 className="h6 uppercase">Building what&rsquo;s next.</h2>
              <p className="p2-mono mb-auto">
                Government technology. Enterprise platforms. Intelligent products. Reach
                out, and let&#039;s build.
              </p>
              <div className="mt-[18px] w-full max-w-[200px] md:mt-0 [&_button]:w-full">
                <button
                  aria-label=""
                  className="group/button hover:animate-glitch-hover relative isolate motion-reduce:hover:animate-none"
                  data-theme="dark"
                  onClick={openContactModal}
                >
                  <div className="flex h-[40px] items-center justify-center px-[20px]">
                    <div className="group-data-[theme=light]/button:bg-neural-fog group-data-[theme=dark]/button:bg-rich-carbon motion-reduce:blur-0 button--dot size-[10px] -translate-x-[24px] rounded-[3px] opacity-0 blur-[20px] transition-all duration-400 ease-(--easing) group-hover/button:-translate-x-[5px] group-hover/button:opacity-100 group-hover/button:blur-[0px] group-active/button:-translate-x-[5px] group-active/button:opacity-100 group-active/button:blur-[0px] motion-reduce:hidden motion-reduce:translate-x-0 motion-reduce:opacity-0 motion-reduce:group-hover/button:translate-x-0 motion-reduce:group-hover/button:opacity-0" />
                    <div className="p2-mono group-data-[theme=light]/button:text-neural-fog group-data-[theme=dark]/button:text-rich-carbon relative isolate flex -translate-x-[5px] overflow-hidden transition-transform duration-400 ease-(--easing) group-hover/button:translate-x-[5px] group-active/button:translate-x-[5px] motion-reduce:translate-x-0 motion-reduce:group-hover/button:translate-x-0">
                      <span className="transition-transform duration-400 ease-(--easing) group-hover/button:-translate-y-full group-active/button:-translate-y-full motion-reduce:translate-y-0 motion-reduce:group-hover/button:translate-y-0">
                        Contact Us
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 translate-y-full transition-transform duration-400 ease-(--easing) group-hover/button:translate-y-0 group-active/button:translate-y-0 motion-reduce:hidden"
                      >
                        Contact Us
                      </span>
                    </div>
                  </div>
                  <CornerAccents className="size-[9px] corner-accent transition-opacity ease-(--easing) duration-400 group-active/button:opacity-100 group-data-[theme=light]/button:text-neural-fog group-data-[theme=dark]/button:text-rich-carbon motion-reduce:opacity-100 motion-reduce:transition-none" />
                </button>
              </div>
            </div>

            <div className="ml-auto max-w-[90px] md:order-1 md:col-start-2 md:ml-0 md:max-w-full md:items-end md:gap-0">
              <svg
                aria-hidden="true"
                className="w-full h-auto max-h-[290px] aspect-square footer--emblem object-bottom block"
                fill="none"
                height="16"
                viewBox="0 0 16 16"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(0.83 1.92) scale(1.02)">
                  <path
                    d="M14.39,11.78c.03,.09,.02,.18-.04,.26-.06,.08-.14,.12-.24,.12h-2.03c-.19,0-.31-.09-.36-.26L8.58,3.09c-.1-.3-.29-.55-.56-.74-.27-.19-.57-.29-.9-.29s-.63,.1-.89,.29-.44,.44-.55,.76L2.63,11.9c-.06,.17-.18,.26-.37,.26H.3c-.1,0-.19-.04-.24-.12-.06-.08-.07-.17-.03-.26L3.25,2.78c.15-.42,.36-.8,.63-1.14,.27-.34,.57-.63,.91-.88s.72-.43,1.13-.56c.41-.13,.84-.2,1.28-.2s.87,.07,1.28,.2c.41,.13,.79,.32,1.14,.56,.35,.24,.65,.54,.91,.88,.26,.34,.47,.72,.62,1.14l3.25,9Z"
                    fill="currentColor"
                  />
                </g>
              </svg>
            </div>

            <nav className="order-1 col-span-2 flex flex-col gap-[32px] md:order-2 md:col-span-1 md:justify-end">
              <ul className="flex flex-col gap-[4px]">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="group/button h5 relative isolate flex items-center gap-[8px] uppercase"
                      href={link.href}
                    >
                      <NavLinkInner label={link.label} />
                    </Link>
                  </li>
                ))}
                <li>
                  {/* Source is a bare anchor here -- no $dispatch, unlike the
                      "Contact Us" button above. Kept as-is. */}
                  <a
                    className="group/button h5 relative isolate flex items-center gap-[8px] uppercase"
                    href="#contact"
                  >
                    <NavLinkInner label="Contact" />
                  </a>
                </li>
              </ul>

              <div className="hidden md:block">
                <p className="p3-mono text-rich-carbon/60">
                  Copyright &copy; 2026 Atlas Intelligence (Pvt.) Ltd.
                </p>
              </div>
            </nav>

            <div className="contents flex-col items-end gap-[40px] md:order-3 md:flex md:justify-between">
              <div className="order-3 flex w-full flex-col gap-[10px] md:order-1">
                <p className="p3-mono">Atlas products</p>
                <ul className="flex flex-col gap-[4px]">
                  {ATLAS_PRODUCT_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        className="group/button md:h7 h6 relative isolate flex items-center gap-[8px] uppercase"
                        href={link.href}
                      >
                        <SmallNavLinkInner label={link.label} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="order-3 flex w-full max-w-[273px] flex-col items-start gap-[6px] md:order-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link className="group/button p2-mono" href={link.href}>
                      <div className="before:bg-rich-carbon relative isolate before:absolute before:bottom-0 before:left-0 before:h-px before:w-full before:origin-left before:scale-x-0 before:transition-[transform,scale] before:duration-400 before:ease-(--easing) group-hover/button:before:scale-x-100">
                        {link.label}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="text-rich-carbon/60 order-4 col-span-2 flex w-full max-w-[273px] flex-col gap-[6px] md:hidden">
                <p className="p3-mono">Copyright &copy; 2026 Atlas Intelligence (Pvt.) Ltd.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
