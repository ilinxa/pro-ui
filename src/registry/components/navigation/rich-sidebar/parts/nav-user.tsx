"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRichSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import { deriveAvatarFallback } from "../lib/derive-avatar-fallback";
import type {
  NavUserConfig,
  NavUserMenuItem,
  NavUserMenuItemSelectEvent,
} from "../types";
import { DefaultLink } from "./default-link";
import { Icon } from "./icon";

const STATUS_DOT_CLASSES: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-zinc-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

/**
 * User footer (avatar + identity + dropdown menu).
 *
 * Collapse-aware: identity text hidden when sidebar collapsed; only the
 * avatar shows. Dropdown align flips center↔end based on collapsed state.
 * Tooltip exposes name/handle when collapsed.
 *
 * F-cross-13 defensive (R7 carrier #3 — DropdownMenu):
 *  - onOpenChange runtime-checks for boolean (Radix passes boolean;
 *    Base UI variants may pass undefined or different shape)
 *  - DropdownMenuItem.onSelect callbacks shaped to accept either Event
 *    (Radix) or undefined (Base UI fallback) — runtime-narrowed
 *
 * menuItems is a discriminated union (L15 + L22-b):
 *   { kind: "item"; ... } — clickable menu row
 *   { kind: "separator" } — divider
 */
export function NavUser({
  user,
  menuItems,
  onTriggerOpen,
  className,
}: NavUserConfig & { className?: string }) {
  const ctx = useRichSidebarContextOrNull();
  const isCollapsed = ctx?.state.collapsed ?? false;
  const [open, setOpen] = useState(false);

  const initials = deriveAvatarFallback(user.name);
  const statusDot = user.status && user.status !== "invisible"
    ? STATUS_DOT_CLASSES[user.status]
    : null;

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-md p-1.5",
        "hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        isCollapsed && "justify-center",
        className,
      )}
      aria-label={isCollapsed ? `${user.name} — open menu` : undefined}
    >
      <span className="relative inline-flex shrink-0">
        <Avatar className="h-9 w-9">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback>{user.avatarFallback ?? initials}</AvatarFallback>
        </Avatar>
        {statusDot && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-card",
              // RTL flip — status dot stays on the avatar's inline-end side
              "rtl:right-auto rtl:-left-0.5",
              statusDot,
            )}
          />
        )}
      </span>
      {!isCollapsed && (
        <span className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-sm font-medium text-foreground">
            {user.name}
          </span>
          {user.handle && (
            <span className="truncate text-xs text-muted-foreground">
              {user.handle}
            </span>
          )}
        </span>
      )}
    </button>
  );

  return (
    <DropdownMenu
      open={open}
      // F-cross-13: runtime-check (Radix → boolean; Base UI → possible undefined)
      onOpenChange={(next: boolean | undefined) => {
        if (typeof next === "boolean") {
          setOpen(next);
          onTriggerOpen?.({ open: next });
        }
      }}
    >
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={isCollapsed ? "center" : "end"}
        side="top"
        className="w-56"
      >
        {menuItems.map((entry, i) => {
          if (entry.kind === "separator") {
            return <DropdownMenuSeparator key={`sep-${i}`} />;
          }
          const item = entry as NavUserMenuItem;
          return (
            <DropdownMenuItem
              key={item.label + i}
              disabled={item.disabled}
              // v0.3.0 (C4, F10, L56): callback signature widened to honestly
              // accept Event | React.MouseEvent. Radix passes Event for keyboard
              // activations and MouseEvent for clicks; consumers narrow at call
              // site with `instanceof MouseEvent` if needed. No unsafe cast.
              onSelect={(eventArg: NavUserMenuItemSelectEvent) => {
                item.onClick?.(eventArg);
              }}
              className={cn(
                "gap-2",
                item.variant === "destructive" && "text-destructive focus:text-destructive",
              )}
              asChild={!!item.href}
            >
              {item.href ? (
                (() => {
                  const LinkComponent = item.linkComponent ?? DefaultLink;
                  return (
                    <LinkComponent href={item.href}>
                      <Icon icon={item.icon} className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {item.shortcut}
                        </span>
                      )}
                    </LinkComponent>
                  );
                })()
              ) : (
                <>
                  <Icon icon={item.icon} className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {item.shortcut}
                    </span>
                  )}
                </>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
