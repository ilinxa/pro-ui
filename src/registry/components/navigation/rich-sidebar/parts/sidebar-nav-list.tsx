"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type {
  NavEntry,
  NavItem,
  NavLinkComponent,
  RichSidebarEventArgs,
  RichSidebarProps,
} from "../types";
import { SidebarNavRow } from "./sidebar-nav-row";
import { SidebarNavSection } from "./sidebar-nav-section";
import { SidebarNavSeparator } from "./sidebar-nav-separator";

interface SidebarNavListProps {
  entries: ReadonlyArray<NavEntry>;
  activeItemId: string | null;
  focusedItemId: string | null;
  /**
   * Stable id of the first focusable item/section header in the rendered
   * traversal — used as the roving tabindex anchor when nothing is focused.
   * Null if no row is focusable (loading / empty).
   */
  keyboardEntryId: string | null;
  isCollapsed: boolean;
  linkComponent: NavLinkComponent;
  activeVariant?: RichSidebarProps["activeVariant"];
  autoCloseMobileOnNavigate: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;

  // Section state — driven by reducer in parent
  collapsedSectionIds: ReadonlySet<string>;
  onToggleSection: (sectionId: string) => void;

  // Consumer event hooks
  onItemClick?: (args: RichSidebarEventArgs["itemClick"]) => void;
  onItemNavigate?: (args: RichSidebarEventArgs["itemNavigate"]) => void;
  onSectionToggle?: (args: RichSidebarEventArgs["sectionToggle"]) => void;

  // Slot priority
  renderItem?: RichSidebarProps["renderItem"];
  renderSection?: RichSidebarProps["renderSection"];
  renderBadge?: RichSidebarProps["renderBadge"];
  renderTooltipContent?: RichSidebarProps["renderTooltipContent"];

  // v0.2.0 — href resolution (L42 + L43)
  hrefTemplateValues?: RichSidebarProps["hrefTemplateValues"];
  resolveHref?: RichSidebarProps["resolveHref"];
}

/**
 * Renders the NavEntry[] list — flat NavItems, NavSections, and NavSeparators.
 *
 * C3 surface: flat items + separators. Sections render their items in a
 * single ungrouped list (full section UI with title + collapsible header
 * lands C4 in parts/sidebar-nav-section.tsx).
 *
 * Click sequence per L28:
 *   1. consumer's item.onClick fires sync
 *   2. onItemClick (component-level) fires sync
 *   3. if event.defaultPrevented → stop
 *   4. queueMicrotask → onItemNavigate + autoCloseMobileOnNavigate
 *
 * Disabled items short-circuit at step 1 (L27).
 */
