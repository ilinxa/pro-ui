"use client";

import { useEffect, useRef } from "react";
import type { SidebarReducerAction, SidebarReducerState } from "../lib/sidebar-reducer";
import {
  STORAGE_SCHEMA_VERSION,
  type StoredState,
  isStoredState,
} from "../lib/storage-schema";

/**
 * Opt-in localStorage persistence for collapse + collapsed-sections state.
 *
 * Rules (L23):
 *  • No-op when `storageKey` is undefined or `window` is unavailable (SSR).
 *  • Read on mount via useEffect — never during render (SSR-safe).
 *  • Write on state change, debounced 50ms (rapid section-toggle spam
 *    doesn't thrash localStorage).
 *  • mobileOpen is NOT persisted (transient UI, not user-preference).
 *  • Schema-versioned JSON; mismatch silently drops the stored payload.
 *  • Quota / serialization failures silently swallowed.
 */
export function useStorageSync(
  state: SidebarReducerState,
  dispatch: React.Dispatch<SidebarReducerAction>,
  storageKey: string | undefined,
): void {
  const hasReadRef = useRef(false);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read once on mount (or when storageKey changes)
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (hasReadRef.current) return;
    hasReadRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredState(parsed)) return;
      dispatch({
        type: "EXTERNAL_SYNC",
        collapsed: parsed.collapsed,
        mobileOpen: state.mobileOpen,
      });
      // Replay collapsedSectionIds via individual SET actions so each
      // section's state lands through the reducer cleanly.
      parsed.collapsedSectionIds.forEach((id) => {
        dispatch({ type: "SET_SECTION_COLLAPSED", sectionId: id, collapsed: true });
      });
    } catch {
      // Corrupted storage — silently fall back to defaults.
    }
    // Intentionally only re-runs when storageKey changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced write on state change
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (!hasReadRef.current) return; // don't write before initial read
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const payload: StoredState = {
        v: STORAGE_SCHEMA_VERSION,
        collapsed: state.collapsed,
        collapsedSectionIds: [...state.collapsedSectionIds],
      };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // Quota or serialization failure — silently ignored.
      }
    }, 50);

    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [storageKey, state.collapsed, state.collapsedSectionIds]);
}
