/**
 * Classify a dialog close request without Radix-only props (ME-4, 0.8.0).
 *
 * Base UI calls `onOpenChange(open, eventDetails)` with `eventDetails.reason`
 * (older builds: `(open, event, reason)`); Radix passes only `open`. Read any
 * extra argument defensively: a string reason (or `{ reason }`) containing
 * "outside" is an outside press, "escape" is Escape. No reason found = `null`,
 * and the caller falls back to its pointer record.
 */
export type CloseReason = "outside" | "escape" | "other";

export function classifyCloseReason(extra: readonly unknown[]): CloseReason | null {
  for (const arg of extra) {
    let reason: unknown = arg;
    if (arg !== null && typeof arg === "object" && "reason" in arg) {
      reason = (arg as { reason?: unknown }).reason;
    }
    if (typeof reason !== "string" || reason === "") continue;
    const r = reason.toLowerCase();
    if (r.includes("outside")) return "outside";
    if (r.includes("escape")) return "escape";
    return "other";
  }
  return null;
}
