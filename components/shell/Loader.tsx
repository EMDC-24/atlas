"use client";

import { useEffect, useState } from "react";

/**
 * Preloader: the panel wipes upward while the logo scales, rotates and bobs,
 * with a percentage counter beneath.
 *
 * The visual choreography is pure CSS (`.loader`, `.loader--logo`,
 * `.loader--clip-svg` in globals.css) so it starts painting before hydration,
 * exactly as the original did. Only the counter needs JS.
 *
 * The element deliberately stays mounted after finishing: the CSS animation
 * ends on `clip-path: inset(0 0 100%)`, which is what hides it. Unmounting
 * instead would change stacking/paint behaviour.
 */

/** The Atlas mark. Rendered twice -- the second copy is clip-path revealed over the first. */
function LogoPaths() {
  return (
    <g transform="translate(0.83 1.92) scale(1.02)">
      <path
        d="M14.39,11.78c.03,.09,.02,.18-.04,.26-.06,.08-.14,.12-.24,.12h-2.03c-.19,0-.31-.09-.36-.26L8.58,3.09c-.1-.3-.29-.55-.56-.74-.27-.19-.57-.29-.9-.29s-.63,.1-.89,.29-.44,.44-.55,.76L2.63,11.9c-.06,.17-.18,.26-.37,.26H.3c-.1,0-.19-.04-.24-.12-.06-.08-.07-.17-.03-.26L3.25,2.78c.15-.42,.36-.8,.63-1.14,.27-.34,.57-.63,.91-.88s.72-.43,1.13-.56c.41-.13,.84-.2,1.28-.2s.87,.07,1.28,.2c.41,.13,.79,.32,1.14,.56,.35,.24,.65,.54,.91,.88,.26,.34,.47,.72,.62,1.14l3.25,9Z"
        fill="currentColor"
      />
    </g>
  );
}

/**
 * Solves cubic-bezier(0.62, 0.16, 0.13, 1.01) -- the same curve as the
 * `--easing` custom property -- for a given time progress.
 *
 * Transcribed from the original: Newton-Raphson, fixed at 4 iterations. Kept
 * as-is rather than "improved", since iteration count affects the output and
 * therefore which numbers appear on screen.
 */
function easing(timeProgress: number): number {
  const p1x = 0.62;
  const p1y = 0.16;
  const p2x = 0.13;
  const p2y = 1.01;

  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  let x = timeProgress;
  for (let i = 0; i < 4; i++) {
    const currentX = ((ax * x + bx) * x + cx) * x;
    const currentSlope = (3 * ax * x + 2 * bx) * x + cx;
    if (currentSlope === 0) break;
    x -= (currentX - timeProgress) / currentSlope;
  }

  return ((ay * x + by) * x + cy) * x;
}

const DURATION = 1400;

export default function Loader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Scroll is locked for the duration of the count, then handed back.
    document.body.style.overflow = "hidden";

    const startTime = Date.now();
    let raf = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(elapsed / DURATION, 1);
      setProgress(Math.round(easing(timeProgress) * 100));

      if (timeProgress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        document.body.style.overflow = "";
      }
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="bg-rich-carbon loader fixed inset-0 isolate z-50 flex items-center justify-center">
      <div className="loader--logo relative isolate w-[120px] md:w-[248px]">
        <svg
          className="text-core-black h-auto w-full"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <LogoPaths />
        </svg>
        <svg
          className="loader--clip-svg absolute inset-0 h-auto w-full"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <LogoPaths />
        </svg>
      </div>
      <span className="text-off-white/60 p3-mono absolute bottom-[30px] left-1/2 -translate-x-1/2">
        {progress}%
      </span>
    </div>
  );
}
