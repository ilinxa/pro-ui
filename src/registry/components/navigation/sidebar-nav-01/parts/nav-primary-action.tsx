"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarNav01ContextOrNull } from "../contexts/sidebar-nav-context";
import type { NavPrimaryActionConfig } from "../types";
import { DefaultLink } from "./default-link";
import { Icon } from "./icon";
import { TooltipWrapper } from "./tooltip-wrapper";

/**
 * Default primary-action button (e.g., "Create post" / "New project").
 *
 * Collapses to icon-only when ancestor sidebar collapses; label hidden +
 * tooltip exposed so the action stays accessible and the icon stays
 * centered.
 *
 * Use via:
 *   <SidebarNav01 primaryAction={{
 *     icon: PlusSquare,
 *     label: "Share",
 *     onClick: () => openComposer(),
 *   }} />
 * Or directly inside primaryActionSlot:
 *   <SidebarNav01 primaryActionSlot={<NavPrimaryAction ... />} />
 */
export function NavPrimaryAction({
  icon,
  label,
  onClick,
  href,
  linkComponent,
  variant = "default",
  tone = "default",
  className,
}: NavPrimaryActionConfig & { className?: string }) {
  const ctx = useSidebarNav01ContextOrNull();
  const isCollapsed = ctx?.state.collapsed ?? false;

  const innerContent = (
    <>
      <Icon icon={icon} className={cn("h-4 w-4 shrink-0", isCollapsed && "")} />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </>
  );

  const buttonClasses = cn(
    "w-full gap-2",
    isCollapsed && "px-0",
    tone === "accent" && "bg-(--ilinxa-nav-active-bg) text-(--ilinxa-nav-active-fg) hover:bg-(--ilinxa-nav-active-bg)/90",
    tone === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    className,
  );

  // href present → render as <a> via linkComponent; otherwise <button>
  const buttonEl = href ? (
    <Button asChild variant={variant} className={buttonClasses}>
      {(() => {
        const LinkComponent = linkComponent ?? DefaultLink;
        return (
          <LinkComponent href={href} onClick={onClick} aria-label={isCollapsed ? label : undefined}>
            {innerContent}
          </LinkComponent>
        );
      })()}
    </Button>
  ) : (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      aria-label={isCollapsed ? label : undefined}
      className={buttonClasses}
    >
      {innerContent}
    </Button>
  );

  return (
    <TooltipWrapper
      content={<span className="font-medium">{label}</span>}
      side="right"
      disabled={!isCollapsed}
    >
      {buttonEl}
    </TooltipWrapper>
  );
}
