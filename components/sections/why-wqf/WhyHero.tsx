"use client";

import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";
import { createWhyHero } from "@/lib/webgl/scenes/whyHero";

/**
 * Why Atlas hero. Ported from the `whyHero` Alpine component, which does nothing
 * but boot the WebGL scene onto `$refs.canvas` and tear it down again.
 *
 * The title and the bottom grid are both non-scroll-triggered reveals: they
 * start at `opacity-0` in the markup and play on mount, since they're already
 * in view on load.
 */
export default function WhyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createWhyHero(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="container flex w-full flex-1 items-center justify-between py-(--header-height) text-center">
        <SplitTextReveal
          as="h1"
          scrollTriggered={false}
          className="h2 mx-auto px-[20px] py-[24px] uppercase opacity-0 md:px-0"
        >
          <span className="block">
            Building the operating
            <br />
            system for decisions.
          </span>
          <span className="block">Sovereign by default.</span>
        </SplitTextReveal>
      </div>

      <FadeIn
        scrollTriggered={false}
        className="container grid grid-cols-2 gap-y-[20px] pb-[24px] opacity-0 md:gap-y-[24px] md:pb-[32px]"
      >
        <p className="p2-mono text-off-white/60 border-off-white/20 border-b pb-[8px] text-right md:text-left">
          scroll down
        </p>
        <p className="p2-mono text-off-white/60 border-off-white/20 order-first border-b pb-[8px] md:order-0">
          Why Atlas
        </p>
        <div className="order-last col-span-full flex items-end md:order-0 md:col-span-1 max-[360px]:[&_div]:px-0 [&_a]:w-full md:[&_a]:w-auto">
          <Button href="#founders" theme="light" className="block">
            Products
          </Button>
          <Button href="#investors" theme="light" className="block">
            Government
          </Button>
          <Button href="#partners" theme="light" className="block">
            Platforms
          </Button>
        </div>
        <p className="p2-mono text-off-white/60 col-span-full w-full max-w-[525px] md:col-span-1">
          We build the operating system for critical decisions. Products get
          senior-grade tooling from day one. Government gets programmes delivered
          end to end. Enterprises get platforms that turn signal into action.
        </p>
      </FadeIn>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 h-full w-full"
        style={{
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />
    </section>
  );
}
