import { useState, useSyncExternalStore } from "react";

// External store: tracks a CM6-update counter so toolbar buttons re-render only when
// CM6 fires a relevant update (selection-change or doc-change), not on every keystroke
// at the React level (plan §4.4).
export interface ToolbarStore {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => number;
  notify: () => void;
}

export function createToolbarStore(): ToolbarStore {
  let version = 0;
  const listeners = new Set<() => void>();
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getSnapshot() {
      return version;
    },
    notify() {
      version++;
      listeners.forEach((cb) => cb());
    },
  };
}

export function useToolbarStore(): ToolbarStore {
  const [store] = useState(createToolbarStore);
  return store;
}

export function useToolbarVersion(store: ToolbarStore): number {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
