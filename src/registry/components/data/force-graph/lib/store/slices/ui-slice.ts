import type { StateCreator } from "zustand";
import type {
  EndpointRef,
  HoverState,
  LinkingMode,
  Selection,
} from "../../../types";

/**
 * Per v0.2 plan §4.3: UI slice fully activated.
 *
 *   - `selection`, `hovered`: discriminated unions per plan §3.3.
 *   - `linkingMode`: { active, source } for the linking-mode workflow.
 *   - `multiEdgeExpanded`: slot exists in v0.2 but only consumed by the
 *     v0.6 multi-edge-expansion UI.
 *   - `dragState`: INTERNAL — populated by the pointer handler in the
 *     interaction layer (A3) to coalesce drag-end commits. Not exposed
 *     via `useGraphSelector`.
 *
 * Per plan §5.3: selection / hover changes do NOT bump `graphVersion`;
 * consumers subscribe to the specific slice key they care about.
 */
export interface UiSlice {
  ui: {
    selection: Selection;
    hovered: HoverState;
    linkingMode: LinkingMode;
    multiEdgeExpanded: { a: EndpointRef; b: EndpointRef } | null;
    dragState: { activeNodeId: string; startX: number; startY: number } | null;
  };
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = () => ({
  ui: {
    selection: null,
    hovered: null,
    linkingMode: { active: false, source: null },
    multiEdgeExpanded: null,
    dragState: null,
  },
});
