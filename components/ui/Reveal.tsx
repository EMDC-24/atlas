"use client";

import type { ElementType, ReactNode } from "react";

import { useFadeIn, useSplitTextReveal } from "@/lib/hooks/useAnimations";

/**
 * Thin JSX wrappers over the reveal hooks.
 *
 * The original attached these as `x-data="fadeIn()"` directly on the element
 * being revealed, so these render a real element (configurable via `as`) and
 * attach the ref to it rather than adding a wrapper div -- an extra div would
 * change layout.
 */

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** false = play immediately on mount instead of waiting for scroll. */
  scrollTriggered?: boolean;
  id?: string;
}

export function FadeIn({
  children,
  className,
  as: Tag = "div",
  scrollTriggered = true,
  id,
}: RevealProps) {
  const ref = useFadeIn<HTMLElement>(scrollTriggered);
  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}

export function SplitTextReveal({
  children,
  className,
  as: Tag = "div",
  scrollTriggered = true,
  id,
}: RevealProps) {
  const ref = useSplitTextReveal<HTMLElement>(scrollTriggered);
  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
