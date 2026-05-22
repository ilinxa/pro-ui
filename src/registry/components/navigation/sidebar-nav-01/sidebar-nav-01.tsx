"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useCallback, useId, useImperativeHandle, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useActiveDetection } from "./hooks/use-active-detection";
import { useMatchMedia, resolveBreakpointQuery } from "./hooks/use-match-media";
import { useSidebarReducer } from "./hooks/use-sidebar-reducer";
import {
  SidebarNav01Context,
  type SidebarNav01ContextValue,
} from "./contexts/sidebar-nav-context";
import { deriveCssVars } from "./lib/derive-css-vars";
import { DefaultLink } from "./parts/default-link";
import { NavBrand } from "./parts/nav-brand";
import { NavPrimaryAction } from "./parts/nav-primary-action";
import { NavUser } from "./parts/nav-user";
import { SidebarNavList } from "./parts/sidebar-nav-list";
import type {
  NavItem,
  SidebarNav01Handle,
  SidebarNav01Props,
  SidebarNav01StateValue,
} from "./types";

/** Breakpoint → CSS class lookup (L44 — CSS-gated, not JS-gated rendering). */
const BREAKPOINT_DESKTOP_VISIBLE: Record<string, string> = {
  sm: "sm:flex",
  md: "md:flex",
  lg: "lg:flex",
  xl: "xl:flex",
  "2xl": "2xl:flex",
};
const BREAKPOINT_MOBILE_VISIBLE: Record<string, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
  "2xl": "2xl:hidden",
};

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
    renderBadge,
    renderTooltipContent,
    brandSlot,
    brand,
    headerSlot,
    navAccessorySlot,
    primaryActionSlot,
    primaryAction,
    footerSlot,
    footer,
    side = "left",
    activeVariant = "fill",
    collapsedWidth,
    expandedWidth,
    transitionDuration,
    style,
    mobileBreakpoint = "lg",
    mobileDrawerSide,
    drawerHeaderSlot,
    ref: externalRef,
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

  // Breakpoint resolution — CSS class names for the L44 CSS-gated render path.
  // `useMatchMedia` returns the live mobile state for JS BEHAVIOR gating only
  // (e.g., autoCloseMobileOnNavigate timing decisions — actual visual swap is
  // CSS-driven, no SSR flash).
  const desktopVisibleClass =
    typeof mobileBreakpoint === "string" &&
    mobileBreakpoint in BREAKPOINT_DESKTOP_VISIBLE
      ? BREAKPOINT_DESKTOP_VISIBLE[mobileBreakpoint]
      : "lg:flex";
  const mobileVisibleClass =
    typeof mobileBreakpoint === "string" &&
    mobileBreakpoint in BREAKPOINT_MOBILE_VISIBLE
      ? BREAKPOINT_MOBILE_VISIBLE[mobileBreakpoint]
      : "lg:hidden";

  const isMobileBehavior = useMatchMedia(resolveBreakpointQuery(mobileBreakpoint));

  const closeMobile = useCallback(() => {
    // Only fire when the consumer is actually on mobile (defensive gate).
    if (!isMobileBehavior) return;
    dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "item-click" });
  }, [dispatch, isMobileBehavior]);

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

  // Attach the imperative handle to the consumer-supplied ref (React 19
  // ref-as-prop pattern; no forwardRef needed). This is what makes
  // <SidebarNav01 ref={ref}> + <SidebarNav01Trigger controls={ref}> actually work.
  useImperativeHandle(externalRef, () => handle, [handle]);

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

  // Shared inner chrome — used by BOTH desktop <nav> and mobile <Sheet>.
  // Single source of truth for the header / list / footer composition.
  //
  // Header-row visibility rules:
  //   desktop: ALWAYS renders (defaultAccessory always available unless
  //            consumer explicitly passes navAccessorySlot={null} to hide it
  //            AND supplies neither header nor brand → only then suppressed)
  //   mobile: renders only when drawerHeaderSlot OR headerSlot OR resolvedBrand
  //           supplied (mobile drawer has no collapse toggle — sheet close
  //           button handles that)
  // Slot-vs-config resolution (L13): slot wins over shorthand config
  const resolvedBrand = brandSlot ?? (brand ? <NavBrand {...brand} /> : null);
  const resolvedPrimaryAction =
    primaryActionSlot ?? (primaryAction ? <NavPrimaryAction {...primaryAction} /> : null);
  const resolvedFooter = footerSlot ?? (footer ? <NavUser {...footer} /> : null);

  const desktopAccessory =
    navAccessorySlot === null ? null : (navAccessorySlot ?? defaultAccessory);
  const showDesktopHeader =
    !!headerSlot || !!resolvedBrand || desktopAccessory !== null;
  const showMobileHeader = !!drawerHeaderSlot || !!headerSlot || !!resolvedBrand;

  const renderInnerChrome = (mode: "desktop" | "mobile") => (
    <>
      {/* Brand / header zone */}
      {(mode === "desktop" ? showDesktopHeader : showMobileHeader) && (
        <div className="flex items-center gap-2 border-b border-border p-3 min-h-14">
          {mode === "mobile" && drawerHeaderSlot ? (
            <div className="contents">{drawerHeaderSlot}</div>
          ) : (
            <>
              {headerSlot && <div className="contents">{headerSlot}</div>}
              {resolvedBrand && <div className="flex-1 min-w-0">{resolvedBrand}</div>}
              {!resolvedBrand && !headerSlot && <div className="flex-1" aria-hidden />}
              {mode === "desktop" && desktopAccessory !== null && (
                <div className="ml-auto shrink-0">{desktopAccessory}</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Nav list */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
        <SidebarNavList
          entries={visible.entries}
          activeItemId={active.item?.id ?? null}
          isCollapsed={mode === "mobile" ? false : state.collapsed}
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
          renderBadge={renderBadge}
          renderTooltipContent={renderTooltipContent}
        />
        {resolvedPrimaryAction && (
          <div className="pt-2">{resolvedPrimaryAction}</div>
        )}
      </div>

      {/* Footer zone */}
      {resolvedFooter && (
        <div className="border-t border-border p-3">{resolvedFooter}</div>
      )}
    </>
  );

  const drawerSide = mobileDrawerSide ?? side;

  return (
    <SidebarNav01Context.Provider value={contextValue}>
      {/* Desktop render path — CSS-hidden BELOW breakpoint (L44) */}
      <nav
        id={sidebarId}
        aria-label={ariaLabel}
        data-component="sidebar-nav-01"
        data-stage="C8-prefab-parts"
        data-collapsed={state.collapsed}
        data-mobile-open={state.mobileOpen}
        data-side={side}
        style={{ ...cssVars, ...style }}
        className={cn(
          "hidden h-full flex-col bg-card",
          desktopVisibleClass,
          // Side-aware border
          side === "left" ? "border-r" : "border-l",
          "border-border",
          // CSS-var-driven width + motion-safe transition
          "data-[collapsed=false]:w-(--ilinxa-sidebar-w-expanded)",
          "data-[collapsed=true]:w-(--ilinxa-sidebar-w-collapsed)",
          "motion-safe:transition-[width] motion-safe:duration-(--ilinxa-sidebar-transition-duration)",
          // RTL hook
          "rtl:border-x-0",
          side === "left" ? "rtl:border-l" : "rtl:border-r",
          className,
        )}
      >
        {renderInnerChrome("desktop")}
      </nav>

      {/* Mobile render path — CSS-hidden ABOVE breakpoint */}
      <div
        className={mobileVisibleClass}
        data-component="sidebar-nav-01-mobile-wrapper"
        style={cssVars}
      >
        <Sheet
          open={state.mobileOpen}
          // F-cross-13 defensive: Radix passes (open: boolean); Base UI may pass
          // undefined or different shape. Runtime-check before dispatching.
          onOpenChange={(nextOpen: boolean | undefined) => {
            if (typeof nextOpen === "boolean") {
              dispatch({
                type: "SET_MOBILE_OPEN",
                open: nextOpen,
                reason: nextOpen ? "imperative" : "outside-click",
              });
            }
          }}
        >
          <SheetContent
            side={drawerSide}
            className="flex w-72 flex-col bg-card p-0"
            style={cssVars}
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
            {renderInnerChrome("mobile")}
          </SheetContent>
        </Sheet>
      </div>
    </SidebarNav01Context.Provider>
  );
}
