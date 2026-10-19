"use client";

import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";
import { useSticky } from "@/lib/hooks/useAnimations";
import { createInsightScene } from "@/lib/webgl/scenes/insightScene";

/**
 * The article's left rail: a WebGL wave tile above a contact prompt, pinned for
 * the height of the body copy.
 *
 * On mobile the rail is a row (tile beside the text); from `md` it stacks and
 * the pin kicks in, which is why `useSticky` runs desktop-only.
 */
export default function ArticleAside() {
  const stickyRef = useSticky<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createInsightScene(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <aside className="border-off-white/20 w-full max-w-[315px] pt-[64px] md:max-w-[390px] md:border-r md:pt-0">
      <div
        ref={stickyRef}
        className="sticky top-0 flex w-full max-w-[322px] items-start gap-[20px] py-[56px] md:block md:pt-[80px] md:pb-0"
      >
        <div className="bg-urban-smoke relative isolate flex aspect-square w-full max-w-[102px] items-center justify-center overflow-hidden rounded-[10px] md:max-w-full">
          <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        </div>
        <div>
          <SplitTextReveal as="h2" className="h6 uppercase md:mt-[24px]">
            Let&rsquo;s work together
          </SplitTextReveal>
          <p className="p3 text-off-white/60 mt-[12px]">
            Discover how our platforms and delivery teams help governments, enterprises and
            founders turn data into decisions.
          </p>
          <div className="mt-[20px] md:mt-[24px]">
            <Button
              theme="light"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("contact-modal:open", { detail: "#contact" })
                )
              }
            >
              build with us
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
