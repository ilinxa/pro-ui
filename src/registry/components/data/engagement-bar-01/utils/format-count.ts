/**
 * Humanizes engagement counts:
 *   0           → "0"
 *   999         → "999"
 *   1_000       → "1k"
 *   1_234       → "1.2k"
 *   12_345      → "12k"      (truncated, no decimal once past 10k)
 *   1_234_567   → "1.2m"
 *   1_234_567_890 → "1.2b"
 *
 * Locale-agnostic ('.' decimal separator). Hosts wanting locale-specific
 * formatting pass `labels.formatCount` to override entirely.
 */
export function formatEngagementCount(n: number): string {
  if (n < 0) return "0";
  if (n < 1_000) return String(n);
  if (n < 10_000)
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.floor(n / 1_000) + "k";
  if (n < 1_000_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
}
