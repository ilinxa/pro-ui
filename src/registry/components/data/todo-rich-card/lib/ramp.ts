/**
 * OKLCH ramp engine.
 *
 * Endpoints picked against design-system tokens: green at t=0 (calm/fresh),
 * red at t=1 (alarming/overdue). Hue interpolation takes the short path
 * (so green→red goes through yellow/orange, not blue/purple).
 *
 * Browser support: `oklch()` syntax is universal in our target browsers
 * (the rest of the design system uses OKLCH throughout — see globals.css).
 */

import type { TodoColorRamp, TodoColorRampPreset } from "../types";
import { clamp01 } from "./time";

type Oklch = { l: number; c: number; h: number };

const STOPS: Record<TodoColorRampPreset, { from: Oklch; to: Oklch }> = {
  default: {
    from: { l: 0.78, c: 0.18, h: 142 },
    to: { l: 0.62, c: 0.22, h: 25 },
  },
  muted: {
    from: { l: 0.82, c: 0.08, h: 142 },
    to: { l: 0.68, c: 0.12, h: 25 },
  },
  vivid: {
    from: { l: 0.75, c: 0.22, h: 145 },
    to: { l: 0.58, c: 0.26, h: 22 },
  },
  monochrome: {
    from: { l: 0.85, c: 0.02, h: 250 },
    to: { l: 0.45, c: 0.02, h: 250 },
  },
};

/** Short-path hue interpolation; handles the 360° wrap. */
export function interpolateOklch(a: Oklch, b: Oklch, t: number): Oklch {
  const tt = clamp01(t);
  const hueDelta = ((b.h - a.h + 540) % 360) - 180;
  return {
    l: a.l + (b.l - a.l) * tt,
    c: a.c + (b.c - a.c) * tt,
    h: a.h + hueDelta * tt,
  };
}

function formatOklch({ l, c, h }: Oklch): string {
  // Three decimals is enough for visually-distinct stops at our budget; keeps strings short.
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${((h % 360) + 360) % 360})`;
}

function rampFromPreset(preset: TodoColorRampPreset): (t: number) => string {
  const { from, to } = STOPS[preset];
  return (t) => formatOklch(interpolateOklch(from, to, t));
}

/** Public — exported from index.ts. Mirrors rich-card's PREDEFINED_KEYS pattern. */
export const RAMPS: Record<TodoColorRampPreset, (t: number) => string> = {
  default: rampFromPreset("default"),
  muted: rampFromPreset("muted"),
  vivid: rampFromPreset("vivid"),
  monochrome: rampFromPreset("monochrome"),
};

/** Resolve a TodoColorRamp (preset name | custom fn) into a callable. */
export function resolveRamp(
  ramp: TodoColorRamp | undefined,
): (elapsed: number) => string {
  if (ramp == null) return RAMPS.default;
  if (typeof ramp === "function") return ramp;
  return RAMPS[ramp];
}
