"use client";

import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { createHomePartnersScene } from "@/lib/webgl/scenes/homePartners";

/**
 * "Partner at the edge of what's possible" -- closing CTA beside a WebGL panel.
 *
 * The canvas sits in a 16:9 box that fills the right eight columns; the scene
 * sizes itself off the canvas, so the aspect box is what controls its shape.
 */
export default function HomePartnersCta() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = createHomePartnersScene(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section
      className="container grid items-center pt-[120px] md:grid-cols-12 md:pt-[300px] md:pb-[280px]"
      id="partners"
    >
      <div className="col-span-12 lg:col-span-4">
        <div className="flex max-w-[437px] flex-col items-start gap-[35px]">
          <div className="border-off-white/20 flex flex-col gap-[15px] border-b pb-[15px]">
            <h2 className="p2-mono md:p1-mono">partners</h2>
            <SplitTextReveal as="h3" className="h5 uppercase">
              Access to technology otherwise out of reach
            </SplitTextReveal>
          </div>
          <p className="p1-mono text-off-white/60">
            24 technology partners across compute, semiconductors, enterprise software,
            and AI, giving clients supply certainty and access to technology otherwise
            out of reach.
          </p>
          <Button
            theme="light"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("contact-modal:open", { detail: "partner" })
              )
            }
          >
            partner with us
          </Button>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <div className="relative aspect-video w-full">
          <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        </div>
      </div>
    </section>
  );
}
