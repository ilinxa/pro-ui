"use client";

import { useEffect, useMemo } from "react";
import type {
  NavEntry,
  NavItem,
  SidebarNav01Handle,
  SidebarNav01StateValue,
  UseSidebarNav01StateOptions,
} from "../types";
import { useActiveDetection } from "./use-active-detection";
import { useSidebarReducer } from "./use-sidebar-reducer";
import { useStorageSync } from "./use-storage-sync";

/**
 * Headless state hook — public API (L16).
 *
 * Returns a SidebarNav01StateValue (superset of SidebarNav01Handle plus
 * live state fields). Consumers using slots heavily OR building their
 * own UI lift state via this hook and pass it back to `<SidebarNav01>`
 * via the `state` prop (which wins over individual props per L30).
 *
 * `<SidebarNav01>` calls this hook internally too — the public hook is
 * the durable composition seam, not a parallel state machine.
 */
export function useSidebarNav01State(
  options: UseSidebarNav01StateOptions = {},
): SidebarNav01StateValue {
  const items = options.items ?? EMPTY_ITEMS;

  // Section-collapse init priority: explicit prop > per-section
  // defaultCollapsed field. Storage rehydration outranks both via
  // EXTERNAL_SYNC after mount.
  const initialCollapsedSectionIds = useMemo(() => {
    if (options.defaultCollapsedSectionIds) {
      return options.defaultCollapsedSectionIds;
    }
    const fromItems: string[] = [];
    for (const entry of items) {
      if (entry.kind === "section" && entry.defaultCollapsed) {
        fromItems.push(entry.id);
      }
    }
    return fromItems;
  }, [options.defaultCollapsedSectionIds, items]);

  const { state, dispatch } = useSidebarReducer({
    defaultCollapsed: options.defaultCollapsed,
    defaultMobileOpen: options.defaultMobileOpen,
    defaultCollapsedSectionIds: initialCollapsedSectionIds,
  });

  // localStorage opt-in
  useStorageSync(state, dispatch, options.storageKey);

  // Active detection (filtered visible entries + active item)
  const { visible, active } = useActiveDetection({
    items,
    currentPath: options.currentPath ?? "",
    isActive: options.isActive,
    defaultMatch: options.defaultMatch,
    permissions: options.permissions,
  });

  // F1 — auto-expand section containing the active item (L48-b)
  const autoExpandActiveSection = options.autoExpandActiveSection ?? true;
  useEffect(() => {
    if (!autoExpandActiveSection) return;
    if (!active.sectionId) return;
    if (!state.collapsedSectionIds.has(active.sectionId)) return;
    dispatch({
      type: "SET_SECTION_COLLAPSED",
      sectionId: active.sectionId,
      collapsed: false,
    });
  }, [
    autoExpandActiveSection,
    active.sectionId,
    state.collapsedSectionIds,
    dispatch,
  ]);

  // Build the imperative handle (two-step to break recursive type cycle)
  const handle = useMemo<SidebarNav01Handle>(() => {
    const itemsLookup = new Map<string, NavItem>();
    for (const entry of visible.entries) {
      if (entry.kind === "section") {
        for (const child of entry.items) itemsLookup.set(child.id, child);
      } else if (entry.kind !== "separator") {
        itemsLookup.set(entry.id, entry);
      }
    }

    const methods: Omit<SidebarNav01Handle, "getState"> = {
      // Collapse
      toggleCollapse: () => dispatch({ type: "TOGGLE_COLLAPSED" }),
      setCollapsed: (next) => dispatch({ type: "SET_COLLAPSED", collapsed: next }),
      isCollapsed: () => state.collapsed,
      // Mobile drawer
      openMobile: () =>
        dispatch({ type: "SET_MOBILE_OPEN", open: true, reason: "imperative" }),
      closeMobile: () =>
        dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "imperative" }),
      toggleMobile: () => dispatch({ type: "TOGGLE_MOBILE" }),
      isMobileOpen: () => state.mobileOpen,
      // Section state
      toggleSection: (sectionId) => dispatch({ type: "TOGGLE_SECTION", sectionId }),
      expandSection: (sectionId) =>
        dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: false }),
      collapseSection: (sectionId) =>
        dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: true }),
      expandAllSections: () =>
        dispatch({ type: "EXPAND_ALL_SECTIONS", allSectionIds: [] }),
      collapseAllSections: () => {
        const ids = items
          .filter((e) => "kind" in e && e.kind === "section")
          .map((e) => (e as { id: string }).id);
        dispatch({ type: "COLLAPSE_ALL_SECTIONS", allSectionIds: ids });
      },
      isSectionCollapsed: (id) => state.collapsedSectionIds.has(id),
      // Items + active
      getItems: () => items,
      getItemById: (id) => itemsLookup.get(id),
      getActiveItem: () => active.item ?? undefined,
      // Focus — stub until C11 keyboard handler lands
      focusItem: (itemId) => dispatch({ type: "FOCUS_ITEM", itemId }),
      focusFirstItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
      focusLastItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
    };

    const handleObj: SidebarNav01Handle = {
      ...methods,
      getState: (): SidebarNav01StateValue => ({
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
  }, [state, dispatch, items, visible, active]);

  return useMemo<SidebarNav01StateValue>(
    () => ({
      ...handle,
      collapsed: state.collapsed,
      mobileOpen: state.mobileOpen,
      collapsedSectionIds: state.collapsedSectionIds,
      activeItemId: active.item?.id ?? null,
      activeItem: active.item,
      visibleEntries: visible.entries,
    }),
    [handle, state, active, visible],
  );
}

const EMPTY_ITEMS: ReadonlyArray<NavEntry> = [];
