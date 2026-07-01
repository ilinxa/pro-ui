import type { ReactNode } from "react";

/**
 * `team-progress-bar-01` — public type surface.
 *
 * Framework-free (no `"use client"`): importable from a server component's
 * type position. Per system D-03 every type this component needs is
 * **re-declared locally** — it imports nothing from another registry component.
 * The `gamification-system` description (§4 domain model, §6 telemetry union) is
 * the source of truth these slices are copied from, not imported.
 */

/**
 * A planned team milestone — the shared spine progress derives from (system D-09).
 * Re-declared locally per D-03; do not fork the system's canonical shape.
 */
export interface Milestone {
  id: string;
  /** Human label — shown as a tick-mark tooltip. e.g. "First playable build". */
  label: string;
  /** Counts toward the numerator when true. */
  done: boolean;
  /** ISO 8601 — reserved; not rendered by the bar. */
  doneAt?: string;
  /** Left-to-right tick ordering on the track. */
  order: number;
}

/**
 * This team — the identity subset (system D-15). `id` scopes the telemetry
 * payload; `name` is the optional leading label. Never a bare `teamId`+`teamName`
 * pair because this component renders the team name as text.
 */
export interface TeamProgressBarTeam {
  id: string;
  name?: string;
}

/**
 * The single semantic event this component emits — a narrow local slice of the
 * system §6 `GamificationEvent` union. A consumer's `onEvent` is correctly typed
 * to receive only what this bar sends.
 */
export type GamificationEvent = {
  type: "progress-bar.checked";
  teamId: string;
};

/** Numeric readout style. `"fraction"` requires `milestones`. */
export type ProgressLabelFormat = "percent" | "fraction";

/** One tick notch — derived from a milestone. */
export interface ProgressTick {
  done: boolean;
  label: string;
}

/** Pure resolver output (see `lib/resolve-progress.ts`). SSR-deterministic. */
export interface ResolvedProgress {
  /** Clamped 0..100 integer. */
  pct: number;
  /** Numerator in milestone mode; `null` in direct-value mode. */
  doneCount: number | null;
  /** Denominator in milestone mode; `null` in direct-value mode. */
  total: number | null;
  /** Ordered ticks; `null` when no milestones supplied. */
  ticks: ProgressTick[] | null;
}

/** Data + telemetry surface shared by the assembly and the headless `Root`. */
export interface TeamProgressBarBaseProps {
  /** Milestones for this team; % = done/total. Enables ticks + the fraction readout. */
  milestones?: Milestone[];
  /** Direct 0–100 percentage; wins over `milestones` if both supplied. */
  value?: number;
  /** This team (system D-15). `id` → telemetry payload + scope; `name` → label. */
  team: TeamProgressBarTeam;
  /** Readout style. Default `"percent"`. `"fraction"` falls back to percent without milestones. */
  labelFormat?: ProgressLabelFormat;
  /** Telemetry — emits `{ type: "progress-bar.checked"; teamId }` once per mount. */
  onEvent?: (event: GamificationEvent) => void;
  className?: string;
}

/** Props for the headless provider `TeamProgressBarRoot`. */
export interface TeamProgressBarRootProps extends TeamProgressBarBaseProps {
  children: ReactNode;
}

/** Props for the batteries-included `TeamProgressBar01` assembly. */
export interface TeamProgressBar01Props extends TeamProgressBarBaseProps {
  /** Numeric readout. Default `true`. */
  showLabel?: boolean;
  /** Per-milestone tick notches. Default `false` (needs `milestones`). */
  showTicks?: boolean;
  "aria-label"?: string;
}

/** Props for the context-free Tier-C `ProgressTrack` primitive. */
export interface ProgressTrackProps {
  /** Clamped 0..100 fill percentage. */
  pct: number;
  /** Ordered ticks to overlay (when `showTicks`). */
  ticks?: ProgressTick[] | null;
  /** Render the tick notches. Default `false`. */
  showTicks?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** The resolved value every context part reads — one source of truth. */
export interface TeamProgressBarContextValue {
  pct: number;
  doneCount: number | null;
  total: number | null;
  ticks: ProgressTick[] | null;
  team: TeamProgressBarTeam;
  /** The *effective* format (after the fraction→percent fallback). */
  labelFormat: ProgressLabelFormat;
}
