"use client";

import { useEffect, useRef } from "react";

import { SplitTextReveal } from "@/components/ui/Reveal";
import { useSticky } from "@/lib/hooks/useAnimations";
import { createPartnerBlocksScene } from "@/lib/webgl/scenes/partnerBlocks";

/**
 * Partners: a pinned WebGL block that morphs as the copy column scrolls past.
 *
 * Two Alpine components stacked in the original: `sticky()` pins the canvas
 * wrapper for the height of its parent grid cell (desktop only), and
 * `partnerBlocks` boots the scene, handing it `#partnerBlocks` -- the section --
 * as the element whose scroll progress drives the morph.
 */
export default function PartnerBlocks() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickyRef = useSticky<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createPartnerBlocksScene(canvas, sectionRef.current);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="container grid gap-[80px] pb-[120px] md:grid-cols-2 md:gap-[24px] md:pb-[200px]"
      id="partnerBlocks"
    >
      <div>
        <div ref={stickyRef} className="sticky top-0 pt-[80px] md:pt-[100px]">
          <div className="relative isolate flex aspect-square w-full max-w-[553px] items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[80px] md:gap-[200px] md:pt-[100px] md:pl-[60px]">
        <div className="max-w-[507px]">
          <SplitTextReveal as="h3" className="h4 uppercase">
            Who deploys Atlas.
          </SplitTextReveal>
          <p className="p2 border-off-white/20 mt-[32px] border-t pt-[24px] md:mt-[40px] md:pt-[32px]">
            Banks, telecoms, energy companies and public bodies deploy Atlas
            Sentinel and Atlas Forge under multi-year agreements, in civil security,
            financial crime, critical infrastructure and regulatory sectors.
          </p>
        </div>
        <div className="max-w-[507px]">
          <SplitTextReveal as="h3" className="h4 uppercase">
            From signal to action.
          </SplitTextReveal>
          <p className="p2 border-off-white/20 mt-[32px] border-t pt-[24px] md:mt-[40px] md:pt-[32px]">
            Atlas Sentinel brings disparate signals (sensor, transactional,
            human-reported, open-source) into a single mission picture, and routes
            the right insight to the right operator. Every query, access and
            action recorded.
          </p>
        </div>
        <div className="max-w-[507px]">
          <SplitTextReveal as="h3" className="h4 uppercase">
            The data OS for
            <br />
            the enterprise.
          </SplitTextReveal>
          <p className="p2 border-off-white/20 mt-[32px] border-t pt-[24px] md:mt-[40px] md:pt-[32px]">
            Atlas Forge connects to every system of record you already run,
            builds a living ontology, and lets domain teams compose applications
            on top, without rebuilding the data estate. Deployed on-premises,
            sovereign cloud, hybrid or managed.
          </p>
        </div>
      </div>
    </section>
  );
}
