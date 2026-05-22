"use client";

import { useCallback, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useActiveDetection } from "./hooks/use-active-detection";
import { useSidebarReducer } from "./hooks/use-sidebar-reducer";
import {
  SidebarNav01Context,
  type SidebarNav01ContextValue,
} from "./contexts/sidebar-nav-context";
import { DefaultLink } from "./parts/default-link";
import { SidebarNavList } from "./parts/sidebar-nav-list";
import type {
  NavItem,
  SidebarNav01Handle,
  SidebarNav01Props,
  SidebarNav01StateValue,
} from "./types";

/**
 * C3 — items rendering + active detection.
 *
 * Items now actually render. Active item highlighted (full-fill paint;
 * activeVariant matrix lands C5). Sections render their items inline
 * (full section UI with header lands C4). Click sequence per L28 wired.
 */
export function SidebarNav01(props: SidebarNav01Props) {
  const {
    items,
    currentPath,
    isActive,
    defaultMatch = "exact",
    linkComponent = DefaultLink,
    className,
    id: idProp,
    "aria-label": ariaLabel = "Main navigation",
    defaultCollapsed,
    defaultMobileOpen,
    defaultCollapsedSectionIds,
    isCollapsed,
    isMobileOpen,
    onCollapsedChange,
    onMobileOpenChange,
    onItemClick,
    onItemNavigate,
    autoCloseMobileOnNavigate = true,
    keepEmptySections = false,
    permissions,
    renderItem,
    brandSlot,
    headerSlot,
    primaryActionSlot,
    footerSlot,
  } = props;

  // L32: id defaults via useId() for <SidebarNavTrigger aria-controls>
  const autoId = useId();
  const sidebarId = idProp ?? `sidebar-nav-01-${autoId}`;

  // Reducer + Defense-1 + Defense-2 wiring
  const { state, dispatch } = useSidebarReducer({
    defaultCollapsed,
    defaultMobileOpen,
    defaultCollapsedSectionIds,
    isCollapsed,
    isMobileOpen,
    onCollapsedChange,
    onMobileOpenChange,
  });

  // Items pipeline: derive visible entries → compute active item
  const { visible, active } = useActiveDetection({
    items,
    currentPath,
    isActive,
    defaultMatch,
    permissions,
    keepEmptySections,
  });

  const closeMobile = useCallback(() => {
    dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "item-click" });
  }, [dispatch]);

  // Imperative handle — refreshed with items + active-detection results
  const handle = useMemo<SidebarNav01Handle>(() => {
    const itemsLookup = new Map<string, NavItem>();
    for (const entry of visible.entries) {
      if (entry.kind === "section") {
        for (const child of entry.items) itemsLookup.set(child.id, child);
      } else if (entry.kind !== "separator") {
        itemsLookup.set(entry.id, entry);
      }
    }

    const handleMethods: Omit<SidebarNav01Handle, "getState"> = {
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

      // Items + active (now backed by real derivation)
      getItems: () => items,
      getItemById: (id) => itemsLookup.get(id),
      getActiveItem: () => active.item ?? undefined,

      // Focus — stub until C12 keyboard handler lands
      focusItem: (itemId) => dispatch({ type: "FOCUS_ITEM", itemId }),
      focusFirstItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
      focusLastItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
    };

    const handleObj: SidebarNav01Handle = {
      ...handleMethods,
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

  const contextValue = useMemo<SidebarNav01ContextValue>(
    () => ({ state, dispatch, handle, sidebarId }),
    [state, dispatch, handle, sidebarId],
  );

  return (
    <SidebarNav01Context.Provider value={contextValue}>
      <nav
        id={sidebarId}
        aria-label={ariaLabel}
        data-component="sidebar-nav-01"
        data-stage="C3-items-rendering"
        data-collapsed={state.collapsed}
        data-mobile-open={state.mobileOpen}
        className={cn(
          "flex h-full w-64 flex-col border-r border-border bg-card",
          className,
        )}
      >
        {/* Brand / header zone — C3 placeholder; full <NavBrand> + headerSlot in C9 */}
        {(headerSlot || brandSlot) && (
          <div className="border-b border-border p-3">
            {headerSlot}
            {brandSlot}
          </div>
        )}

        {/* Nav list */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <SidebarNavList
            entries={visible.entries}
            activeItemId={active.item?.id ?? null}
            isCollapsed={state.collapsed}
            linkComponent={linkComponent}
            autoCloseMobileOnNavigate={autoCloseMobileOnNavigate}
            isMobileOpen={state.mobileOpen}
            onCloseMobile={closeMobile}
            onItemClick={onItemClick}
            onItemNavigate={onItemNavigate}
            renderItem={renderItem}
          />

          {/* Primary action zone — full <NavPrimaryAction> + shorthand in C9 */}
          {primaryActionSlot && <div className="pt-2">{primaryActionSlot}</div>}
        </div>

        {/* Footer zone — full <NavUser> + shorthand in C9 */}
        {footerSlot && (
          <div className="border-t border-border p-3">{footerSlot}</div>
        )}
      </nav>
    </SidebarNav01Context.Provider>
  );
}
