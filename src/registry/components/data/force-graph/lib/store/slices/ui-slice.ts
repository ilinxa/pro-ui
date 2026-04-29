import type { StateCreator } from "zustand";

/**
 * Per plan §3 + §7.2: UI slice is SCAFFOLDED in v0.1 with minimal shape;
 * full selection / hover / linking / multi-edge state lands in v0.2.
 *
 * The slice exists in v0.1 so the UI-state cascade-on-delete plumbing
 * (foundational scaffolding per plan §3) has somewhere to write to.
 * v0.1 has no editing, so cascade is wired but never fires.
 */

export interface UiSlice {
  ui: {
    selection: null;
    hovered: null;
    // v0.2 expands: { selection: Selection | null; hovered: EndpointRef | null;
    //   linking: { active: boolean; source?: EndpointRef } | null;
    //   multiEdgeExpanded: ReadonlySet<string> }
  };
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = () => ({
  ui: {
    selection: null,
    hovered: null,
  },
});
