import type { StateCreator } from "zustand";
import type { HistoryEntry } from "../../../types";

/**
 * Per v0.2 plan §4.4 + Q-P6: ring-buffer history slice.
 *
 *   - `entries`: append-only ring buffer; capacity comes from
 *     `settings.undoBufferSize` and is enforced by the action layer
 *     (this slice just carries the data).
 *   - `cursor`: index of the next entry to UNDO (i.e., `entries.length`
 *     when nothing has been undone). `cursor === 0` means undo stack
 *     empty; `cursor === entries.length` means redo stack empty.
 *   - `canUndo`, `canRedo`: denormalized flags maintained by the action
 *     layer — UI consumers subscribe to these via `useGraphSelector` for
 *     button-state flips.
 *
 * Per plan §9.4: `importSnapshot` clears history. The action wrapper
 * calls `setState({ history: { entries: [], cursor: 0, canUndo: false,
 * canRedo: false } })` after the adapter import completes.
 */
export interface HistorySlice {
  history: {
    entries: ReadonlyArray<HistoryEntry>;
    cursor: number;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export const createHistorySlice: StateCreator<
  HistorySlice,
  [],
  [],
  HistorySlice
> = () => ({
  history: {
    entries: [],
    cursor: 0,
    canUndo: false,
    canRedo: false,
  },
});
