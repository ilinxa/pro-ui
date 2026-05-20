/**
 * Time → 0-1 elapsed value + border color resolution.
 *
 * Pure functions. No React.
 *
 * Rules (from plan §5.1):
 *   - Both expireAt + duration set → expireAt wins
 *   - Only expireAt → normalize over (expireAt - startAt)
 *   - Only duration → normalize over duration from startAt
 *   - Neither → returns null (engine inactive; default border)
 *   - Past expireAt → clamped to 1.0 (full red)
 *   - Before startAt → clamped to 0.0 (full green)
 *   - Per-item borderColor wins over engine output
 */

import type { TodoItem } from "../types";
import { clamp01, parseIso } from "./time";

/** Returns elapsed in [0, 1] or null when the engine is inactive for this item. */
export function computeElapsed(item: TodoItem, now: Date): number | null {
  const start = parseIso(item.startAt ?? item.setAt);
  if (!start) return null;

  if (item.expireAt) {
    const end = parseIso(item.expireAt);
    if (!end) return null;
    if (end.getTime() <= start.getTime()) return null;
    return clamp01((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()));
  }

  if (item.duration && item.duration > 0) {
    return clamp01((now.getTime() - start.getTime()) / item.duration);
  }

  return null;
}

/**
 * Border color resolution.
 * Returns null when the renderer should fall back to the semantic-token
 * className (border-border) — i.e., no inline style.borderColor.
 */
export function resolveBorderColor(
  item: TodoItem,
  elapsed: number | null,
  ramp: (t: number) => string,
): string | null {
  if (item.borderColor != null && item.borderColor.length > 0) {
    return item.borderColor;
  }
  if (elapsed == null) return null;
  return ramp(elapsed);
}
