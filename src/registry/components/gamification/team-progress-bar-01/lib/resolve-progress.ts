import type { Milestone, ProgressLabelFormat, ResolvedProgress } from "../types";

/**
 * The one piece of real logic — pure, SSR-deterministic (derives only from
 * props; never reads `Date`, layout, or env at module scope). Test-ready and a
 * prime candidate to hoist into a shared `gamification-kit` once 2–3 components
 * prove the surface (system §7.3) — keep it standalone, never inline it.
 */

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Dev-only warning. The `NODE_ENV` guard is the one sanctioned env reference
 *  (erased in production builds); kept inside the function body, never at module scope. */
function devWarn(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message);
  }
}

function ticksFrom(milestones: Milestone[]): ResolvedProgress["ticks"] {
  // Sort a *copy* — never mutate the prop array.
  return [...milestones]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({ done: m.done, label: m.label }));
}

/**
 * Resolution order (deterministic, locked — description §4 / plan §5):
 *   value present   → pct = clamp(round(value), 0, 100); counts null; ticks from milestones if any
 *   milestones      → pct = total===0 ? 0 : round(done/total*100); counts + ticks set
 *   neither         → 0% (always-visible rule — never hidden, never NaN)
 */
export function resolveProgress(args: {
  value?: number;
  milestones?: Milestone[];
}): ResolvedProgress {
  const { value, milestones } = args;

  if (value != null) {
    if (milestones?.length) {
      devWarn(
        "[team-progress-bar-01] both `value` and `milestones` supplied; `value` takes precedence.",
      );
    }
    return {
      pct: clamp(Math.round(value), 0, 100),
      doneCount: null,
      total: null,
      // Ticks follow milestones when present even in value-mode; the fill follows `value` (§9).
      ticks: milestones?.length ? ticksFrom(milestones) : null,
    };
  }

  if (milestones?.length) {
    const total = milestones.length;
    const doneCount = milestones.filter((m) => m.done).length;
    return {
      pct: total === 0 ? 0 : Math.round((doneCount / total) * 100),
      doneCount,
      total,
      ticks: ticksFrom(milestones),
    };
  }

  // Empty / uninitialised → 0%, bar still renders.
  return { pct: 0, doneCount: null, total: null, ticks: null };
}

/**
 * Resolve the *effective* label format. `"fraction"` requires milestones
 * (a non-null `total`); without them it falls back to `"percent"` + dev-warns,
 * so the readout is never `"NaN / NaN"`.
 */
export function resolveLabelFormat(
  requested: ProgressLabelFormat,
  total: number | null,
): ProgressLabelFormat {
  if (requested === "fraction" && total == null) {
    devWarn(
      "[team-progress-bar-01] labelFormat='fraction' requires `milestones`; falling back to 'percent'.",
    );
    return "percent";
  }
  return requested;
}
