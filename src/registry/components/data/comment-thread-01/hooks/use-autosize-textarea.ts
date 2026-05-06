"use client";

import { useLayoutEffect, useRef } from "react";

export interface UseAutosizeTextareaOptions {
  minRows?: number;
  maxRows?: number;
}

/**
 * Resizes a <textarea> to fit its content within [minRows, maxRows] line bounds.
 * Pure DOM mutation in useLayoutEffect — no React state, no rerender.
 *
 * Returns a ref to attach to the textarea element.
 */
export function useAutosizeTextarea(
  value: string,
  opts: UseAutosizeTextareaOptions = {},
) {
  const { minRows = 1, maxRows = 6 } = opts;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset to "auto" so scrollHeight reflects natural content height.
    el.style.height = "auto";
    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const paddingY =
      parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
    const min = lineHeight * minRows + paddingY;
    const max = lineHeight * maxRows + paddingY;
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    // Allow internal scroll only if natural height exceeds maxRows.
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value, minRows, maxRows]);

  return ref;
}
