import { useEffect, useState } from "react";

export interface UseLineClampDetectOptions {
  maxLines: number;
  /**
   * Re-measurement trigger. Hook never reads the value — only uses its
   * identity to detect when re-measurement is needed. Pass a primitive
   * (string, number), a content hash, or any stable identity that changes
   * when the underlying text changes.
   */
  content: unknown;
}

export interface UseLineClampDetectResult {
  /** Pass to your measured element: `<p ref={ref}>...</p>`. */
  ref: (node: HTMLElement | null) => void;
  /** True when the element's natural height exceeds `maxLines × lineHeight`. */
  isTruncated: boolean;
}

/**
 * Detect whether content overflows a line-clamp threshold.
 *
 * Measures `scrollHeight` against `lineHeight × maxLines` after mount and on
 * every container resize (via `ResizeObserver`). Returns `isTruncated: true`
 * only when the content's natural height exceeds the budget — so consumers
 * can hide their "show more" toggle when content fits.
 *
 * The element is tracked via `useState` (not a `useRef` capture) so identity
 * changes — e.g., consumer attaches the ref to a `<p>` inside a list with
 * keys → re-mounts on reorder — re-trigger the observer setup.
 */
export function useLineClampDetect({
  maxLines,
  content,
}: UseLineClampDetectOptions): UseLineClampDetectResult {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!el) return;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      if (!lineHeight || Number.isNaN(lineHeight)) return;
      const maxHeight = lineHeight * maxLines;
      const next = el.scrollHeight > maxHeight + 1; // +1 for sub-pixel rounding
      setIsTruncated((prev) => (prev === next ? prev : next));
    };

    measure(); // initial synchronous measurement
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, content, maxLines]);

  return { ref: setEl, isTruncated };
}
