"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface BottomSheetProps {
  /** Whether the sheet is currently open. Drives translateY animation. */
  open: boolean;
  /** Fires when the user dismisses the sheet via the close button. */
  onClose: () => void;
  /** Heading label shown in the chrome row. */
  heading: string;
  /** aria-label on the close-X button. */
  closeLabel: string;
  /** Sheet height as a percentage of the parent. Default 62. */
  heightPct?: number;
  /** Sheet body. Sheet owns scroll. */
  children?: ReactNode;
  /** Optional className override for the outer sheet wrapper. */
  className?: string;
}

/**
 * v0.3.1 — shared bottom-sheet chrome used by the comments panel + share
 * panel (and potentially other future v0.3+ panels). Renders a rounded-top
 * sheet with a drag-handle bar + heading row + close button + scrollable
 * content area.
 *
 * Always mounted (DOM persistence keeps consumer-side state — typically the
 * draft composer inside `<CommentThread01 />` or the search-query state
 * inside `<ShareMenu />` — alive across open/close cycles). Hidden via
 * `translate-y-full` when `open` is false; pointer-events disabled in that
 * state so clicks pass through to the visual content below.
 */
export function BottomSheet({
  open,
  onClose,
  heading,
  closeLabel,
  heightPct = 62,
  children,
  className,
}: BottomSheetProps) {
  return (
    <div
      className={cn(
        "absolute right-0 bottom-0 left-0 z-40 flex flex-col rounded-t-2xl bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out",
        open ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none",
        className,
      )}
      style={{ height: `${heightPct}%` }}
      role="dialog"
      aria-modal={open ? "true" : undefined}
      aria-label={heading}
      aria-hidden={open ? undefined : "true"}
    >
      {/* Drag handle bar — visual affordance only (no drag logic in v0.3). */}
      <div className="flex shrink-0 items-center justify-center pt-2 pb-1">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">{heading}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
