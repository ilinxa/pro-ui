"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { NavSection } from "../types";
import { Icon } from "./icon";

interface SidebarNavSectionProps {
  section: NavSection;
  isCollapsed: boolean; // section's own collapse state (NOT sidebar's)
  isSidebarCollapsed: boolean; // sidebar collapsed = icon-only mode
  visibleItemCount: number;
  isFocused: boolean;
  /** Roving tabindex for the collapsible header button (L37). */
  rovingTabIndex: 0 | -1;
  children: React.ReactNode; // the section's items (already rendered by parent)
  onToggle: () => void;
}

/**
 * Section header + collapsible body wrapper.
 *
 * Behavior:
 *  - collapsible=true → header is a <button aria-expanded aria-controls> that toggles
 *  - collapsible=false → header is a visual label only (`aria-hidden`); the
 *    body list's `aria-label` names the group, so it is announced once.
 *
 * v0.5.0 (axe): the body is a plain `<ul aria-label>` — `role="group"` on a
 * `<ul>` removed its list semantics and orphaned every `<li>` row (axe
 * `listitem`); the old `<h6>` title broke the host page's heading outline
 * (axe `heading-order`) at a level the sidebar cannot know.
 *
 * At sidebar-collapsed mode (icon-only), section title hides; only the icon
 * shows. If section has no icon, the section header collapses to a thin
 * separator-like divider so groups remain visually distinct.
 */
export function SidebarNavSection({
  section,
  isCollapsed,
  isSidebarCollapsed,
  visibleItemCount,
  isFocused,
  rovingTabIndex,
  children,
  onToggle,
}: SidebarNavSectionProps) {
  const bodyId = useId();
  const collapsible = section.collapsible ?? false;

  // Sidebar at icon-only mode: render condensed
  if (isSidebarCollapsed) {
    return (
      <li className="list-none">
        {section.icon || section.title ? (
          <div className="px-(--ilinxa-sidebar-px,0.75rem) py-1.5" role="presentation" aria-hidden="true">
            {section.icon ? (
              <Icon
                icon={section.icon}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
            ) : (
              <div className="h-px w-full bg-(--ilinxa-sidebar-border,var(--border))" />
            )}
          </div>
        ) : (
          <div className="my-1 h-px w-full bg-(--ilinxa-sidebar-border,var(--border))" role="presentation" />
        )}
        {!isCollapsed && (
          // <ul> (not <div>) so the `<li>` rows produced by SidebarNavRow
          // are valid direct children. Outer wrapper is also <li> (section
          // root), so the structure is <li><ul><li>...</li></ul></li> —
          // valid HTML for a nested list group.
          <ul
            id={bodyId}
            aria-label={section.title}
            className="flex flex-col gap-(--ilinxa-sidebar-row-gap,0.25rem)"
          >
            {children}
          </ul>
        )}
      </li>
    );
  }

  // Expanded sidebar — full section UI
  const headerInner = (
    <span className="flex flex-1 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {section.icon && <Icon icon={section.icon} className="h-3.5 w-3.5" />}
      <span className="truncate">{section.title}</span>
      {visibleItemCount > 0 && (
        <span
          className="ms-1 text-[10px] font-normal text-muted-foreground/70"
          aria-hidden="true"
        >
          {visibleItemCount}
        </span>
      )}
    </span>
  );

  return (
    <li className="list-none">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={bodyId}
          data-nav-id={section.id}
          data-focused={isFocused || undefined}
          tabIndex={rovingTabIndex}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-(--ilinxa-sidebar-px,0.75rem) py-1.5 text-start",
            "hover:bg-(--ilinxa-nav-hover-bg,var(--muted))/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--ilinxa-sidebar-bg,var(--card))",
          )}
        >
          {headerInner}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground",
              "motion-safe:transition-transform motion-safe:duration-200",
              // Collapsed: point toward the inline END (right in LTR, left in
              // RTL). A scale mirror of a symmetric chevron does nothing —
              // rotate the other way instead.
              isCollapsed && "-rotate-90 rtl:rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
      ) : section.title ? (
        // Non-collapsible header — visual label; the list's aria-label names the group
        <div className="px-(--ilinxa-sidebar-px,0.75rem) py-1.5" aria-hidden="true">
          {headerInner}
        </div>
      ) : null}

      {!isCollapsed && (
        <ul
          id={bodyId}
          aria-label={section.title}
          // v0.5.0 — items inside a section indent by `--ilinxa-nav-indent-step`
          // (default 0 = the v0.4 look). Expanded rail only: the collapsed rail
          // renders the branch above, where icons stay on the centre line.
          className="mt-0.5 flex flex-col gap-(--ilinxa-sidebar-row-gap,0.25rem) ps-(--ilinxa-nav-indent-step,0)"
        >
          {children}
        </ul>
      )}
    </li>
  );
}
