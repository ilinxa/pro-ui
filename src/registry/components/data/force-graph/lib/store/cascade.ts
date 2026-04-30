import type { EndpointRef } from "../../types";
import type { GraphStoreState } from "./store-creator";

/**
 * Per v0.2 plan §4.5: UI-state cascade-on-delete is now meaningful.
 * v0.1 scaffolded the call site; v0.2 fills the body.
 *
 * Returns a partial UI update if the cascade fires (caller applies via
 * `store.setState({ ui: ... })`), or `null` if no UI state references
 * the deleted target. Pure function — no side effects.
 *
 * Branches per spec §5.2 + plan §4.5:
 *   - Selection: clear if it points at the target.
 *   - Hovered: clear if it points at the target.
 *   - Linking mode source: exit linking mode if source matches target.
 *   - Multi-edge expansion: clear if either endpoint matches target.
 *
 * v0.3 wires this into the CRUD-driven delete flow (currently runs only
 * from delta-driven deletes per the source-adapter).
 */

export type CascadeTarget =
  | EndpointRef
  | { kind: "edge"; id: string };

/**
 * Returns the FULL new `ui` slice (with the matching pieces cleared) so
 * the caller can `setStore(() => ({ ui: cascadeResult.ui, ... }))`
 * without losing `dragState` or other untouched fields. Returns `null`
 * if no UI state references the deleted target.
 */
export function cascadeOnDelete(
  state: Pick<GraphStoreState, "ui">,
  target: CascadeTarget,
): { ui: GraphStoreState["ui"] } | null {
  const ui = state.ui;
  let changed = false;
  const next = { ...ui };

  if (
    next.selection &&
    next.selection.kind === target.kind &&
    next.selection.id === target.id
  ) {
    next.selection = null;
    changed = true;
  }

  if (
    next.hovered &&
    next.hovered.kind === target.kind &&
    next.hovered.id === target.id
  ) {
    next.hovered = null;
    changed = true;
  }

  if (
    next.linkingMode.active &&
    next.linkingMode.source &&
    next.linkingMode.source.kind === target.kind &&
    next.linkingMode.source.id === target.id
  ) {
    next.linkingMode = { active: false, source: null };
    changed = true;
  }

  if (next.multiEdgeExpanded) {
    const { a, b } = next.multiEdgeExpanded;
    if (
      (a.kind === target.kind && a.id === target.id) ||
      (b.kind === target.kind && b.id === target.id)
    ) {
      next.multiEdgeExpanded = null;
      changed = true;
    }
  }

  if (!changed) return null;
  return { ui: next };
}
