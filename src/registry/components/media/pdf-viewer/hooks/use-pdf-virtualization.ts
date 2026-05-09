"use client";

import type { PdfVirtualizeMode } from "../types";

interface ResolveArgs {
  numPages: number;
  currentPage: number;
  mode: PdfVirtualizeMode;
  threshold: number;
  /** Pages to render before the current page. */
  bufferAbove?: number;
  /** Pages to render after the current page. */
  bufferBelow?: number;
}

/**
 * Resolves which 1-based page numbers should be rendered as full <Page>
 * components. Other pages are rendered as height-locked placeholders.
 *
 * Rules:
 *   - 'never' OR ('auto' && numPages < threshold) → render all pages
 *   - 'always' OR ('auto' && numPages >= threshold) → window around current
 */
export function resolveVisiblePages({
  numPages,
  currentPage,
  mode,
  threshold,
  bufferAbove = 1,
  bufferBelow = 2,
}: ResolveArgs): Set<number> {
  if (numPages <= 0) return new Set();
  const useVirtual =
    mode === "always" || (mode === "auto" && numPages >= threshold);

  if (!useVirtual) {
    const all = new Set<number>();
    for (let i = 1; i <= numPages; i++) all.add(i);
    return all;
  }

  const start = Math.max(1, currentPage - bufferAbove);
  const end = Math.min(numPages, currentPage + bufferBelow);
  const visible = new Set<number>();
  for (let i = start; i <= end; i++) visible.add(i);
  return visible;
}