export function SidebarNavList({
  entries,
  activeItemId,
  focusedItemId,
  keyboardEntryId,
  isCollapsed,
  linkComponent,
  activeVariant,
  autoCloseMobileOnNavigate,
  isMobileOpen,
  onCloseMobile,
  collapsedSectionIds,
  onToggleSection,
  onItemClick,
  onItemNavigate,
  onSectionToggle,
  renderItem,
  renderSection,
  renderBadge,
  renderTooltipContent,
  hrefTemplateValues,
  resolveHref,
}: SidebarNavListProps) {
  // Roving tabindex (L37). The "entry point" rule:
  //   - Some row has the user's focus      → only that row is tabbable.
  //   - Nothing focused yet                 → the keyboard entry row is tabbable.
  //   - Disabled items always pass to -1.
  const resolveRovingTabIndex = (itemId: string): 0 | -1 => {
    if (focusedItemId) return focusedItemId === itemId ? 0 : -1;
    return keyboardEntryId === itemId ? 0 : -1;
  };
  const handleItemClick =
    (item: NavItem, sectionId: string | null, indexInSection: number) =>
    (event: React.MouseEvent) => {
      // L27 — disabled items short-circuit at step 1
      if (item.disabled) {
        event.preventDefault();
        return;
      }
      // Step 1 — consumer's per-item onClick
      item.onClick?.(event);
      // Step 2 — component-level onItemClick
      onItemClick?.({ item, isActive: activeItemId === item.id, event });
      // Step 3 — short-circuit if cancelled
      if (event.defaultPrevented) return;
      // Step 4 — microtask defer the navigation-side effects
      queueMicrotask(() => {
        onItemNavigate?.({ item });
        if (autoCloseMobileOnNavigate && isMobileOpen) {
          onCloseMobile();
        }
      });
      // Intentionally allow native <a> navigation to proceed unless
      // consumer called preventDefault in step 1 or 2.
      void sectionId;
      void indexInSection;
    };

  // Renders a single NavItem row, honoring the renderItem slot (L13/L29).
  // Returns an `<li>` (either via <SidebarNavRow> itself or the renderItem
  // wrapper). The key lives on the returned element directly — callers must
  // NOT add an intermediate wrapper, since the parent is a <ul> and only
  // <li> can be a valid direct child.
  const renderRow = (item: NavItem, sectionId: string | null, indexInSection: number) => {
    const isActive = activeItemId === item.id;
    const isFocused = focusedItemId === item.id;
    const rovingTabIndex = resolveRovingTabIndex(item.id);
    const defaultRender = (
      <SidebarNavRow
        key={item.id}
        item={item}
        isActive={isActive}
        isCollapsed={isCollapsed}
        isFocused={isFocused}
        rovingTabIndex={rovingTabIndex}
        linkComponent={linkComponent}
        activeVariant={activeVariant}
        onClick={handleItemClick(item, sectionId, indexInSection)}
        renderBadge={renderBadge}
        renderTooltipContent={renderTooltipContent}
        hrefTemplateValues={hrefTemplateValues}
        resolveHref={resolveHref}
      />
    );
    if (!renderItem) return defaultRender;
    return (
      <li key={item.id} className="list-none">
        {renderItem({
          item,
          isActive,
          isCollapsed,
          isFocused,
          isDisabled: item.disabled ?? false,
          sectionId,
          indexInSection,
          defaultRender,
        })}
      </li>
    );
  };

  return (
    <ul
      role="list"
      className={cn(
        "flex flex-1 flex-col gap-1 overflow-y-auto",
        // C5 hooks: motion-safe transitions will live here
      )}
    >
      {entries.map((entry, i) => {
        if (entry.kind === "separator") {
          return <SidebarNavSeparator key={entry.id ?? `sep-${i}`} />;
        }
        if (entry.kind === "section") {
          const isSectionCollapsed = collapsedSectionIds.has(entry.id);
          const isSectionFocused = focusedItemId === entry.id;
          const sectionRovingTabIndex =
            entry.collapsible ? resolveRovingTabIndex(entry.id) : -1;
          const handleSectionToggle = () => {
            onToggleSection(entry.id);
            onSectionToggle?.({ section: entry, collapsed: !isSectionCollapsed });
          };
          const defaultSection = (
            <SidebarNavSection
              key={entry.id}
              section={entry}
              isCollapsed={isSectionCollapsed}
              isSidebarCollapsed={isCollapsed}
              visibleItemCount={entry.items.length}
              isFocused={isSectionFocused}
              rovingTabIndex={sectionRovingTabIndex}
              onToggle={handleSectionToggle}
            >
              {entry.items.map((child, idx) => renderRow(child, entry.id, idx))}
            </SidebarNavSection>
          );
          if (!renderSection) return defaultSection;
          // `renderSection` is expected to return an `<li>` (typically by
          // forwarding `defaultRender` or composing its own list-item).
          // Fragment carries the key without injecting an invalid DOM node
          // between the `<ul>` parent and the consumer's `<li>`.
          return (
            <Fragment key={entry.id}>
              {renderSection({
                section: entry,
                isCollapsed: isSectionCollapsed,
                visibleItemCount: entry.items.length,
                defaultRender: defaultSection,
              })}
            </Fragment>
          );
        }
        // Top-level NavItem — renderRow returns an `<li>` directly with
        // the key already applied, so no wrapper element is needed.
        return renderRow(entry, null, i);
      })}
    </ul>
  );
}
