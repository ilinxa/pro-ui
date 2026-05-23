"use client";

import { useEffect, useMemo } from "react";
import type {
  NavEntry,
  RichSidebarHandle,
  RichSidebarStateValue,
  UseRichSidebarStateOptions,
} from "../types";
import { buildHandle } from "../lib/build-handle";
import { useActiveDetection } from "./use-active-detection";
import { useSidebarReducer } from "./use-sidebar-reducer";
import { useStorageSync } from "./use-storage-sync";

/**
 * Headless state hook — public API (L16).
 *
 * Returns a RichSidebarStateValue (superset of RichSidebarHandle plus
 * live state fields). Consumers using slots heavily OR building their
 * own UI lift state via this hook and pass it back to `<RichSidebar>`
 * via the `state` prop (which wins over individual props per L30).
 *
 * `<RichSidebar>` calls this hook internally too — the public hook is
 * the durable composition seam, not a parallel state machine.
 */
export function useRichSidebarState(
  options: UseRichSidebarStateOptions = {},
): RichSidebarStateValue {
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

  // v0.3.0 (C5, F5): delegated to the shared `buildHandle` factory. Identical
  // factory consumed by `rich-sidebar.tsx` so the two state paths can't drift.
  const handle = useMemo<RichSidebarHandle>(
    () => buildHandle({ state, dispatch, items, visible, active }),
    [state, dispatch, items, visible, active],
  );

  return useMemo<RichSidebarStateValue>(
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
