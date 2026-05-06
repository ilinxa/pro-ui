"use client";

import { useEffect, useRef } from "react";

export interface UseStoryKeyboardNavOptions {
  isOpen: boolean;
  onPrevItem: () => void;
  onNextItem: () => void;
  onTogglePause: () => void;
  /** Optional — Radix Dialog already handles Escape via `onOpenChange`; supply only if you want a parallel hook. */
  onClose?: () => void;
}

/**
 * Window-scoped keyboard handlers for the story viewer.
 *
 * - ArrowLeft → onPrevItem
 * - ArrowRight → onNextItem
 * - Space → onTogglePause (preventDefault to stop page scroll)
 * - Escape → onClose (when supplied; deduplicated with Radix Dialog)
 *
 * Listener attaches on `isOpen=true` only and detaches on close — no leaks.
 * Refs-mirror pattern keeps the listener stable; only re-attaches on `isOpen` flip.
 */
export function useStoryKeyboardNav(opts: UseStoryKeyboardNavOptions) {
  const refs = useRef(opts);
  useEffect(() => {
    refs.current = opts;
  });

  const { isOpen } = opts;
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          refs.current.onPrevItem();
          break;
        case "ArrowRight":
          refs.current.onNextItem();
          break;
        case " ":
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
  }, [isOpen]);
}
