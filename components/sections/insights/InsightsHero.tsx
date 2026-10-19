"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { SplitTextReveal } from "@/components/ui/Reveal";
import { createTubeHero } from "@/lib/webgl/scenes/tubeHero";

/**
 * /insights hero: the WebGL tube sits behind the copy, faded out top and bottom
 * by a mask so it never collides with the header or the section below.
 */

const MASK =
  "linear-gradient(0deg, transparent 0%, black 20%, black 80%, transparent 100%)";

export default function InsightsHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createTubeHero(canvas);
    scene.init();
    return () => scene.destroy();
  }, []);

  return (
    <section className="relative">
      <div className="container flex items-center gap-[24px] pt-[160px] pb-[40px] md:pt-[220px]">
        <div className="hidden w-full max-w-[207px] md:block">
          <ul className="p2-mono flex flex-col gap-[8px]">
            <li>
              <Link className="text-off-white pl-[16px]" href="/insights/news">
                Latest News
              </Link>
            </li>
          </ul>
        </div>
        <div className="max-w-[1020px]">
          <h1 className="p2-mono text-off-white/60 flex items-center gap-[10px]">
            <span className="bg-neural-fog size-[10px] rounded-[3px]" />
            Insights
          </h1>
          {/* Plays on mount rather than on scroll -- it is already in view. */}
          <SplitTextReveal
            className="h3 text-neural-fog mt-[20px] uppercase opacity-0 md:mt-[24px]"
            scrollTriggered={false}
          >
            STORIES, REFLECTIONS AND ADVICE FROM THE ATLAS TEAM.
          </SplitTextReveal>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 size-full"
        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      />
    </section>
  );
}
