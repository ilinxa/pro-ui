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
 *  • v0.5.0 (AS1) — while `collapsed` is CONTROLLED (`isCollapsed` defined) the
 *    hook neither reads nor writes it: the host owns that value (cookie, server
 *    state). Section state still persists, and the stored `collapsed` is carried
 *    over untouched so an uncontrolled mount later still finds it.
 */
export function useStorageSync(
  state: SidebarReducerState,
  dispatch: React.Dispatch<SidebarReducerAction>,
  storageKey: string | undefined,
  collapsedControlled = false,
): void {
  const hasReadRef = useRef(false);
  const readKeyRef = useRef<string | undefined>(undefined);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storedCollapsedRef = useRef<boolean | null>(null);
  const collapsedControlledRef = useRef(collapsedControlled);
  useEffect(() => {
    collapsedControlledRef.current = collapsedControlled;
  });

  // Read once on mount (or when storageKey changes)
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    // Read once per key (StrictMode re-mounts must not re-read; a NEW key must).
    if (hasReadRef.current && readKeyRef.current === storageKey) return;
    hasReadRef.current = true;
    readKeyRef.current = storageKey;
    storedCollapsedRef.current = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredState(parsed)) return;
      storedCollapsedRef.current = parsed.collapsed;
      if (!collapsedControlledRef.current) {
        dispatch({
          type: "EXTERNAL_SYNC",
          collapsed: parsed.collapsed,
          mobileOpen: state.mobileOpen,
        });
      }
      // v0.3.1 (review): whole-set REPLACE, not per-id collapse replay.
      // The old per-id SET-collapsed loop could only ADD collapses — a
      // section the user had EXPANDED (i.e. removed from the stored array,
      // but present in defaultCollapsedSectionIds) re-collapsed on every
      // reload because its default-collapsed state was never cleared.
      dispatch({
        type: "COLLAPSE_ALL_SECTIONS",
        allSectionIds: parsed.collapsedSectionIds,
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
      const collapsed = collapsedControlled
        ? (storedCollapsedRef.current ?? state.collapsed)
        : state.collapsed;
      if (!collapsedControlled) storedCollapsedRef.current = collapsed;
      const payload: StoredState = {
        v: STORAGE_SCHEMA_VERSION,
        collapsed,
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
  }, [storageKey, state.collapsed, state.collapsedSectionIds, collapsedControlled]);
}
