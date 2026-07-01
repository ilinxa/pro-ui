"use client";

// Dep-declaring import FIRST (the validate:meta-deps regex stops at the first
// `from`-import). This is the ONLY module that imports the confetti value — it is
// pulled solely via `React.lazy(() => import("./confetti-burst"))`, so the default
// CSS flourish and `enableConfetti={false}` never load its chunk.
import confetti from "canvas-confetti";
import * as React from "react";

/**
 * Tier C (lazy) — a one-shot, non-blocking confetti burst on mount. `canvas-confetti`
 * injects its own fixed, `pointer-events: none` canvas (inherently non-blocking, D-10)
 * and self-cleans. This component is never mounted under `prefers-reduced-motion`
 * (the celebration part gates it), and `disableForReducedMotion` is set as a
 * belt-and-suspenders. Renders no DOM. **DEFAULT export** for `React.lazy`.
 */
export default function ConfettiBurst() {
  React.useEffect(() => {
    // Signal-lime-forward palette (a canvas needs raw hex; not a UI token surface).
    confetti({
      particleCount: 90,
      spread: 72,
      startVelocity: 38,
      scalar: 0.9,
      origin: { y: 0.75 },
      colors: ["#c3f53c", "#a3e635", "#84cc16", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, []);

  return null;
}
