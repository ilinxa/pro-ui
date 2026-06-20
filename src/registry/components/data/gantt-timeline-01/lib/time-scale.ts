/**
 * Continuous time scale: a linear map epoch-ms ↔ x-pixels, plus the two-tier
 * header scale selection (with a wide hysteresis band) and calendar-aware tick
 * generation. Pure; framework-free. No date library — epoch-ms + `Intl`.
 */

import type { GanttTimeUnit, GanttViewport, GanttZoom } from "../types";

export const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
} as const;

/** Approximate unit lengths — used ONLY for scale anchoring, never for labels. */
const APPROX_MS: Record<GanttTimeUnit, number> = {
  hour: MS.hour,
  day: MS.day,
  week: MS.week,
  month: 2_629_800_000, // 30.44 d
  quarter: 7_889_400_000,
  year: 31_557_600_000,
};

export function x(vp: GanttViewport, t: number): number {
  return (t - vp.originMs) * vp.pxPerMs;
}

export function timeAt(vp: GanttViewport, px: number): number {
  return vp.originMs + px / vp.pxPerMs;
}

/* ───────── named-level anchors ───────── */

/** The minor (cell) unit each named zoom level targets. */
const ZOOM_MINOR: Record<GanttZoom, GanttTimeUnit> = {
  hour: "hour",
  day: "day",
  week: "day",
  month: "week",
  quarter: "month",
};

/** A named-zoom level renders its minor cell about this wide. */
const ANCHOR_CELL_PX = 56;

export function pxPerMsForZoom(zoom: GanttZoom): number {
  return ANCHOR_CELL_PX / APPROX_MS[ZOOM_MINOR[zoom]];
}

/** Nearest named level for a given pxPerMs (for the controlled `zoom` echo). */
export function zoomForPxPerMs(pxPerMs: number): GanttZoom {
  const levels: GanttZoom[] = ["hour", "day", "week", "month", "quarter"];
  let best: GanttZoom = "week";
  let bestDist = Infinity;
  for (const lvl of levels) {
    const d = Math.abs(Math.log(pxPerMsForZoom(lvl) / pxPerMs));
    if (d < bestDist) {
      bestDist = d;
      best = lvl;
    }
  }
  return best;
}

/* ───────── two-tier scale selection ───────── */

const SCALE_LADDER: { minor: GanttTimeUnit; major: GanttTimeUnit }[] = [
  { minor: "hour", major: "day" },
  { minor: "day", major: "week" },
  { minor: "day", major: "month" },
  { minor: "week", major: "month" },
  { minor: "month", major: "quarter" },
  { minor: "month", major: "year" },
  { minor: "quarter", major: "year" },
];

// One cutoff over a multiplicatively-spaced ladder: each rung's minor unit is
// ~3–7× the previous, so a single MIN_CELL_PX threshold yields wide, stable
// pxPerMs bands per level and the header doesn't thrash near a boundary. (Band
// stability comes from the rung spacing — not state-dependent hysteresis.)
const MIN_CELL_PX = 40;

/** Pick the finest ladder entry whose minor cell renders ≥ MIN_CELL_PX. */
export function pickScales(pxPerMs: number): {
  minor: GanttTimeUnit;
  major: GanttTimeUnit;
} {
  for (const entry of SCALE_LADDER) {
    if (APPROX_MS[entry.minor] * pxPerMs >= MIN_CELL_PX) return entry;
  }
  return SCALE_LADDER[SCALE_LADDER.length - 1];
}

/* ───────── calendar boundaries (local time, single display tz) ───────── */

export function startOfUnit(unit: GanttTimeUnit, ms: number): number {
  const d = new Date(ms);
  switch (unit) {
    case "hour":
      d.setMinutes(0, 0, 0);
      return d.getTime();
    case "day":
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    case "week": {
      d.setHours(0, 0, 0, 0);
      const monday = (d.getDay() + 6) % 7; // Monday = 0
      d.setDate(d.getDate() - monday);
      return d.getTime();
    }
    case "month":
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      return d.getTime();
    case "quarter":
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      d.setMonth(Math.floor(d.getMonth() / 3) * 3);
      return d.getTime();
    case "year":
      d.setHours(0, 0, 0, 0);
      d.setMonth(0, 1);
      return d.getTime();
  }
}

export function addUnit(unit: GanttTimeUnit, ms: number, n = 1): number {
  const d = new Date(ms);
  switch (unit) {
    case "hour":
      d.setHours(d.getHours() + n);
      break;
    case "day":
      d.setDate(d.getDate() + n);
      break;
    case "week":
      d.setDate(d.getDate() + 7 * n);
      break;
    case "month":
      d.setMonth(d.getMonth() + n);
      break;
    case "quarter":
      d.setMonth(d.getMonth() + 3 * n);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + n);
      break;
  }
  return d.getTime();
}

/** Aligned cell-boundary timestamps within [fromMs, toMs], capped for safety. */
export function ticks(
  unit: GanttTimeUnit,
  fromMs: number,
  toMs: number,
  cap = 800,
): number[] {
  const out: number[] = [];
  let t = startOfUnit(unit, fromMs);
  let guard = 0;
  while (t <= toMs && guard < cap) {
    out.push(t);
    t = addUnit(unit, t);
    guard += 1;
  }
  return out;
}

/* ───────── labels ───────── */

function fmt(ms: number, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(ms));
}

export function minorLabel(unit: GanttTimeUnit, ms: number): string {
  switch (unit) {
    case "hour":
      return fmt(ms, { hour: "2-digit", minute: "2-digit" });
    case "day":
      return fmt(ms, { day: "numeric" });
    case "week":
      return fmt(ms, { month: "short", day: "numeric" });
    case "month":
      return fmt(ms, { month: "short" });
    case "quarter":
      return `Q${Math.floor(new Date(ms).getMonth() / 3) + 1}`;
    case "year":
      return fmt(ms, { year: "numeric" });
  }
}

export function majorLabel(unit: GanttTimeUnit, ms: number): string {
  switch (unit) {
    case "hour":
      return fmt(ms, { weekday: "short", month: "short", day: "numeric" });
    case "day":
      return fmt(ms, { month: "short", day: "numeric" });
    case "week":
      return fmt(ms, { month: "long", year: "numeric" });
    case "month":
      return fmt(ms, { month: "long", year: "numeric" });
    case "quarter":
      return `Q${Math.floor(new Date(ms).getMonth() / 3) + 1} ${new Date(ms).getFullYear()}`;
    case "year":
      return fmt(ms, { year: "numeric" });
  }
}

/** Is this timestamp inside a Sat/Sun day? (for weekend shading) */
export function isWeekend(ms: number): boolean {
  const day = new Date(ms).getDay();
  return day === 0 || day === 6;
}
