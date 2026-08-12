/**
 * Single source of truth for status → Badge variant mapping. Used across the
 * component catalog (ComponentStatus: alpha/beta/stable/deprecated) and the
 * sandbox index (SandboxStatus: alpha/beta/stable — a subset, so it's
 * assignable here without a second helper).
 */

export type StatusBadgeInput = "alpha" | "beta" | "stable" | "deprecated";

export type StatusBadgeVariant = "default" | "destructive" | "secondary" | "outline";

export function statusBadgeVariant(status: StatusBadgeInput): StatusBadgeVariant {
  switch (status) {
    case "stable":
      return "default";
    case "deprecated":
      return "destructive";
    case "beta":
      return "secondary";
    case "alpha":
    default:
      return "outline";
  }
}
