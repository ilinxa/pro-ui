"use client";

import { useEffect, useRef } from "react";
import { isActivatableTarget } from "../lib/is-editable-target";
import { useGlobalKeydown } from "./use-global-keydown";

export interface UseStoryKeyboardNavOptions {
  isOpen: boolean;
  onPrevItem: () => void;
  onNextItem: () => void;
  onTogglePause: () => void;
  /** Optional — Radix Dialog already handles Escape via `onOpenChange`; supply only if you want a parallel hook. */
  onClose?: () => void;
  /**
   * v0.2.0 — when false, the window keydown listener does not attach.
   * Default: true. Mirrors the `disableKeyboardNav` opt-out on
   * StoryViewerProps.
   */
  enabled?: boolean;
}

/**
 * Window-scoped keyboard handlers for the story viewer.
 *
 * - ArrowLeft → onPrevItem
 * - ArrowRight → onNextItem
 * - Space → onTogglePause (preventDefault to stop page scroll)
 * - Escape → onClose (when supplied; deduplicated with Radix Dialog)
 *
 * Events from editable targets (input / textarea / select / contentEditable /
 * `[role="textbox"]` / `[data-keyboard-ignore]`), IME composition and events another
 * handler already prevented are ignored (via `useGlobalKeydown`).
 *
 * Listener attaches on `isOpen=true` only and detaches on close — no leaks.
 * Refs-mirror pattern keeps the listener stable; only re-attaches on `isOpen` flip.
 */
export function useStoryKeyboardNav(opts: UseStoryKeyboardNavOptions) {
  const refs = useRef(opts);
  useEffect(() => {
    refs.current = opts;
  });

  const { isOpen, enabled = true } = opts;
  // useGlobalKeydown skips editable targets (incl. inside shadow roots), IME composition and
  // events another handler already prevented.
  useGlobalKeydown(
    (e) => {
      switch (e.key) {
        case "ArrowLeft":
          refs.current.onPrevItem();
          break;
        case "ArrowRight":
          refs.current.onNextItem();
          break;
        case " ":
          // Space on a focused button/link activates that element instead.
          if (isActivatableTarget(e.target)) return;
          e.preventDefault();
          refs.current.onTogglePause();
          break;
        case "Escape":
          refs.current.onClose?.();
          break;
      }
    },
    { enabled: isOpen && enabled },
  );
}
