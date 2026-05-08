"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ActionsV02, HoverState } from "../types";

/**
 * Per v0.2 plan §6.3: hover acquisition has a small lead-in delay
 * (~100ms) to prevent flicker on rapid mouse traversal across
 * neighbors. Hover EXIT (`null`) is immediate — once the user leaves
 * the canvas / hovered entity, the dim treatment lifts without delay.
 *
 * Returned `setHover` is a stable callback (suitable for use as a
 * Sigma event handler dep) that internally manages the debounce timer
 * and clears it on unmount.
 */
export function useHoverDebounce(
  actions: Pick<ActionsV02, "hover">,
  delayMs = 100,
): (target: HoverState) => void {
  const timerRef = useRef<number | null>(null);
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const setHover = useCallback(
    (target: HoverState) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (target === null) {
        actionsRef.current.hover(null);
        return;
      }
      timerRef.current = window.setTimeout(() => {
        actionsRef.current.hover(target);
        timerRef.current = null;
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return setHover;
}
