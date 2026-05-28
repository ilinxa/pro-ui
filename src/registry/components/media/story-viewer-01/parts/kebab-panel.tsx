"use client";

import { Fragment, memo, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type {
  ResolvedStoryViewer01Labels,
  StoryKebabMenuItem,
} from "../types";

export interface KebabPanelProps {
  open: boolean;
  items: StoryKebabMenuItem[];
  onClose: () => void;
  labels: ResolvedStoryViewer01Labels;
  className?: string;
}

/**
 * Bottom-sheet action panel used by BOTH kebab placements:
 *
 *   - Engagement-overlay placement (default): triggered by the 6th custom
 *     action in the stacked engagement-bar (Q-V17 lock — Instagram-2024 exact).
 *   - Header fallback (disableEngagement=true): triggered by a button in the
 *     header right cluster.
 *
 * Renders as a fixed-position bottom sheet rather than a DropdownMenu — this
 * matches Instagram / Snapchat / TikTok action-sheet UX AND avoids the
 * F-cross-13 `<DropdownMenuTrigger asChild>{<Button>}` rewriter trap entirely.
 *
 * Items honor `separatorBefore: true` for the moderator section visual break.
 * Destructive items get `text-destructive` styling.
 *
 * Closes on item click + on backdrop tap + on Escape (handled at parent via
 * onClose dispatch).
 */
function KebabPanelInner(props: KebabPanelProps) {
  // Escape key handler — closes the panel when open.
  useEffect(() => {
    if (!props.open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [props.open, props.onClose]);

  if (!props.open || props.items.length === 0) return null;

  return (
    <>
      {/* Backdrop — taps close the panel. Above engagement overlay, below the sheet. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-40 cursor-default bg-black/40"
        onClick={props.onClose}
      />
      {/* Action sheet — bottom-anchored. */}
      <div
        role="menu"
        aria-label={props.labels.kebabAriaLabel}
        className={cn(
          "absolute inset-x-0 bottom-0 z-50 max-h-[70%] overflow-y-auto rounded-t-2xl bg-card text-foreground shadow-2xl",
          props.className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">{props.labels.kebabAriaLabel}</span>
          <button
            type="button"
            onClick={props.onClose}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
            )}
            aria-label={props.labels.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="flex flex-col py-2">
          {props.items.map((item, i) => (
            <Fragment key={`${item.label}-${i}`}>
              {item.separatorBefore && i > 0 ? (
                <li role="separator" className="my-2 border-t border-border" aria-hidden="true" />
              ) : null}
              <li>
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    props.onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                    "hover:bg-muted focus:bg-muted focus:outline-none",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    item.destructive && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
                  )}
                >
                  {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                  <span className="flex-1">{item.label}</span>
                </button>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </>
  );
}

export const KebabPanel = memo(KebabPanelInner);
KebabPanel.displayName = "KebabPanel";
