"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import CornerAccents from "./CornerAccents";

/**
 * The site's standard button, used ~340 times.
 *
 * On hover: a blurred dot slides in from the left, the label shifts right and
 * rolls over to a duplicate beneath it, and the corner brackets brighten. The
 * duplicate label is aria-hidden so screen readers announce the text once.
 *
 * `data-theme` picks the palette via `group-data-[theme=...]` variants rather
 * than props, matching the original -- which lets a parent set the theme for a
 * whole cluster of buttons.
 */

const DOT_CLASS =
  "group-data-[theme=light]/button:bg-neural-fog group-data-[theme=dark]/button:bg-rich-carbon motion-reduce:blur-0 button--dot size-[10px] -translate-x-[24px] rounded-[3px] opacity-0 blur-[20px] transition-all duration-400 ease-(--easing) group-hover/button:-translate-x-[5px] group-hover/button:opacity-100 group-hover/button:blur-[0px] group-active/button:-translate-x-[5px] group-active/button:opacity-100 group-active/button:blur-[0px] motion-reduce:hidden motion-reduce:translate-x-0 motion-reduce:opacity-0 motion-reduce:group-hover/button:translate-x-0 motion-reduce:group-hover/button:opacity-0";

const LABEL_WRAP_CLASS =
  "p2-mono group-data-[theme=light]/button:text-neural-fog group-data-[theme=dark]/button:text-rich-carbon relative isolate flex -translate-x-[5px] overflow-hidden transition-transform duration-400 ease-(--easing) group-hover/button:translate-x-[5px] group-active/button:translate-x-[5px] motion-reduce:translate-x-0 motion-reduce:group-hover/button:translate-x-0";

const LABEL_TOP_CLASS =
  "transition-transform duration-400 ease-(--easing) group-hover/button:-translate-y-full group-active/button:-translate-y-full motion-reduce:translate-y-0 motion-reduce:group-hover/button:translate-y-0";

const LABEL_BOTTOM_CLASS =
  "absolute inset-0 translate-y-full transition-transform duration-400 ease-(--easing) group-hover/button:translate-y-0 group-active/button:translate-y-0 motion-reduce:hidden";

const ACCENT_CLASS =
  "size-[9px] corner-accent transition-opacity ease-(--easing) duration-400 group-active/button:opacity-100 group-data-[theme=light]/button:text-neural-fog group-data-[theme=dark]/button:text-rich-carbon motion-reduce:opacity-100 motion-reduce:transition-none";

const ROOT_CLASS =
  "group/button hover:animate-glitch-hover relative isolate motion-reduce:hover:animate-none";

interface ButtonProps {
  children: ReactNode;
  /** "light" = light text on dark ground; "dark" = the inverse. */
  theme?: "light" | "dark";
  className?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  /** Overrides the inner padding/height wrapper when a caller needs a different box. */
  innerClassName?: string;
}

function ButtonInner({
  children,
  innerClassName = "flex h-[40px] items-center justify-center px-[20px]",
}: {
  children: ReactNode;
  innerClassName?: string;
}) {
  return (
    <>
      <div className={innerClassName}>
        <div className={DOT_CLASS} />
        <div className={LABEL_WRAP_CLASS}>
          <span className={LABEL_TOP_CLASS}>{children}</span>
          <span aria-hidden="true" className={LABEL_BOTTOM_CLASS}>
            {children}
          </span>
        </div>
      </div>
      <CornerAccents className={ACCENT_CLASS} />
    </>
  );
}

export default function Button({
  children,
  theme = "light",
  className,
  onClick,
  href,
  ariaLabel,
  innerClassName,
}: ButtonProps) {
  const rootClass = className ? `${ROOT_CLASS} ${className}` : ROOT_CLASS;

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto");
    const content = <ButtonInner innerClassName={innerClassName}>{children}</ButtonInner>;

    if (external) {
      return (
        <a
          className={rootClass}
          data-theme={theme}
          href={href}
          aria-label={ariaLabel}
          target="_blank"
          rel="noopener"
        >
          {content}
        </a>
      );
    }

    return (
      <Link className={rootClass} data-theme={theme} href={href} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button className={rootClass} data-theme={theme} onClick={onClick} aria-label={ariaLabel}>
      <ButtonInner innerClassName={innerClassName}>{children}</ButtonInner>
    </button>
  );
}
