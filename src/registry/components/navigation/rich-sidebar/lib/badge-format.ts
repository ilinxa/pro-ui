/**
 * Format a NavBadge `value` for display.
 *
 * - Numbers > max render as "{max}+" (cap overflow)
 * - Numbers ≤ max render as `String(value)`
 * - Non-numbers pass through unchanged (consumer supplied a string / ReactNode)
 * - Zero is filtered upstream by `<NavBadge>` via `showZero` flag — not handled here.
 */
export function formatBadgeValue(
  value: number | string,
  max: number,
): string {
  if (typeof value === "number") {
    return value > max ? `${max}+` : String(value);
  }
  return value;
}
