import type { TaskChoiceRenderState, TaskChoiceState } from "../types";

/**
 * The deterministic state resolver (description §4 table). Pure, framework-free,
 * SSR-safe, test-ready. Exported so a hand-assembly resolves identically to the
 * `TaskChoiceControl01` assembly — a kit-extraction candidate (system §7.3).
 */
export function resolveTaskChoiceState(
  v: TaskChoiceState,
): TaskChoiceRenderState {
  // "claimed" wins — covers the legal `openForAnyone && assigneeId` edge.
  if (v.assigneeId != null) return "claimed";
  return v.openForAnyone ? "open" : "unassigned";
}

// Note: the open-flag is always renderable (even in "claimed" it stays visible +
// toggleable) — enforced directly in the assembly, which always mounts the toggle.
