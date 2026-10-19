"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";
import { createAboutOutroScene } from "@/lib/webgl/scenes/aboutOutro";

/**
 * "Our ethos" -- three stacked statements over the WebGL point cloud that
 * morphs from stacked planes into a cylinder as the section scrolls.
 *
 * The scene pins itself to `#outro`, so the id on the section is load-bearing:
 * `createAboutOutroScene` looks it up by selector for its ScrollTriggers.
 *
 * The huge `md:mt-[504px]` gaps between blocks are what give the morph room to
 * run; they are not decorative spacing.
 */

/** Fades the canvas out at the top and bottom edges of the section. */
const CANVAS_MASK: CSSProperties = {
  maskImage:
    "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)",
};

export default function AboutOutro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const scene = createAboutOutroScene(canvas, wrapper);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section
      className="bg-neural-fog text-rich-carbon relative isolate mt-[120px] overflow-hidden rounded-[20px] py-[120px] md:mt-[200px] md:pt-[200px] md:pb-[400px]"
      id="outro"
    >
      <div
        ref={wrapperRef}
        className="pointer-events-none absolute inset-0 -z-1 size-full"
      >
        <canvas ref={canvasRef} className="size-full" style={CANVAS_MASK} />
      </div>
      <div className="relative z-1 container">
        <div className="mx-auto max-w-[993px] text-center">
          <FadeIn as="h2" className="p1-mono">
            our ethos
          </FadeIn>
          <SplitTextReveal as="p" className="h2 mt-[12px] uppercase">
            We&apos;ve built the systems. Run the programmes. Shipped the platforms.
          </SplitTextReveal>
          <FadeIn as="p" className="p1 mx-auto mt-[24px] max-w-[550px] md:mt-[32px]">
            We know decisions don&apos;t wait: government departments, banks, telecoms,
            and industrial groups need infrastructure that works the first time and
            every time. We build for organisations that cannot afford for it to fail.
            We know what they need and how to deliver it.
          </FadeIn>
        </div>
        <div className="mx-auto mt-[120px] max-w-[700px] text-center md:mt-[504px]">
          <SplitTextReveal as="h2" className="h5 uppercase">
            Systems integration demands everything. The stakes are real. For our
            clients, the standard is binary: it works or it fails.
          </SplitTextReveal>
          <FadeIn as="p" className="p1 mx-auto mt-[24px] max-w-[574px] md:mt-[32px]">
            Atlas Intelligence shifts those odds. With a shared security, identity and
            deployment layer across every pillar. With one team spanning government
            technology, enterprise platforms and products. With clients who stay in
            control: sovereign by default, keeping custody of their data,
            infrastructure and exit path.
            <br />
            <br />
            We give clients what they need to operate: delivery that doesn&apos;t stop
            at launch, resources that arrive on a two-week cadence, and support that
            lasts for the life of the system.
          </FadeIn>
        </div>
        <div className="mx-auto mt-[120px] max-w-[1050px] text-center md:mt-[504px]">
          <SplitTextReveal as="h2" className="h3 uppercase">
            Pakistan&apos;s institutions move fast. The systems behind them need to
            move faster. That&apos;s why we exist. To build the operating system for
            the decisions that can&apos;t afford to wait.
          </SplitTextReveal>
        </div>
      </div>
    </section>
  );
}
