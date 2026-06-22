/**
 * Event color resolution. The OKLCH urgency ramp is IMPORTED from todo-rich-card
 * (`RAMPS`) — not re-derived — so the calendar matches the card + gantt exactly.
 * Only the done/blocked tones are adapted (muted / destructive).
 *
 * `RAMPS` must be the FIRST `from`-import so the meta-deps audit registers the
 * todo-rich-card dependency (blackboard-01 / content-composer-01 lesson).
 */
import { RAMPS } from "../../todo-rich-card";
import type {
  CalendarEventColor,
  CalendarStatusTone,
  TodoColorRamp,
  TodoItem,
  TodoStatusOption,
} from "../types";

export function toneFor(
  item: TodoItem,
  statusOptions?: TodoStatusOption[],
): CalendarStatusTone {
  const opt = statusOptions?.find((o) => o.value === item.status);
  return opt?.tone ?? "active";
}

/** Resolve a `TodoColorRamp` (preset name | custom fn) into a callable. */
export function resolveRamp(
  ramp: TodoColorRamp | undefined,
): (t: number) => string {
  if (ramp == null) return RAMPS.default;
  if (typeof ramp === "function") return ramp;
  return RAMPS[ramp] ?? RAMPS.default;
}

/** Fraction 0..1 of the window elapsed at `nowMs`. */
export function elapsedFraction(
  startMs: number,
  endMs: number,
  nowMs: number,
): number {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }
  const f = (nowMs - startMs) / (endMs - startMs);
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

/**
 * Resolve the accent color for an event. Precedence:
 *   item.borderColor override → that color (skips the engine)
 *   statusColor (statusColors[item.status]) → that color (status-driven)
 *   tone "done"    → muted-foreground
 *   tone "blocked" → destructive
 *   colorBy "urgency" → time-elapsed ramp (the v1 behavior, matches card + gantt)
 *   otherwise (status mode, active, no explicit color) → primary
 *
 * The accent is the chip/block border + text; the surface tints it (color-mix)
 * for the background — same accent, light fill. Default `colorBy` is "status",
 * so changing an item's status changes its color (use "urgency" for the ramp).
 */
export function eventColor(
  item: TodoItem,
  tone: CalendarStatusTone,
  startMs: number,
  endMs: number,
  nowMs: number,
  ramp: (t: number) => string,
  statusColor?: string,
  colorBy: "status" | "urgency" = "status",
): CalendarEventColor {
  let accent: string;
  if (item.borderColor) accent = item.borderColor;
  else if (statusColor) accent = statusColor;
  else if (tone === "done") accent = "var(--muted-foreground)";
  else if (tone === "blocked") accent = "var(--destructive)";
  else if (colorBy === "urgency") accent = ramp(elapsedFraction(startMs, endMs, nowMs));
  else accent = "var(--primary)";
  return { fill: accent, foreground: accent, border: accent };
}
