"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files.
import type { CommentMenuItem } from "../../comment-thread-01/types";

interface NewsKebabProps {
  items: CommentMenuItem[];
  /** aria-label for the trigger button. Default "Open menu". */
  triggerAriaLabel?: string;
  className?: string;
}

/**
 * Kebab dropdown shared across all 5 variant parts (except `small`, which
 * skips kebab per Q-PA matrix). Renders a 44×44 touch target with vertical
 * ellipsis icon; the menu opens via shadcn DropdownMenu.
 *
 * Items shape comes from `CommentMenuItem` (reused from comment-thread-01,
 * same as post-card-01's kebab pattern). `separatorBefore: true` injects a
 * `<DropdownMenuSeparator>` above the item.
 *
 * **F-cross-13 defensive pattern (per memory):** uses `<DropdownMenuTrigger>`
 * directly with the trigger button as its child (no `asChild` to avoid
 * Base UI's Slot composition surface). All callback contravariance handled
 * by the items' `onClick` lambdas.
 *
 * Returns `null` when `items` is empty — caller's responsibility to skip
 * rendering the kebab cluster entirely when no items.
 */
export function NewsKebab({
  items,
  triggerAriaLabel = "Open menu",
  className,
}: NewsKebabProps) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerAriaLabel}
        className={cn(
          "relative z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {items.map((it, idx) => (
          <KebabRow
            key={`${it.label}-${idx}`}
            item={it}
            isFirst={idx === 0}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface KebabRowProps {
  item: CommentMenuItem;
  isFirst: boolean;
}

function KebabRow({ item, isFirst }: KebabRowProps) {
  return (
    <>
      {item.separatorBefore && !isFirst && <DropdownMenuSeparator />}
      <DropdownMenuItem
        disabled={item.disabled}
        onClick={(e) => {
          e.stopPropagation();
          item.onClick?.();
        }}
        className={cn(
          item.destructive &&
            "text-destructive focus:text-destructive focus:bg-destructive/10",
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </DropdownMenuItem>
    </>
  );
}
