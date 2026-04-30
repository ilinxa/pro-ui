import type { HistoryEntry, PrimitiveInverse } from "../../types";

/**
 * Per v0.2 plan §16.5 #13 + Q-P6: action handlers capture BEFORE-state
 * (becomes `inverses`) and AFTER-state (becomes `forwards`) at dispatch
 * time, then build a single `HistoryEntry` via these helpers.
 *
 * Drag-coalesced entries (set in the interaction layer in A3) compose
 * multiple primitives — typically a single `setNodePosition` with one
 * trailing `pinNode` if the user wasn't pinned before the drag.
 *
 * v0.3 expands the change shapes with full CRUD (addNode / updateEdge
 * / deleteGroup / etc.).
 */

export interface SetNodePositionChange {
  type: "setNodePosition";
  id: string;
  before: { x: number; y: number };
  after: { x: number; y: number };
}

export interface PinNodeChange {
  type: "pinNode";
  id: string;
  before: boolean;
  after: boolean;
}

export type PrimitiveChange = SetNodePositionChange | PinNodeChange;

export function buildHistoryEntry(
  label: string,
  changes: ReadonlyArray<PrimitiveChange>,
): HistoryEntry {
  const inverses: PrimitiveInverse[] = changes.map(toInverse);
  const forwards: PrimitiveInverse[] = changes.map(toForward);
  return { label, inverses, forwards };
}

function toInverse(change: PrimitiveChange): PrimitiveInverse {
  switch (change.type) {
    case "setNodePosition":
      return {
        type: "setNodePosition",
        id: change.id,
        x: change.before.x,
        y: change.before.y,
      };
    case "pinNode":
      return { type: "pinNode", id: change.id, pinned: change.before };
  }
}

function toForward(change: PrimitiveChange): PrimitiveInverse {
  switch (change.type) {
    case "setNodePosition":
      return {
        type: "setNodePosition",
        id: change.id,
        x: change.after.x,
        y: change.after.y,
      };
    case "pinNode":
      return { type: "pinNode", id: change.id, pinned: change.after };
  }
}
