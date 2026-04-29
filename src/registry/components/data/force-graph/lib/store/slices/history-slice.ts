import type { StateCreator } from "zustand";

/**
 * Per plan §3 + §7.2: history slice is SCAFFOLDED in v0.1 with minimal
 * shape; ring-buffer + composite transactional entries land in v0.2.
 */

export interface HistorySlice {
  history: {
    entries: never[];
    cursor: number;
    // v0.2 expands: { entries: HistoryEntry[]; cursor: number; capacity: number }
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
  },
});
