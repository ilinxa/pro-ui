import type { HistoryEntry } from "../../types";
import type { GraphStore } from "../store/store-creator";

/**
 * Per v0.2 plan §4.4: shared push routine. Truncates the redo stack
 * (drops entries from `cursor` onward) if pushing mid-history, appends
 * the new entry, and trims the OLDEST entry when over capacity (ring
 * buffer). Updates `canUndo` / `canRedo` denormalized flags.
 *
 * Used by both the action surface (`pinNode`, `setNodePositions`) and
 * the interaction layer's drag handler — keeping them on a single
 * canonical implementation prevents history-state divergence.
 */
export function pushHistoryEntry(
  store: GraphStore,
  entry: HistoryEntry,
): void {
  store.setState((s) => {
    const capacity = s.settings.undoBufferSize;
    let entries = s.history.entries;

    if (s.history.cursor < entries.length) {
      entries = entries.slice(0, s.history.cursor);
    }

    entries = [...entries, entry];

    if (entries.length > capacity) {
      entries = entries.slice(entries.length - capacity);
    }

    const cursor = entries.length;
    return {
      history: {
        entries,
        cursor,
        canUndo: cursor > 0,
        canRedo: false,
      },
    };
  });
}
