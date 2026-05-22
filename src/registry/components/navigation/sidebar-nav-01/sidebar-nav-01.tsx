"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useCallback, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useActiveDetection } from "./hooks/use-active-detection";
import { useSidebarReducer } from "./hooks/use-sidebar-reducer";
import {
  SidebarNav01Context,
  type SidebarNav01ContextValue,
} from "./contexts/sidebar-nav-context";
import { deriveCssVars } from "./lib/derive-css-vars";
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
    onSectionToggle,
    autoCloseMobileOnNavigate = true,
    keepEmptySections = false,
    permissions,
    renderItem,
    renderSection,
    brandSlot,
    headerSlot,
    navAccessorySlot,
    primaryActionSlot,
    footerSlot,
    side = "left",
    activeVariant = "fill",
    collapsedWidth,
    expandedWidth,
    transitionDuration,
    style,
  } = props;

  // L32: id defaults via useId() for <SidebarNavTrigger aria-controls>
  const autoId = useId();
  const sidebarId = idProp ?? `sidebar-nav-01-${autoId}`;

  // Section-collapse init priority (plan §8): explicit prop > per-section
  // defaultCollapsed. Storage rehydration (C11) will outrank both via
  // EXTERNAL_SYNC after mount.
  const initialCollapsedSectionIds = useMemo(() => {
    if (defaultCollapsedSectionIds) return defaultCollapsedSectionIds;
    const fromItems: string[] = [];
    for (const entry of items) {
      if (entry.kind === "section" && entry.defaultCollapsed) {
        fromItems.push(entry.id);
      }
    }
    return fromItems;
  }, [defaultCollapsedSectionIds, items]);

  // Reducer + Defense-1 + Defense-2 wiring
  const { state, dispatch } = useSidebarReducer({
    defaultCollapsed,
    defaultMobileOpen,
    defaultCollapsedSectionIds: initialCollapsedSectionIds,
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

  const toggleSection = useCallback(
    (sectionId: string) => {
      dispatch({ type: "TOGGLE_SECTION", sectionId });
    },
    [dispatch],
  );

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

  const cssVars = useMemo(
    () => deriveCssVars({ collapsedWidth, expandedWidth, transitionDuration }),
    [collapsedWidth, expandedWidth, transitionDuration],
  );

  const defaultAccessory = (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_COLLAPSED" })}
      aria-label={state.collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!state.collapsed}
      aria-controls={sidebarId}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      )}
    >
      {state.collapsed ? (
        <PanelLeft className="h-4 w-4" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <SidebarNav01Context.Provider value={contextValue}>
      <nav
        id={sidebarId}
        aria-label={ariaLabel}
        data-component="sidebar-nav-01"
        data-stage="C5-collapse-vars-variants"
        data-collapsed={state.collapsed}
        data-mobile-open={state.mobileOpen}
        data-side={side}
        style={{ ...cssVars, ...style }}
        className={cn(
          "flex h-full flex-col bg-card",
          // Side-aware border
          side === "left" ? "border-r" : "border-l",
          "border-border",
          // CSS-var-driven width + motion-safe transition
          "data-[collapsed=false]:w-[var(--ilinxa-sidebar-w-expanded)]",
          "data-[collapsed=true]:w-[var(--ilinxa-sidebar-w-collapsed)]",
          "motion-safe:transition-[width] motion-safe:duration-[var(--ilinxa-sidebar-transition-duration)]",
          // RTL hook — when consumer sets dir="rtl", border swaps with logical side
          "rtl:border-x-0",
          side === "left" ? "rtl:border-l" : "rtl:border-r",
          className,
        )}
      >
        {/* Brand / header zone */}
        {(headerSlot || brandSlot || navAccessorySlot !== null) && (
          <div className="flex items-center gap-2 border-b border-border p-3 min-h-14">
            {headerSlot && <div className="contents">{headerSlot}</div>}
            {brandSlot && <div className="flex-1 min-w-0">{brandSlot}</div>}
            {!brandSlot && !headerSlot && <div className="flex-1" aria-hidden />}
            <div className="ml-auto shrink-0">
              {navAccessorySlot ?? defaultAccessory}
            </div>
          </div>
        )}
        {/* If no brand/header content was supplied, still render a collapse-toggle row */}
        {!headerSlot && !brandSlot && navAccessorySlot === undefined && (
          <div className="flex items-center justify-end gap-2 p-3 min-h-14">
            {defaultAccessory}
          </div>
        )}

        {/* Nav list */}
        <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
          <SidebarNavList
            entries={visible.entries}
            activeItemId={active.item?.id ?? null}
            isCollapsed={state.collapsed}
            linkComponent={linkComponent}
            activeVariant={activeVariant}
            autoCloseMobileOnNavigate={autoCloseMobileOnNavigate}
            isMobileOpen={state.mobileOpen}
            onCloseMobile={closeMobile}
            collapsedSectionIds={state.collapsedSectionIds}
            onToggleSection={toggleSection}
            onItemClick={onItemClick}
            onItemNavigate={onItemNavigate}
            onSectionToggle={onSectionToggle}
            renderItem={renderItem}
            renderSection={renderSection}
          />

          {/* Primary action zone — full <NavPrimaryAction> + shorthand in C8 */}
          {primaryActionSlot && <div className="pt-2">{primaryActionSlot}</div>}
        </div>

        {/* Footer zone — full <NavUser> + shorthand in C8 */}
        {footerSlot && (
          <div className="border-t border-border p-3">{footerSlot}</div>
        )}
      </nav>
    </SidebarNav01Context.Provider>
  );
}
