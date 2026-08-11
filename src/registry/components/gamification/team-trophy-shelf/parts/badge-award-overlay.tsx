"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { BadgeAwardOverlayProps } from "../types";

/**
 * Tier C (lazy) — the brief (< 1s), non-blocking award reveal. Wraps the settling
 * token and layers a hand-rolled spark burst over it (zero npm animation dep —
 * built from Tailwind's `animate-ping`). The burst is `aria-hidden`, never traps
 * or steals focus, never blocks input/scroll (D-10), and is `motion-reduce:hidden`
 * so `prefers-reduced-motion` skips straight to the settled token.
 *
 * DEFAULT export so the Grid can pull it via `React.lazy(() => import(...))` — this
 * is the ONLY weight-bearing module; the bare-token path and `animateAward={false}`
 * never load its chunk.
 */
export default function BadgeAwardOverlay({
  children,
  active = false,
  onDone,
  className,
}: BadgeAwardOverlayProps) {
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  React.useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => onDoneRef.current?.(), 900);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      {active ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden"
        >
          <span className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 animate-ping" />
          {SPARKS.map((spark, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-primary animate-ping"
              style={{
                transform: `translate(-50%, -50%) translate(${spark.x}px, ${spark.y}px)`,
                animationDelay: `${spark.delay}ms`,
                animationDuration: "700ms",
              }}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}

// Fixed spark offsets (no Math.random → deterministic, SSR-safe).
const SPARKS = [
  { x: 0, y: -26, delay: 0 },
  { x: 22, y: -14, delay: 60 },
  { x: 26, y: 8, delay: 120 },
  { x: 14, y: 24, delay: 60 },
  { x: -14, y: 24, delay: 120 },
  { x: -26, y: 8, delay: 0 },
  { x: -22, y: -14, delay: 60 },
];
