/**
 * 0.6.0 (SV18) — tiny external store for the CURRENT item's progress.
 *
 * The 50 ms timer tick and the ~4 Hz media time updates used to live in the
 * root's React state, so the whole viewer re-rendered on every tick. They now
 * land here; only the components that subscribe (the progress bars, the
 * `renderProgress` slot wrapper) re-render. Values are tagged with the item key
 * they belong to, so a stale value from the previous item can never leak into
 * the next one.
 */
export interface ProgressSnapshot {
  timerKey: string;
  timerPct: number;
  mediaKey: string;
  mediaPct: number;
}

export interface ProgressStore {
  get: () => ProgressSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Timer-driven progress (images, explicit durations, fallback). */
  setTimer: (key: string, pct: number) => void;
  /** Media-driven progress (video time). Never moves backward within an item. */
  setMedia: (key: string, pct: number) => void;
  /** Drop any media progress (item re-entered / viewer reopened). */
  resetMedia: () => void;
}

export function createProgressStore(): ProgressStore {
  let snap: ProgressSnapshot = { timerKey: "", timerPct: 0, mediaKey: "", mediaPct: 0 };
  const listeners = new Set<() => void>();
  const commit = (next: ProgressSnapshot) => {
    snap = next;
    listeners.forEach((l) => l());
  };
  return {
    get: () => snap,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setTimer: (key, pct) => {
      if (snap.timerKey === key && snap.timerPct === pct) return;
      commit({ ...snap, timerKey: key, timerPct: pct });
    },
    setMedia: (key, pct) => {
      if (snap.mediaKey === key && snap.mediaPct >= pct) return;
      commit({ ...snap, mediaKey: key, mediaPct: pct });
    },
    resetMedia: () => {
      if (snap.mediaKey === "" && snap.mediaPct === 0) return;
      commit({ ...snap, mediaKey: "", mediaPct: 0 });
    },
  };
}

export interface ProgressSelection {
  itemKey: string;
  /** The item can start counting (0.5.4 ready gate). */
  isReady: boolean;
  /** The video's own media time drives the bar. */
  mediaDriven: boolean;
}

/** The percentage (0-100) the current bar shows for a snapshot. */
export function selectProgress(snap: ProgressSnapshot, sel: ProgressSelection): number {
  if (!sel.isReady) return 0;
  if (sel.mediaDriven) return snap.mediaKey === sel.itemKey ? snap.mediaPct : 0;
  return snap.timerKey === sel.itemKey ? snap.timerPct : 0;
}
