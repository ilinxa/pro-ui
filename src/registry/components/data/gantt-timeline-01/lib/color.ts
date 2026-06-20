/**
 * Bar color resolution. The OKLCH urgency ramp is IMPORTED from todo-rich-card
 * (`RAMPS`) — not re-derived — so the timeline matches the card exactly. Only
 * the done/blocked tones are adapted to filled bars (gray / red), per the
 * procomp description §9.
 *
 * `RAMPS` must be the FIRST `from`-import so the meta-deps audit registers the
 * todo-rich-card dependency (blackboard-01 / content-composer-01 lesson).
 */

import { RAMPS } from "../../todo-rich-card";
import type {
  GanttStatusTone,
  TodoColorRamp,
  TodoItem,
  TodoStatusOption,
} from "../types";
import { effEndMs, effStartMs } from "./geometry";

export function toneFor(
  item: TodoItem,
  statusOptions?: TodoStatusOption[],
): GanttStatusTone {
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

/** Fraction 0..1 of the item's window that has elapsed at `nowMs`. */
export function elapsedFraction(item: TodoItem, nowMs: number): number {
  const s = effStartMs(item);
  const e = effEndMs(item);
  if (e == null || e <= s) return 0;
  const f = (nowMs - s) / (e - s);
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

/**
 * Final fill for a bar:
 *   borderColor override  → that color (skips the engine)
 *   tone "done"           → gray
 *   tone "blocked"        → red
 *   tone "active"         → time-urgency ramp (green → red)
 */
export function barFill(
  item: TodoItem,
  nowMs: number,
  ramp: (t: number) => string,
  statusOptions?: TodoStatusOption[],
): { fill: string; tone: GanttStatusTone } {
  const tone = toneFor(item, statusOptions);
  if (item.borderColor) return { fill: item.borderColor, tone };
  if (tone === "done") return { fill: "var(--muted-foreground)", tone };
  if (tone === "blocked") return { fill: "var(--destructive)", tone };
  return { fill: ramp(elapsedFraction(item, nowMs)), tone };
}
