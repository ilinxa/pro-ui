"use client";

import { useRef, useState } from "react";
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
 *
 * F-cross-13 defensive (R7 carrier #3 — DropdownMenu):
 *  - onOpenChange runtime-checks for boolean (Radix passes boolean;
 *    Base UI variants may pass undefined or different shape)
 *  - DropdownMenuItem.onSelect callbacks shaped to accept either Event
 *    (Radix) or undefined (Base UI fallback) — runtime-narrowed
 *  - v0.3.2 (path-b): zero `asChild` — Base UI primitives reject it. The
 *    DropdownMenuTrigger IS the footer button (native props only) and
 *    href menu rows nest the anchor INSIDE the item (see
 *    NavUserLinkMenuItem below).
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

  // v0.3.2 (F-cross-13 path-b): no `asChild` — Base UI's trigger rejects it.
  // The DropdownMenuTrigger IS the footer button: both backends render a
  // native <button> and pass native DOM props straight through.
  const trigger = (
    <DropdownMenuTrigger
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
    </DropdownMenuTrigger>
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
      {trigger}
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
          if (item.href) {
            return (
              <NavUserLinkMenuItem
                key={item.label + i}
                item={item}
                href={item.href}
              />
            );
          }
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
            >
              <Icon icon={item.icon} className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * v0.3.2 (F-cross-13 path-b): link-flavored menu row. Previously
 * `<DropdownMenuItem asChild>` made the anchor the [role=menuitem] itself —
 * Base UI's DropdownMenuItem has no `asChild`, so the item stays the
 * menuitem host and the anchor renders INSIDE it, filling the whole row
 * (the item's padding moves onto the anchor via `p-0`). An anchor inside a
 * div[role=menuitem] is valid HTML and keeps href semantics — middle-click,
 * ctrl-click, copy-link — working in both backends. Keyboard activation
 * dispatches the synthetic click on the ITEM, not the anchor, so onSelect
 * forwards it via anchor.click() exactly once:
 *   - nativeClickRef — the anchor's own onClick marks pointer activations
 *     (navigation already happened natively; don't forward)
 *   - forwardingRef — re-entrancy guard: the forwarded click bubbles back
 *     into the item's select pipeline and would double-fire item.onClick
 * The anchor is looked up via querySelector so custom linkComponents work
 * whether or not they forward refs.
 */
function NavUserLinkMenuItem({
  item,
  href,
}: {
  item: NavUserMenuItem;
  href: string;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const nativeClickRef = useRef(false);
  const forwardingRef = useRef(false);
  const LinkComponent = item.linkComponent ?? DefaultLink;
  return (
    <DropdownMenuItem
      ref={itemRef}
      disabled={item.disabled}
      onSelect={(eventArg: NavUserMenuItemSelectEvent) => {
        if (forwardingRef.current) return;
        item.onClick?.(eventArg);
        if (!nativeClickRef.current) {
          // Fall back to the row's root element for linkComponents that
          // render no <a> (their own onClick navigation still runs).
          const anchor =
            itemRef.current?.querySelector("a") ??
            (itemRef.current?.firstElementChild instanceof HTMLElement
              ? itemRef.current.firstElementChild
              : null);
          if (anchor) {
            forwardingRef.current = true;
            try {
              anchor.click();
            } finally {
              forwardingRef.current = false;
            }
          }
        }
        nativeClickRef.current = false;
      }}
      className={cn(
        // p-0 — padding moves onto the anchor so the whole row is the link
        "p-0",
        item.variant === "destructive" && "text-destructive focus:text-destructive",
      )}
    >
      <LinkComponent
        href={href}
        // the menuitem is the focus stop; keep the anchor out of the tab order
        tabIndex={-1}
        onClick={() => {
          nativeClickRef.current = true;
        }}
        className="flex w-full items-center gap-2 rounded-md px-1.5 py-1"
      >
        <Icon icon={item.icon} className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        {item.shortcut && (
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {item.shortcut}
          </span>
        )}
      </LinkComponent>
    </DropdownMenuItem>
  );
}
