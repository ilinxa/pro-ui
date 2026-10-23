"use client";

import { useEffect, useRef } from "react";
import { isActivatableTarget, isEditableTarget } from "../lib/is-editable-target";

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
 * `[role="textbox"]` / `[data-keyboard-ignore]`) and IME composition are ignored.
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
  useEffect(() => {
    if (!isOpen) return;
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      // Typing surfaces and IME composition own their keys.
      if (e.isComposing || isEditableTarget(e.target)) return;
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, enabled]);
}
