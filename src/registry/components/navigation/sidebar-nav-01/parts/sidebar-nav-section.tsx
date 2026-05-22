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
  children: React.ReactNode; // the section's items (already rendered by parent)
  onToggle: () => void;
}

/**
 * Section header + collapsible body wrapper.
 *
 * Behavior:
 *  - collapsible=true → header is a <button aria-expanded aria-controls> that toggles
 *  - collapsible=false → header is a <h6 role="heading"> (label only, not focusable)
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
          <div className="px-3 py-1.5" role="presentation" aria-hidden="true">
            {section.icon ? (
              <Icon
                icon={section.icon}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
            ) : (
              <div className="h-px w-full bg-border" />
            )}
          </div>
        ) : (
          <div className="my-1 h-px w-full bg-border" role="presentation" />
        )}
        {!isCollapsed && (
          <div id={bodyId} role="group" aria-label={section.title}>
            {children}
          </div>
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
          className="ml-1 text-[10px] font-normal text-muted-foreground/70"
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
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left",
            "hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          )}
        >
          {headerInner}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              "motion-safe:duration-200",
              isCollapsed && "-rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
      ) : section.title ? (
        // Non-collapsible header — pure label, not focusable
        <h6 className="px-3 py-1.5">{headerInner}</h6>
      ) : null}

      {!isCollapsed && (
        <ul
          id={bodyId}
          role="group"
          aria-label={section.title}
          className="mt-0.5 flex flex-col gap-1"
        >
          {children}
        </ul>
      )}
    </li>
  );
}
