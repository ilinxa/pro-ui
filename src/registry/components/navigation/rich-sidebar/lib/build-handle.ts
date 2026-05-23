import type { ActiveItemResult } from "./compute-active-item";
import type { VisibleEntriesResult } from "./derive-visible-entries";
import type {
  SidebarReducerAction,
  SidebarReducerState,
} from "./sidebar-reducer";
import type {
  NavEntry,
  NavItem,
  RichSidebarHandle,
  RichSidebarStateValue,
} from "../types";

/**
 * Build the imperative handle exposed to consumers (`ref` + `<RichSidebar state={…}>`).
 *
 * Shared by:
 *  - `rich-sidebar.tsx` — the component's own `useImperativeHandle` target.
 *  - `hooks/use-sidebar-nav-state.ts` — the headless `useRichSidebarState()` hook.
 *
 * v0.3.0 (C5, F5): extracted from two near-identical inline builders that had
 * silently drifted between v0.2 bumps. Single source of truth.
 *
 * NOT exported from `index.ts` — internal-only. Consumers interact via the
 * handle object or the public `useRichSidebarState()` return value.
 */
export function buildHandle(deps: {
  state: SidebarReducerState;
  dispatch: React.Dispatch<SidebarReducerAction>;
  items: ReadonlyArray<NavEntry>;
  visible: VisibleEntriesResult;
  active: ActiveItemResult;
}): RichSidebarHandle {
  const { state, dispatch, items, visible, active } = deps;

  // Lookup table for getItemById — uses visible.entries so consumers don't
  // resolve items hidden by permission / ownerOnly / minMembers gates.
  const itemsLookup = new Map<string, NavItem>();
  for (const entry of visible.entries) {
    if (entry.kind === "section") {
      for (const child of entry.items) itemsLookup.set(child.id, child);
    } else if (entry.kind !== "separator") {
      itemsLookup.set(entry.id, entry);
    }
  }

  const methods: Omit<RichSidebarHandle, "getState"> = {
    // Collapse
    toggleCollapse: () => dispatch({ type: "TOGGLE_COLLAPSED" }),
    setCollapsed: (next) =>
      dispatch({ type: "SET_COLLAPSED", collapsed: next }),
    isCollapsed: () => state.collapsed,

    // Mobile drawer — v0.3.0 (C2, L54) reason? plumbing.
    openMobile: (reason) =>
      dispatch({
        type: "SET_MOBILE_OPEN",
        open: true,
        reason: reason ?? "imperative",
      }),
    closeMobile: (reason) =>
      dispatch({
        type: "SET_MOBILE_OPEN",
        open: false,
        reason: reason ?? "imperative",
      }),
    // TOGGLE_MOBILE (NOT a translated SET) so the reducer reads FRESH
    // state.mobileOpen — handles rapid same-tick double-clicks correctly
    // (a translated SET would use closure-captured stale state and the
    // reducer's no-op guard would drop the second dispatch).
    toggleMobile: (reason) =>
      dispatch({ type: "TOGGLE_MOBILE", reason }),
    isMobileOpen: () => state.mobileOpen,

    // Section state — v0.3.0 (C5, F8): no allSectionIds payload on EXPAND.
    toggleSection: (sectionId) =>
      dispatch({ type: "TOGGLE_SECTION", sectionId }),
    expandSection: (sectionId) =>
      dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: false }),
    collapseSection: (sectionId) =>
      dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: true }),
    expandAllSections: () => dispatch({ type: "EXPAND_ALL_SECTIONS" }),
    collapseAllSections: () => {
      // v0.3.0 (C5, F9): source from visible.entries (post-filter) so we
      // don't collapse sections the user can't see.
      const ids = visible.entries
        .filter((e) => "kind" in e && e.kind === "section")
        .map((e) => (e as { id: string }).id);
      dispatch({ type: "COLLAPSE_ALL_SECTIONS", allSectionIds: ids });
    },
    isSectionCollapsed: (id) => state.collapsedSectionIds.has(id),

    // Items + active
    getItems: () => items,
    getItemById: (id) => itemsLookup.get(id),
    getActiveItem: () => active.item ?? undefined,

    // Focus
    focusItem: (itemId) => dispatch({ type: "FOCUS_ITEM", itemId }),
    focusFirstItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
    focusLastItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
  };

  const handleObj: RichSidebarHandle = {
    ...methods,
    getState: (): RichSidebarStateValue => ({
      ...handleObj,
      collapsed: state.collapsed,
      mobileOpen: state.mobileOpen,
      collapsedSectionIds: state.collapsedSectionIds,
      activeItemId: active.item?.id ?? null,
      activeItem: active.item,
      visibleEntries: visible.entries,
    }),
  };
  return handleObj;
}
