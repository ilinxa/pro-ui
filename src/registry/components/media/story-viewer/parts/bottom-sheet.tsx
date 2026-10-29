"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { wrapTabWithinLayer } from "../lib/focus-wrap";

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
  /** `id` of the sheet root — the target of the opening action's `aria-controls`. */
  id?: string;
}

/**
 * v0.3.1 — shared bottom-sheet chrome used by the comments panel + share
 * panel (and potentially other future v0.3+ panels). Renders a rounded-top
 * sheet with a drag-handle bar + heading row + close button + scrollable
 * content area.
 *
 * Always mounted (DOM persistence keeps consumer-side state — typically the
 * draft composer inside `<CommentThread />` or the search-query state
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
  id,
}: BottomSheetProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  // Safari / Firefox on macOS do not focus a clicked button, so at open `activeElement` is `body`
  // after a mouse or touch open. While closed, remember the last control pressed and use it as the
  // opener when nothing is focused (the same fallback as the viewer shell).
  const lastPressedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) return undefined;
    const onPress = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const control = target?.closest<HTMLElement>(
        'button, a[href], [role="button"], [tabindex]:not([tabindex="-1"])',
      );
      // The tap zones sit in an `aria-hidden` wrapper: never an opener.
      lastPressedRef.current = control && !control.closest('[aria-hidden="true"]') ? control : null;
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, [open]);

  // Focus: on open, remember the opener and move focus into the sheet; on
  // close, hand focus back to the opener (when it is still in the document and
  // focus did not go somewhere meaningful). Restoration runs in the commit that
  // CLOSES the sheet, after the root has lifted the `inert` it put on the rest.
  useEffect(() => {
    if (open) {
      const active = document.activeElement;
      const pressed = lastPressedRef.current;
      lastPressedRef.current = null;
      // The viewer dialog itself (focused on open) is not an opener: nothing was focused.
      const viewerDialog = rootRef.current?.parentElement?.closest('[role="dialog"]') ?? null;
      openerRef.current =
        active instanceof HTMLElement && active !== document.body && active !== viewerDialog
          ? active
          : pressed?.isConnected && !rootRef.current?.contains(pressed)
            ? pressed
            : null;
      rootRef.current?.focus({ preventScroll: true });
      return undefined;
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (!opener || !opener.isConnected) return undefined;
    // 0.7.0 (A11): focus counts as "lost" on `body`, inside the sheet, or on the viewer dialog
    // itself (its focus trap grabs focus back when the sheet's own focused node goes inert).
    const dialogEl = rootRef.current?.parentElement?.closest('[role="dialog"]') ?? null;
    const restore = () => {
      const active = document.activeElement;
      const lost =
        !active ||
        active === document.body ||
        active === dialogEl ||
        !!rootRef.current?.contains(active);
      if (lost && opener.isConnected && !opener.closest("[inert]")) {
        opener.focus({ preventScroll: true });
      }
    };
    restore();
    // A browser applies the sheet's `inert` (and drops the focus inside it) after this effect on
    // an Escape close: check again over the next frames, abandoning once focus is somewhere real.
    let frame = 0;
    let tries = 0;
    const again = () => {
      restore();
      if (++tries < 3) frame = requestAnimationFrame(again);
    };
    frame = requestAnimationFrame(again);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div
      ref={rootRef}
      id={id}
      data-story-layer="sheet"
      data-open={open ? "true" : "false"}
      tabIndex={-1}
      // A closed sheet is always mounted (draft state persists) — `inert` keeps
      // its buttons out of the tab order and the accessibility tree.
      inert={!open}
      onKeyDown={open ? wrapTabWithinLayer : undefined}
      className={cn(
        "outline-none",
        "absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out",
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
