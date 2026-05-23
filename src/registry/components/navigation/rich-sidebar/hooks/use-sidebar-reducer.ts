import { useReducer, useEffect, useRef, useCallback } from "react";
import {
  type SidebarReducerAction,
  type SidebarReducerInitOptions,
  type SidebarReducerState,
  createInitialState,
  sidebarReducer,
} from "../lib/sidebar-reducer";
import type { RichSidebarEventArgs } from "../types";

export interface UseSidebarReducerOptions extends SidebarReducerInitOptions {
  // Controlled-mode props (when provided, drive state via EXTERNAL_SYNC)
  isCollapsed?: boolean;
  isMobileOpen?: boolean;

  // Defense 1 — microtask-defer for these
  onCollapsedChange?: (args: RichSidebarEventArgs["collapsedChange"]) => void;
  onMobileOpenChange?: (args: RichSidebarEventArgs["mobileOpenChange"]) => void;
}

export interface UseSidebarReducerResult {
  state: SidebarReducerState;
  dispatch: React.Dispatch<SidebarReducerAction>;
}

/**
 * Internal reducer hook.
 *
 * Three-defenses controlled-mode wiring (L7):
 *   • Defense 1 — microtask-defer onCollapsedChange / onMobileOpenChange callbacks
 *     so consumers that synchronously sync to other state can't re-enter the reducer.
 *   • Defense 2 — content-equality short-circuit on EXTERNAL_SYNC (handled inside
 *     reducer's `EXTERNAL_SYNC` case via `lastSyncedSnapshot` check).
 *   • Defense 3 — N/A for discrete boolean state (no continuous flow to suppress).
 *
 * NOT exported from index.ts — purely internal.
 */
export function useSidebarReducer(
  options: UseSidebarReducerOptions = {},
): UseSidebarReducerResult {
  const [state, dispatch] = useReducer(
    sidebarReducer,
    {
      defaultCollapsed: options.defaultCollapsed,
      defaultMobileOpen: options.defaultMobileOpen,
      defaultCollapsedSectionIds: options.defaultCollapsedSectionIds,
    },
    createInitialState,
  );

  // Latest-ref pattern for callbacks (avoid stale closures in microtask defers)
  const onCollapsedChangeRef = useRef(options.onCollapsedChange);
  const onMobileOpenChangeRef = useRef(options.onMobileOpenChange);
  useEffect(() => {
    onCollapsedChangeRef.current = options.onCollapsedChange;
    onMobileOpenChangeRef.current = options.onMobileOpenChange;
  });

  // Controlled-mode → reducer sync (Defense 2 short-circuit inside reducer)
  useEffect(() => {
    if (options.isCollapsed === undefined && options.isMobileOpen === undefined) {
      return;
    }
    dispatch({
      type: "EXTERNAL_SYNC",
      collapsed: options.isCollapsed ?? state.collapsed,
      mobileOpen: options.isMobileOpen ?? state.mobileOpen,
    });
    // Intentionally NOT including state.* — this effect ONLY fires on controlled
    // prop changes; internal state changes shouldn't loop back through here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.isCollapsed, options.isMobileOpen]);

  // Defense 1 — fire change callbacks via microtask defer when state mutates.
  // Skipped when state matches lastSyncedSnapshot (= the change came from
  // EXTERNAL_SYNC, not an internal action → consumer already knows).
  const prevCollapsedRef = useRef(state.collapsed);
  const prevMobileOpenRef = useRef(state.mobileOpen);
  useEffect(() => {
    if (prevCollapsedRef.current !== state.collapsed) {
      const next = state.collapsed;
      prevCollapsedRef.current = next;
      // Skip if this transition came from EXTERNAL_SYNC (consumer originated it)
      if (state.lastSyncedSnapshot.collapsed !== next) {
        queueMicrotask(() => {
          onCollapsedChangeRef.current?.({ collapsed: next });
        });
      }
    }
    if (prevMobileOpenRef.current !== state.mobileOpen) {
      const next = state.mobileOpen;
      prevMobileOpenRef.current = next;
      if (state.lastSyncedSnapshot.mobileOpen !== next) {
        // v0.3.0 (C2, L53): read the reason the dispatching action wrote into
        // reducer state. EXTERNAL_SYNC resets to "imperative" on transition;
        // SET/TOGGLE write the explicit reason; the no-op guard in the reducer
        // prevents re-entry from Sheet's onOpenChange from overwriting.
        const reason = state.lastMobileOpenReason ?? "imperative";
        queueMicrotask(() => {
          onMobileOpenChangeRef.current?.({
            open: next,
            reason,
          });
        });
      }
    }
  }, [state.collapsed, state.mobileOpen, state.lastSyncedSnapshot, state.lastMobileOpenReason]);

  // Stable dispatch (useReducer's dispatch is already stable; wrap for symmetry)
  const stableDispatch = useCallback<React.Dispatch<SidebarReducerAction>>(
    (action) => dispatch(action),
    [],
  );

  return { state, dispatch: stableDispatch };
}
