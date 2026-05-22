"use client";

import { cn } from "@/lib/utils";
import type { NavItem, NavLinkComponent } from "../types";
import { Icon } from "./icon";

interface SidebarNavRowProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  linkComponent: NavLinkComponent;
  onClick: (event: React.MouseEvent) => void;
}

/**
 * Single item row.
 *
 * C3 paint: flat fill on active (full bg-primary). The 5 activeVariant
 * modes (`fill | left-bar | right-bar | outline | subtle`) land in C5.
 * Badge cell + accessory + tooltip-on-collapsed land in C6.
 *
 * Per L27, disabled items render with `aria-disabled` + `pointer-events-none`
 * + `opacity-50` + `tabindex="-1"`. Click handler short-circuits at the
 * component-level handler before this row's onClick is even called — so
 * disabled paint is the only responsibility here.
 */
export function SidebarNavRow({
  item,
  isActive,
  isCollapsed,
  linkComponent: LinkComponent,
  onClick,
}: SidebarNavRowProps) {
  const isDisabled = item.disabled ?? false;
  const href = item.href ?? "#";

  return (
    <li className={cn("list-none", item.className)} data-testid={item["data-testid"]}>
      <LinkComponent
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        aria-label={isCollapsed ? item.label : undefined}
        aria-disabled={isDisabled || undefined}
        data-active={isActive}
        tabIndex={isDisabled ? -1 : undefined}
        target={item.target}
        rel={item.rel}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
          "text-sm font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          // Active vs inactive paint (C3 baseline; activeVariant matrix lands C5)
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-muted",
          // Disabled (L27)
          isDisabled && "pointer-events-none cursor-not-allowed opacity-50",
        )}
      >
        <Icon icon={item.icon} className={cn(isCollapsed && "mx-auto")} />
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!isCollapsed && item.shortcut && (
          <span
            className={cn(
              "ml-auto rounded px-1.5 py-0.5 font-mono text-xs",
              isActive ? "bg-primary-foreground/10" : "bg-muted text-muted-foreground",
            )}
          >
            {item.shortcut}
          </span>
        )}
        {!isCollapsed && item.accessory && (
          <span className="ml-auto inline-flex items-center">{item.accessory}</span>
        )}
      </LinkComponent>
    </li>
  );
}
