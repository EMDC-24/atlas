"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";
import { createTubeHero } from "@/lib/webgl/scenes/tubeHero";

/**
 * About page hero. Ported from the `tubeHero` Alpine component: the particle
 * torus fills the section behind the copy.
 *
 * Every reveal here is `scrollTriggered={false}` -- the hero is above the fold,
 * so it plays on load rather than waiting for a scroll that may never happen.
 */

/** Fades the canvas out at the top and bottom edges of the section. */
const CANVAS_MASK: CSSProperties = {
  maskImage:
    "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)",
};

export default function AboutHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createTubeHero(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <div className="relative container pt-[160px] md:pt-[220px]">
      <div className="max-w-[1280px]">
        <h1 className="p2-mono text-off-white/60 flex items-center gap-[10px]">
          <span className="bg-neural-fog size-[10px] rounded-[3px]" />
          About Atlas Intelligence
        </h1>
        <SplitTextReveal
          className="h4 md:h3 text-neural-fog mt-[20px] uppercase opacity-0 md:mt-[24px]"
          scrollTriggered={false}
        >
          From blueprint to deployed system, Atlas Intelligence turns capability into
          delivery. We build for organisations that cannot afford for it to fail,
          working with them from first line of code to long-run support.
        </SplitTextReveal>
      </div>
      <FadeIn
        as="p"
        className="border-off-white/20 p2-mono text-off-white/60 mt-[32px] border-b pb-[8px] opacity-0 md:mt-[40px]"
        scrollTriggered={false}
      >
        Scroll to explore
      </FadeIn>
      <FadeIn
        as="p"
        className="p1-mono text-off-white/60 mt-[20px] ml-auto max-w-[553px] opacity-0 md:mt-[24px] md:mr-[115px]"
        scrollTriggered={false}
      >
        The systems we build don&apos;t just launch; they run the decisions that
        matter. The government departments, banks, telecoms and industrial groups we
        partner with understand that transformation isn&apos;t optional: it&apos;s
        survival.
        <br />
        <br />
        Vision matters. But delivery wins.
      </FadeIn>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 size-full"
        style={CANVAS_MASK}
      />
    </div>
  );
}
