"use client";

import { cn } from "@/lib/utils";
import type {
  NavEntry,
  NavItem,
  NavLinkComponent,
  SidebarNav01EventArgs,
  SidebarNav01Props,
} from "../types";
import { SidebarNavRow } from "./sidebar-nav-row";
import { SidebarNavSection } from "./sidebar-nav-section";
import { SidebarNavSeparator } from "./sidebar-nav-separator";

interface SidebarNavListProps {
  entries: ReadonlyArray<NavEntry>;
  activeItemId: string | null;
  isCollapsed: boolean;
  linkComponent: NavLinkComponent;
  activeVariant?: SidebarNav01Props["activeVariant"];
  autoCloseMobileOnNavigate: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;

  // Section state — driven by reducer in parent
  collapsedSectionIds: ReadonlySet<string>;
  onToggleSection: (sectionId: string) => void;

  // Consumer event hooks
  onItemClick?: (args: SidebarNav01EventArgs["itemClick"]) => void;
  onItemNavigate?: (args: SidebarNav01EventArgs["itemNavigate"]) => void;
  onSectionToggle?: (args: SidebarNav01EventArgs["sectionToggle"]) => void;

  // Slot priority
  renderItem?: SidebarNav01Props["renderItem"];
  renderSection?: SidebarNav01Props["renderSection"];
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
}: SidebarNavListProps) {
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
  const renderRow = (item: NavItem, sectionId: string | null, indexInSection: number) => {
    const isActive = activeItemId === item.id;
    const defaultRender = (
      <SidebarNavRow
        item={item}
        isActive={isActive}
        isCollapsed={isCollapsed}
        linkComponent={linkComponent}
        activeVariant={activeVariant}
        onClick={handleItemClick(item, sectionId, indexInSection)}
      />
    );
    if (!renderItem) return defaultRender;
    return (
      <li key={item.id} className="list-none">
        {renderItem({
          item,
          isActive,
          isCollapsed,
          isFocused: false, // C12 wires the focus tracker
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
              onToggle={handleSectionToggle}
            >
              {entry.items.map((child, idx) => (
                <span key={child.id}>{renderRow(child, entry.id, idx)}</span>
              ))}
            </SidebarNavSection>
          );
          if (!renderSection) return defaultSection;
          return (
            <span key={entry.id}>
              {renderSection({
                section: entry,
                isCollapsed: isSectionCollapsed,
                visibleItemCount: entry.items.length,
                defaultRender: defaultSection,
              })}
            </span>
          );
        }
        // Top-level NavItem
        return <span key={entry.id}>{renderRow(entry, null, i)}</span>;
      })}
    </ul>
  );
}
