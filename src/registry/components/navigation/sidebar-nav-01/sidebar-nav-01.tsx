"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useActiveDetection } from "./hooks/use-active-detection";
import { useMatchMedia, resolveBreakpointQuery } from "./hooks/use-match-media";
import { useSidebarReducer } from "./hooks/use-sidebar-reducer";
import { useStorageSync } from "./hooks/use-storage-sync";
import {
  SidebarNav01Context,
  type SidebarNav01ContextValue,
} from "./contexts/sidebar-nav-context";
import { deriveCssVars } from "./lib/derive-css-vars";
import { flattenEntriesForKeyboard } from "./lib/flatten-entries";
import { handleSidebarKeydown } from "./lib/keyboard-handler";
import { DefaultLink } from "./parts/default-link";
import { NavBrand } from "./parts/nav-brand";
import { NavPrimaryAction } from "./parts/nav-primary-action";
import { NavUser } from "./parts/nav-user";
import { SidebarEmptyState } from "./parts/sidebar-empty-state";
import { SidebarLoadingSkeleton } from "./parts/sidebar-loading-skeleton";
import { SidebarNavList } from "./parts/sidebar-nav-list";
import { SidebarSkipLink } from "./parts/sidebar-skip-link";
import type {
  NavItem,
  SidebarNav01EmptyReason,
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
    renderLoading,
    renderEmptyState,
    loading = false,
    state: externalState,
    storageKey,
    autoExpandActiveSection = true,
    autoScrollActiveIntoView = true,
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
    skipLinkTarget,
    skipLinkLabel = "Skip to content",
    onPermissionDenied,
    onSkipLinkActivated,
    // TODO(C12): wire onBrandClick / onPrimaryActionClick / onFooterTriggerOpen
    // / onFooterMenuItemClick events through prefab configs. For now slot-based
    // usage fires consumer's own handlers; component-level events deferred.
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

  // localStorage opt-in (L23). Per L43: when external `state` provided,
  // the hook owns storageKey; component's storageKey is ignored + dev warn.
  const effectiveStorageKey = externalState ? undefined : storageKey;
  if (
    externalState &&
    storageKey &&
    process.env.NODE_ENV !== "production"
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "[sidebar-nav-01] `storageKey` is ignored when `state` (lifted hook) is provided — the hook owns persistence (L43). Move storageKey to useSidebarNav01State() options.",
    );
  }
  useStorageSync(state, dispatch, effectiveStorageKey);

  // Items pipeline: derive visible entries → compute active item
  const { visible, active } = useActiveDetection({
    items,
    currentPath,
    isActive,
    defaultMatch,
    permissions,
    keepEmptySections,
  });

  // F1 — auto-expand section containing the active item (L48-b).
  // When external state is provided, the hook (useSidebarNav01State)
  // owns F1; component-internal effect skipped to avoid double-firing.
  useEffect(() => {
    if (externalState) return;
    if (!autoExpandActiveSection) return;
    if (!active.sectionId) return;
    if (!state.collapsedSectionIds.has(active.sectionId)) return;
    dispatch({
      type: "SET_SECTION_COLLAPSED",
      sectionId: active.sectionId,
      collapsed: false,
    });
  }, [
    externalState,
    autoExpandActiveSection,
    active.sectionId,
    state.collapsedSectionIds,
    dispatch,
  ]);

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

  // closeMobile / toggleSection are wired through `finalHandle` so they
  // mutate the EXTERNAL state when one is provided, or the internal
  // reducer otherwise. Trade-off (L20 reasons): when external state,
  // the auto-close path loses the "item-click" reason discriminator —
  // `onMobileOpenChange` fires with "imperative" instead. Acceptable
  // for v0.1; a future polish commit can add `setMobileOpenWithReason`
  // to the handle if needed.

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

  // L30 — state prop precedence: external lifted state wins entirely over
  // internal reducer state. Internal reducer still computed for hooks-rules
  // compliance (L47), but its values flow through `finalCollapsed` /
  // `finalMobileOpen` / etc. only when external state isn't supplied.
  const finalCollapsed = externalState?.collapsed ?? state.collapsed;
  const finalMobileOpen = externalState?.mobileOpen ?? state.mobileOpen;
  const finalCollapsedSectionIds =
    externalState?.collapsedSectionIds ?? state.collapsedSectionIds;
  const finalActiveItem = externalState?.activeItem ?? active.item;
  const finalVisibleEntries = externalState?.visibleEntries ?? visible.entries;
  const finalHandle: SidebarNav01Handle = externalState ?? handle;

  // Flattened keyboard traversal sequence (L37). Section headers (collapsible
  // only) interleave with their items; items hide when section is collapsed.
  const keyboardFlat = useMemo(
    () =>
      flattenEntriesForKeyboard(finalVisibleEntries, finalCollapsedSectionIds),
    [finalVisibleEntries, finalCollapsedSectionIds],
  );
  const keyboardEntryId = keyboardFlat.length > 0 ? keyboardFlat[0].id : null;

  // Reducer-driven focus state. Even when external `state` is provided,
  // focus tracking lives in the internal reducer — focus is transient UI,
  // not persistable consumer state.
  const focusedItemId = state.focusedItemId;

  // L38 — onPermissionDenied diff-firing. Fire once per item initially +
  // again for any item NEWLY entering the filtered set on subsequent renders.
  // Comparison runs on each render via the ref-tracked previous set.
  const prevFilteredRef = useRef<ReadonlySet<string> | null>(null);
  useEffect(() => {
    const currentFiltered = visible.filteredByPermission;
    const currentIds = new Set(currentFiltered.map((f) => f.item.id));
    if (onPermissionDenied) {
      const prevIds = prevFilteredRef.current;
      for (const entry of currentFiltered) {
        if (prevIds === null || !prevIds.has(entry.item.id)) {
          onPermissionDenied({
            item: entry.item,
            requiredPermission: entry.requiredPermission,
          });
        }
      }
    }
    prevFilteredRef.current = currentIds;
  }, [visible.filteredByPermission, onPermissionDenied]);

  // Programmatic focus follow-up — when reducer's focusedItemId changes,
  // move DOM focus to the matching row (via `data-nav-id`). Layout effect
  // so focus lands before the browser paints, avoiding visible flashes.
  useEffect(() => {
    if (!focusedItemId) return;
    if (typeof document === "undefined") return;
    const nav = document.getElementById(sidebarId);
    if (!nav) return;
    const escaped =
      typeof window !== "undefined" && typeof window.CSS?.escape === "function"
        ? window.CSS.escape(focusedItemId)
        : focusedItemId.replace(/(["\\])/g, "\\$1");
    const target = nav.querySelector<HTMLElement>(
      `[data-nav-id="${escaped}"]`,
    );
    if (target && document.activeElement !== target) {
      target.focus();
    }
  }, [focusedItemId, sidebarId]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      handleSidebarKeydown(event, {
        flat: keyboardFlat,
        focusedId: focusedItemId,
        setFocusedId: (id) => dispatch({ type: "FOCUS_ITEM", itemId: id }),
        toggleSection: (id) => finalHandle.toggleSection(id),
        isSectionCollapsed: (id) => finalCollapsedSectionIds.has(id),
      });
    },
    [keyboardFlat, focusedItemId, dispatch, finalHandle, finalCollapsedSectionIds],
  );

  // F2 — auto-scroll active item into view on mount + currentPath change (L48-c)
  useEffect(() => {
    if (!autoScrollActiveIntoView) return;
    if (typeof document === "undefined") return;
    if (!finalActiveItem) return;
    const nav = document.getElementById(sidebarId);
    if (!nav) return;
    const activeEl = nav.querySelector('[data-active="true"]');
    if (!(activeEl instanceof HTMLElement)) return;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    activeEl.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [autoScrollActiveIntoView, finalActiveItem, sidebarId]);

  // Helpers used by render — wired through finalHandle so they mutate
  // external state (when provided) or internal reducer (default).
  const closeMobile = useCallback(() => {
    if (!isMobileBehavior) return;
    finalHandle.closeMobile();
  }, [finalHandle, isMobileBehavior]);

  const toggleSection = useCallback(
    (sectionId: string) => {
      finalHandle.toggleSection(sectionId);
    },
    [finalHandle],
  );

  // Attach the imperative handle to the consumer-supplied ref (React 19
  // ref-as-prop pattern). When external state provided, ref exposes the
  // external handle so trigger toggles drive the right state machine.
  useImperativeHandle(externalRef, () => finalHandle, [finalHandle]);

  const contextValue = useMemo<SidebarNav01ContextValue>(
    () => ({
      state: { ...state, collapsed: finalCollapsed, mobileOpen: finalMobileOpen, collapsedSectionIds: finalCollapsedSectionIds },
      dispatch,
      handle: finalHandle,
      sidebarId,
    }),
    [state, dispatch, finalHandle, sidebarId, finalCollapsed, finalMobileOpen, finalCollapsedSectionIds],
  );

  const cssVars = useMemo(
    () => deriveCssVars({ collapsedWidth, expandedWidth, transitionDuration }),
    [collapsedWidth, expandedWidth, transitionDuration],
  );

  const defaultAccessory = (
    <button
      type="button"
      onClick={() => finalHandle.toggleCollapse()}
      aria-label={finalCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!finalCollapsed}
      aria-controls={sidebarId}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      )}
    >
      {finalCollapsed ? (
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

  // L39 — loading/empty branching precedence:
  //   loading=true → renderLoading slot OR default skeleton
  //   else items.length === 0 → renderEmptyState({reason: "no-items"})
  //   else visibleEntries.length === 0 AND filtered count > 0
  //     → renderEmptyState({reason: "all-filtered-by-permission"})
  //   else visibleEntries.length === 0 AND hidden count > 0
  //     → renderEmptyState({reason: "all-hidden"})
  //   else → normal list render
  const renderListBody = (mode: "desktop" | "mobile") => {
    const collapsed = mode === "mobile" ? false : finalCollapsed;

    if (loading) {
      const defaultRender = (
        <SidebarLoadingSkeleton isCollapsed={collapsed} />
      );
      if (renderLoading) {
        return renderLoading({ isCollapsed: collapsed, defaultRender });
      }
      return defaultRender;
    }

    if (finalVisibleEntries.length === 0) {
      // When external state is provided, internal `visible.*` diagnostic
      // counts are best-effort (may not match externalState.items). Reason
      // resolution is lossy in that path — defaults to "no-items".
      const reason: SidebarNav01EmptyReason =
        items.length === 0
          ? "no-items"
          : visible.filteredByPermission.length > 0
            ? "all-filtered-by-permission"
            : visible.hiddenItemCount > 0
              ? "all-hidden"
              : "no-items";
      if (renderEmptyState) {
        return renderEmptyState({ reason });
      }
      return <SidebarEmptyState reason={reason} />;
    }

    return (
      <SidebarNavList
        entries={finalVisibleEntries}
        activeItemId={finalActiveItem?.id ?? null}
        focusedItemId={focusedItemId}
        keyboardEntryId={keyboardEntryId}
        isCollapsed={collapsed}
        linkComponent={linkComponent}
        activeVariant={activeVariant}
        autoCloseMobileOnNavigate={autoCloseMobileOnNavigate}
        isMobileOpen={finalMobileOpen}
        onCloseMobile={closeMobile}
        collapsedSectionIds={finalCollapsedSectionIds}
        onToggleSection={toggleSection}
        onItemClick={onItemClick}
        onItemNavigate={onItemNavigate}
        onSectionToggle={onSectionToggle}
        renderItem={renderItem}
        renderSection={renderSection}
        renderBadge={renderBadge}
        renderTooltipContent={renderTooltipContent}
      />
    );
  };

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

      {/* Nav list — loading/empty branching per L39 */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
        {renderListBody(mode)}
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
        data-stage="C11-keyboard-skiplink-permissions"
        data-collapsed={finalCollapsed}
        data-mobile-open={finalMobileOpen}
        data-side={side}
        onKeyDown={handleKeyDown}
        style={{ ...cssVars, ...style }}
        className={cn(
          "relative hidden h-full flex-col bg-card",
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
        {skipLinkTarget && (
          <SidebarSkipLink
            target={skipLinkTarget}
            label={skipLinkLabel}
            onActivated={onSkipLinkActivated}
          />
        )}
        {renderInnerChrome("desktop")}
      </nav>

      {/* Mobile render path — CSS-hidden ABOVE breakpoint */}
      <div
        className={mobileVisibleClass}
        data-component="sidebar-nav-01-mobile-wrapper"
        style={cssVars}
      >
        <Sheet
          open={finalMobileOpen}
          // F-cross-13 defensive: Radix passes (open: boolean); Base UI may pass
          // undefined or different shape. Runtime-check before mutating.
          // Routed through finalHandle so external state (when provided)
          // is the mutation target. Note: this loses the "outside-click"
          // reason discriminator (handle.closeMobile uses "imperative").
          onOpenChange={(nextOpen: boolean | undefined) => {
            if (typeof nextOpen !== "boolean") return;
            if (nextOpen) finalHandle.openMobile();
            else finalHandle.closeMobile();
          }}
        >
          <SheetContent
            side={drawerSide}
            className="relative flex w-72 flex-col bg-card p-0"
            style={cssVars}
            aria-describedby={undefined}
            onKeyDown={handleKeyDown}
          >
            <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
            {skipLinkTarget && (
              <SidebarSkipLink
                target={skipLinkTarget}
                label={skipLinkLabel}
                onActivated={onSkipLinkActivated}
              />
            )}
            {renderInnerChrome("mobile")}
          </SheetContent>
        </Sheet>
      </div>
    </SidebarNav01Context.Provider>
  );
}
