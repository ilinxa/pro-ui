import type { RichSidebarMobileOpenReason } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// Internal reducer state + actions
// (Internal shape — NOT exported via index.ts. Consumers interact with the
// component via the imperative handle + public RichSidebarStateValue.)
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarReducerState {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  focusedItemId: string | null;
  // L7 Defense-2 content-equality short-circuit anchor for EXTERNAL_SYNC.
  // Updated only on EXTERNAL_SYNC; never on internal transitions.
  lastSyncedSnapshot: {
    collapsed: boolean;
    mobileOpen: boolean;
  };
}

export type SidebarReducerAction =
  | { type: "SET_COLLAPSED"; collapsed: boolean }
  | { type: "TOGGLE_COLLAPSED" }
  | { type: "SET_MOBILE_OPEN"; open: boolean; reason: RichSidebarMobileOpenReason }
  | { type: "TOGGLE_MOBILE" }
  | { type: "SET_SECTION_COLLAPSED"; sectionId: string; collapsed: boolean }
  | { type: "TOGGLE_SECTION"; sectionId: string }
  | { type: "EXPAND_ALL_SECTIONS"; allSectionIds: ReadonlyArray<string> }
  | { type: "COLLAPSE_ALL_SECTIONS"; allSectionIds: ReadonlyArray<string> }
  | { type: "FOCUS_ITEM"; itemId: string | null }
  | { type: "EXTERNAL_SYNC"; collapsed: boolean; mobileOpen: boolean }
  | { type: "REPLACE_STATE"; state: SidebarReducerState };

export interface SidebarReducerInitOptions {
  defaultCollapsed?: boolean;
  defaultMobileOpen?: boolean;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
}

export function createInitialState(
  options: SidebarReducerInitOptions = {},
): SidebarReducerState {
  const collapsed = options.defaultCollapsed ?? false;
  const mobileOpen = options.defaultMobileOpen ?? false;
  return {
    collapsed,
    mobileOpen,
    collapsedSectionIds: new Set(options.defaultCollapsedSectionIds ?? []),
    focusedItemId: null,
    lastSyncedSnapshot: { collapsed, mobileOpen },
  };
}

export function sidebarReducer(
  state: SidebarReducerState,
  action: SidebarReducerAction,
): SidebarReducerState {
  switch (action.type) {
    case "SET_COLLAPSED":
      if (state.collapsed === action.collapsed) return state;
      return { ...state, collapsed: action.collapsed };

    case "TOGGLE_COLLAPSED":
      return { ...state, collapsed: !state.collapsed };

    case "SET_MOBILE_OPEN":
      if (state.mobileOpen === action.open) return state;
      return { ...state, mobileOpen: action.open };

    case "TOGGLE_MOBILE":
      return { ...state, mobileOpen: !state.mobileOpen };

    case "SET_SECTION_COLLAPSED": {
      const has = state.collapsedSectionIds.has(action.sectionId);
      if (action.collapsed && has) return state;
      if (!action.collapsed && !has) return state;
      const next = new Set(state.collapsedSectionIds);
      if (action.collapsed) next.add(action.sectionId);
      else next.delete(action.sectionId);
      return { ...state, collapsedSectionIds: next };
    }

    case "TOGGLE_SECTION": {
      const next = new Set(state.collapsedSectionIds);
      if (next.has(action.sectionId)) next.delete(action.sectionId);
      else next.add(action.sectionId);
      return { ...state, collapsedSectionIds: next };
    }

    case "EXPAND_ALL_SECTIONS":
      if (state.collapsedSectionIds.size === 0) return state;
      return { ...state, collapsedSectionIds: new Set() };

    case "COLLAPSE_ALL_SECTIONS": {
      const next = new Set(action.allSectionIds);
      // No-op if identical (rare)
      if (
        next.size === state.collapsedSectionIds.size &&
        [...next].every((id) => state.collapsedSectionIds.has(id))
      ) {
        return state;
      }
      return { ...state, collapsedSectionIds: next };
    }

    case "FOCUS_ITEM":
      if (state.focusedItemId === action.itemId) return state;
      return { ...state, focusedItemId: action.itemId };

    case "EXTERNAL_SYNC": {
      // L7 Defense 2: content-equality short-circuit
      if (
        state.lastSyncedSnapshot.collapsed === action.collapsed &&
        state.lastSyncedSnapshot.mobileOpen === action.mobileOpen
      ) {
        return state;
      }
      return {
        ...state,
        collapsed: action.collapsed,
        mobileOpen: action.mobileOpen,
        lastSyncedSnapshot: {
          collapsed: action.collapsed,
          mobileOpen: action.mobileOpen,
        },
      };
    }

    case "REPLACE_STATE":
      return action.state;

    default: {
      // Exhaustive check — TypeScript flags unhandled action types at compile time
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}
