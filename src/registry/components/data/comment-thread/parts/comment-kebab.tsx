"use client";

import { Fragment, memo, useCallback, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDirection } from "../hooks/use-direction";
import type { CommentMenuItem } from "../types";

// `dir` is a plain DOM attribute (works on Radix and Base UI) that the primitive's props type omits.
const DIR_ATTR = { ltr: { dir: "ltr" }, rtl: { dir: "rtl" } } as Record<"ltr" | "rtl", object>;

export interface CommentKebabProps {
  /** The menu's items (see `buildMenuItems`). Hidden ones are left out; none left = no kebab. */
  items: CommentMenuItem[];
  /** Accessible name of the trigger. */
  ariaLabel: string;
  /** Lets the row return focus to the trigger (after an edit closes). */
  triggerRef?: (el: HTMLButtonElement | null) => void;
  /** Text direction of the menu. Default: read from the trigger's surroundings after mount. */
  dir?: "ltr" | "rtl";
  /** `"touch"`: the trigger has a hit area of at least 44 × 44 px and is always visible. Default `"default"`. */
  size?: "default" | "touch";
  className?: string;
}

function CommentKebabInner({ items, ariaLabel, triggerRef, dir: dirProp, size = "default", className }: CommentKebabProps) {
  // The menu is portaled out of the thread, so it must carry the direction itself.
  const [triggerEl, setTriggerEl] = useState<HTMLButtonElement | null>(null);
  const elRef = useMemo(() => ({ current: triggerEl }), [triggerEl]);
  const dir = useDirection(elRef, dirProp);
  const setTrigger = useCallback(
    (el: HTMLButtonElement | null) => {
      setTriggerEl(el);
      triggerRef?.(el);
    },
    [triggerRef],
  );
  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return null;

  // F-cross-13: drop `asChild` + render the Radix/Base-UI primitive directly
  // as a <button>. The shadcn CLI rewrites `asChild` to `render={<Button …>}`
  // at install-time (Base UI idiom), which breaks consumers who installed the
  // Radix primitive. Inline button styling via `buttonVariants(…)` instead.
  const triggerClass = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    size === "touch"
      ? "min-h-11 min-w-11"
      : "h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
    className,
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={setTrigger} data-comment-kebab="" className={triggerClass} aria-label={ariaLabel}>
        <MoreHorizontal className="h-3 w-3" />
      </DropdownMenuTrigger>
      {/* `align` stays "end": with `dir` on the content, the positioner (floating-ui) treats the menu as
          RTL and mirrors the alignment itself — flipping it here too undid that (browser re-verify). */}
      <DropdownMenuContent align="end" {...DIR_ATTR[dir]}>
        {visible.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            {item.separatorBefore && i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                item.destructive && "text-destructive focus:text-destructive",
              )}
            >
              {item.icon ? <span className="me-2">{item.icon}</span> : null}
              {item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CommentKebab = memo(CommentKebabInner);
CommentKebab.displayName = "CommentKebab";
