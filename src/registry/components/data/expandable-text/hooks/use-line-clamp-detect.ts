import { useEffect, useLayoutEffect, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseLineClampDetectOptions {
  maxLines: number;
  /**
   * Re-measurement trigger. Hook never reads the value — only uses its
   * identity to detect when re-measurement is needed. Pass a primitive
   * (string, number), a content hash, or any stable identity that changes
   * when the underlying text changes.
   */
  content: unknown;
  /**
   * Also re-measure when the element's DOM changes (text or children) — for rich
   * children whose changes do not resize a clamped box. Default: false.
   */
  observeMutations?: boolean;
}

export interface UseLineClampDetectResult {
  /** Pass to your measured element: `<p ref={ref}>...</p>`. */
  ref: (node: HTMLElement | null) => void;
  /** True when the element's natural height exceeds `maxLines × lineHeight`. */
  isTruncated: boolean;
  /** False until the first measurement ran (always false on the server). */
  isMeasured: boolean;
}

/** `line-height: normal` has no px value — approximate it the way browsers do (~1.2 × font size). */
function lineHeightOf(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const lh = parseFloat(style.lineHeight);
  if (lh && !Number.isNaN(lh)) return lh;
  const fs = parseFloat(style.fontSize);
  return fs && !Number.isNaN(fs) ? fs * 1.2 : 0;
}

/**
 * Detect whether content overflows a line-clamp threshold.
 *
 * Measures `scrollHeight` against `lineHeight × maxLines` after mount and on
 * every container resize (via `ResizeObserver`), and — with `observeMutations` —
 * on DOM changes inside the element. Returns `isTruncated: true` only when the
 * content's natural height exceeds the budget — so consumers can hide their
 * "show more" toggle when content fits.
 *
 * The element is tracked via `useState` (not a `useRef` capture) so identity
 * changes — e.g., consumer attaches the ref to a `<p>` inside a list with
 * keys → re-mounts on reorder — re-trigger the observer setup.
 */
export function useLineClampDetect({
  maxLines,
  content,
  observeMutations = false,
}: UseLineClampDetectOptions): UseLineClampDetectResult {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);

  // Layout effect: the first measurement (and one after a content change) lands before paint, so
  // text that grew while unclamped never paints a frame at full length.
  useIsoLayoutEffect(() => {
    if (!el) return;

    const measure = () => {
      const lineHeight = lineHeightOf(el);
      // No usable line height (no layout engine, `font-size: 0`): treat as not truncated, so a
      // caller that clamps until measured never leaves text cut off with no way to expand it.
      const next = lineHeight ? el.scrollHeight > lineHeight * maxLines + 1 : false; // +1 sub-pixel slop
      setIsTruncated((prev) => (prev === next ? prev : next));
      setIsMeasured(true);
    };

    measure(); // initial synchronous measurement
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(el);
    const mutation =
      observeMutations && typeof MutationObserver !== "undefined" ? new MutationObserver(measure) : null;
    mutation?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, [el, content, maxLines, observeMutations]);

  return { ref: setEl, isTruncated, isMeasured };
}
