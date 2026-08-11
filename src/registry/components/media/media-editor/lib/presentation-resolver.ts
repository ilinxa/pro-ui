import type { ComposerMode } from "../types";

export type ResolvedPresentation = "inline" | "dialog";

/**
 * Resolves the runtime `presentation` mode per description §6.
 *
 * Rules:
 *  - "inline" — render bare in parent layout. No portal/modal/focus-trap.
 *  - "dialog" — wrap in shadcn dialog.
 *  - "auto"   — if `enabledModes` is empty (pure-edit context, no capture
 *               surface), pick "inline". Otherwise pick "dialog". The presence
 *               of `initialSource` does NOT change the rule.
 */
export function resolvePresentation(
  presentation: "inline" | "dialog" | "auto" | undefined,
  enabledModes: readonly ComposerMode[],
): ResolvedPresentation {
  if (presentation === "inline") return "inline";
  if (presentation === "dialog") return "dialog";
  // auto (or undefined, defaults to auto)
  return enabledModes.length === 0 ? "inline" : "dialog";
}
