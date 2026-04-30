import type { EndpointRef } from "../../types";

/**
 * UI-state cascade-on-delete plumbing — foundational scaffolding per plan
 * §3 / §8.5 #1. Activates in v0.2+ when selection/hover/multi-edge state
 * actually exist.
 *
 * v0.1 has no editing affordances, so this function is wired but never
 * fires under normal usage. Live-source delete deltas DO call it (per
 * decision #22 — deltas preserve UI state and don't enter undo), but
 * since v0.1's UI slice is empty, the call is a no-op.
 *
 * v0.2 expands this to actually clear:
 *   - selection if selection.id matches the deleted entity
 *   - hovered if it matches
 *   - multiEdgeExpanded entries that referenced the deleted edge
 *   - linking.source if it pointed at the deleted entity
 */

export type CascadeTarget =
  | EndpointRef
  | { kind: "edge"; id: string };

export function cascadeOnDelete(
  state: { ui: { selection: null; hovered: null } },
  target: CascadeTarget,
): { ui: { selection: null; hovered: null } } {
  // v0.1: no-op (UI slice has no live state to clear yet).
  // v0.2 plan amends this to clear selection / hovered / multiEdgeExpanded /
  // linking.source per spec §5.2. The params are kept on the v0.1
  // signature so the v0.2 expansion is a body-only change, not an API
  // break for any v0.1 caller. Reads here are intentional and pass the
  // unused-vars lint.
  void state;
  void target;
  return { ui: { selection: null, hovered: null } };
}
