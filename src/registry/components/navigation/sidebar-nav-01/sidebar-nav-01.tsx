"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSidebarReducer } from "./hooks/use-sidebar-reducer";
import {
  SidebarNav01Context,
  type SidebarNav01ContextValue,
} from "./contexts/sidebar-nav-context";
import type {
  SidebarNav01Handle,
  SidebarNav01Props,
  SidebarNav01StateValue,
} from "./types";

/**
 * C2 placeholder.
 *
 * Reducer + context provider now wired. The component still renders a
 * minimal stub <nav> visually (real items rendering lands C3) but the
 * state machine + context bridge are live — <SidebarNav01Trigger> (C7)
 * and prefab parts (C6/C9) will read this context once they exist.
 *
 * Imperative handle wired with the C2-minimum methods (collapse + mobile
 * + section state). Full 22-method surface fills out across C3–C8 as
 * the corresponding subsystems land.
 */
export function SidebarNav01(props: SidebarNav01Props) {
  const {
    items,
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

  // Imperative handle — minimal C2 surface. Methods that depend on items
  // rendering (focusItem, getActiveItem, etc.) land in later commits.
  //
  // Built in two steps to break the `getState() returns SidebarNav01StateValue
  // which extends SidebarNav01Handle` recursive type cycle.
  const handle = useMemo<SidebarNav01Handle>(() => {
    // First: methods that don't reference the handle itself.
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

      // Items + active — stubs until C3 lands derive-visible-entries + active detection
      getItems: () => items,
      getItemById: () => undefined,
      getActiveItem: () => undefined,

      // Focus — stub until C12 keyboard handler lands
      focusItem: (itemId) => dispatch({ type: "FOCUS_ITEM", itemId }),
      focusFirstItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
      focusLastItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
    };

    // Then: assemble the full handle by adding getState() which closes
    // over the methods via the assembled handleObj.
    const handleObj: SidebarNav01Handle = {
      ...handleMethods,
      getState: (): SidebarNav01StateValue => ({
        ...handleObj,
        collapsed: state.collapsed,
        mobileOpen: state.mobileOpen,
        collapsedSectionIds: state.collapsedSectionIds,
        activeItemId: null,
        activeItem: null,
        visibleEntries: items,
      }),
    };
    return handleObj;
  }, [state, dispatch, items]);

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
        data-stage="C2-reducer-wired"
        data-collapsed={state.collapsed}
        data-mobile-open={state.mobileOpen}
        className={cn(
          "flex h-full w-64 flex-col border-r border-border bg-card p-3",
          className,
        )}
      >
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">
            SidebarNav01 — C2 (reducer + context wired)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            collapsed: <span className="font-mono">{String(state.collapsed)}</span>
            {" · "}
            mobile: <span className="font-mono">{String(state.mobileOpen)}</span>
            {" · "}
            sections collapsed:{" "}
            <span className="font-mono">{state.collapsedSectionIds.size}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-mono">{items.length}</span> items configured
            (rendering lands C3)
          </p>
        </div>
      </nav>
    </SidebarNav01Context.Provider>
  );
}
