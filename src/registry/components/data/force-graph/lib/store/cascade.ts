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

export type CascadeUiUpdate = Pick<GraphStoreState["ui"], "selection" | "hovered" | "linkingMode" | "multiEdgeExpanded">;

export function cascadeOnDelete(
  state: Pick<GraphStoreState, "ui">,
  target: CascadeTarget,
): { ui: CascadeUiUpdate } | null {
  const ui = state.ui;
  let changed = false;

  let selection = ui.selection;
  if (selection && selection.kind === target.kind && selection.id === target.id) {
    selection = null;
    changed = true;
  }

  let hovered = ui.hovered;
  if (hovered && hovered.kind === target.kind && hovered.id === target.id) {
    hovered = null;
    changed = true;
  }

  let linkingMode = ui.linkingMode;
  if (
    linkingMode.active &&
    linkingMode.source &&
    linkingMode.source.kind === target.kind &&
    linkingMode.source.id === target.id
  ) {
    linkingMode = { active: false, source: null };
    changed = true;
  }

  let multiEdgeExpanded = ui.multiEdgeExpanded;
  if (multiEdgeExpanded) {
    const { a, b } = multiEdgeExpanded;
    if (
      (a.kind === target.kind && a.id === target.id) ||
      (b.kind === target.kind && b.id === target.id)
    ) {
      multiEdgeExpanded = null;
      changed = true;
    }
  }

  if (!changed) return null;
  return {
    ui: { selection, hovered, linkingMode, multiEdgeExpanded },
  };
}
