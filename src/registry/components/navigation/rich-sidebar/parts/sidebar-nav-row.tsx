"use client";

import { cn } from "@/lib/utils";
import { getActiveVariantClasses } from "../lib/active-variant-classes";
import type {
  NavBadgeConfig,
  NavItem,
  NavLinkComponent,
  RichSidebarProps,
} from "../types";
import { Icon } from "./icon";
import { NavBadge } from "./nav-badge";
import { TooltipWrapper } from "./tooltip-wrapper";

interface SidebarNavRowProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isFocused: boolean;
  /**
   * Roving tabindex (L37). `0` when this row is the keyboard entry point
   * (= focused row OR — when nothing is focused — the first focusable row);
   * `-1` otherwise. Disabled items always pass through to `tabIndex={-1}`.
   */
  rovingTabIndex: 0 | -1;
  linkComponent: NavLinkComponent;
  activeVariant?: RichSidebarProps["activeVariant"];
  onClick: (event: React.MouseEvent) => void;
  renderBadge?: RichSidebarProps["renderBadge"];
  renderTooltipContent?: RichSidebarProps["renderTooltipContent"];
}

/**
 * Resolve a NavItem's badge config (shorthand number/string → full config).
 */
function resolveBadgeConfig(
  badge: NavItem["badge"],
): NavBadgeConfig | null {
  if (badge === undefined || badge === null) return null;
  if (typeof badge === "number" || typeof badge === "string") {
    return { value: badge };
  }
  // Already a NavBadgeConfig (or arbitrary ReactNode — treat as value)
  if (typeof badge === "object" && "value" in badge) {
    return badge as NavBadgeConfig;
  }
  // Bare ReactNode badge
  return { value: badge as NavBadgeConfig["value"] };
}

export function SidebarNavRow({
  item,
  isActive,
  isCollapsed,
  isFocused,
  rovingTabIndex,
  linkComponent: LinkComponent,
  activeVariant,
  onClick,
  renderBadge,
  renderTooltipContent,
}: SidebarNavRowProps) {
  const isDisabled = item.disabled ?? false;
  const href = item.href ?? "#";

  const badgeConfig = resolveBadgeConfig(item.badge);
  const defaultBadge = badgeConfig ? (
    <NavBadge {...badgeConfig} />
  ) : null;
  const badgeNode = renderBadge && badgeConfig
    ? renderBadge({
        item,
        badge: badgeConfig,
        position: isCollapsed ? "corner" : "inline-end",
        defaultRender: defaultBadge,
      })
    : defaultBadge;

  // Tooltip content when collapsed — label + optional shortcut + optional description
  const tooltipContent = renderTooltipContent
    ? renderTooltipContent({ item, isActive })
    : (item.tooltipContent ?? (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{item.label}</span>
          {item.shortcut && (
            <span className="text-[10px] text-muted-foreground">
              {item.shortcut}
            </span>
          )}
          {!isActive && item.description && (
            <span className="text-[10px] text-muted-foreground/90">
              {item.description}
            </span>
          )}
        </div>
      ));

  const linkEl = (
    <LinkComponent
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      aria-disabled={isDisabled || undefined}
      data-active={isActive}
      data-focused={isFocused || undefined}
      data-nav-id={item.id}
      tabIndex={isDisabled ? -1 : rovingTabIndex}
      target={item.target}
      rel={item.rel}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
        "text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        // Active vs inactive paint via L12 variant matrix
        getActiveVariantClasses(activeVariant, isActive),
        // Disabled (L27)
        isDisabled && "pointer-events-none cursor-not-allowed opacity-50",
        // Center icon when collapsed
        isCollapsed && "justify-center",
      )}
    >
      {(item.icon !== undefined && item.icon !== null) || isCollapsed ? (
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          {item.icon !== undefined && item.icon !== null ? (
            <Icon icon={item.icon} />
          ) : (
            // Fallback glyph when collapsed AND no explicit icon —
            // first letter of the label, styled like an icon. Keeps the
            // row visually anchored so the corner-badge has something to
            // sit on top of.
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
            >
              {item.label?.[0] ?? "•"}
            </span>
          )}
          {/* Badge in corner position when collapsed */}
          {isCollapsed && badgeNode}
        </span>
      ) : null}
      {!isCollapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!isCollapsed && item.shortcut && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-xs",
            isActive ? "bg-primary-foreground/10" : "bg-muted text-muted-foreground",
          )}
        >
          {item.shortcut}
        </span>
      )}
      {!isCollapsed && item.accessory && (
        <span className="inline-flex items-center">{item.accessory}</span>
      )}
      {/* Badge in inline-end position when expanded */}
      {!isCollapsed && badgeNode}
    </LinkComponent>
  );

  return (
    <li className={cn("list-none", item.className)} data-testid={item["data-testid"]}>
      <TooltipWrapper
        content={tooltipContent}
        side="right"
        disabled={!isCollapsed}
      >
        {linkEl}
      </TooltipWrapper>
    </li>
  );
}
