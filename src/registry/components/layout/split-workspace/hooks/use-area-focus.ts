"use client";

import { useEffect } from "react";

export function useAreaFocus(
  rootRef: React.RefObject<HTMLElement | null>,
  onFocusChange: (areaId: string | null) => void,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const findAreaId = (el: Element | null): string | null => {
      let current: Element | null = el;
      while (current && current !== root) {
        if (current instanceof HTMLElement && current.dataset.areaId) {
          return current.dataset.areaId;
        }
        current = current.parentElement;
      }
      return null;
    };

    const handleFocusIn = (e: FocusEvent) => {
      const areaId = findAreaId(e.target as Element | null);
      onFocusChange(areaId);
    };

    const handleFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Element | null;
      if (!next || !root.contains(next)) {
        onFocusChange(null);
      }
    };

    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);
    return () => {
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
    };
  }, [rootRef, onFocusChange]);
}
