"use client";

import { useCallback, useEffect } from "react";

interface UsePdfPageTrackerArgs {
  containerRef: { current: HTMLElement | null };
  numPages: number;
  ready: boolean;
  onPageChange: (page: number) => void;
}

export interface UsePdfPageTrackerReturn {
  scrollToPage: (page: number, behavior?: ScrollBehavior) => void;
}

/**
 * Tracks which page is "current" based on which page element is closest to
 * the top of the scroll container. Uses IntersectionObserver with a tight
 * top-band root margin so the active page = the topmost intersecting page.
 */
export function usePdfPageTracker(
  args: UsePdfPageTrackerArgs,
): UsePdfPageTrackerReturn {
  const { containerRef, numPages, ready, onPageChange } = args;

  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    if (!container) return;
    if (numPages <= 0) return;

    let frame: number | null = null;

    const update = () => {
      frame = null;
      const pageEls = container.querySelectorAll<HTMLElement>(
        "[data-pdf-page]",
      );
      if (pageEls.length === 0) return;
      const containerTop = container.getBoundingClientRect().top;
      const probeY = containerTop + 80;
      let activePage = 1;
      for (const el of Array.from(pageEls)) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          const n = Number(el.dataset.pdfPage);
          if (Number.isFinite(n) && n > 0) {
            activePage = n;
            break;
          }
        }
        if (rect.top > probeY) break;
        const n = Number(el.dataset.pdfPage);
        if (Number.isFinite(n) && n > 0) {
          activePage = n;
        }
      }
      onPageChange(activePage);
    };

    const onScroll = () => {
      if (frame != null) return;
      frame = requestAnimationFrame(update);
    };

    update();
    container.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(container);
    return () => {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [containerRef, numPages, ready, onPageChange]);

  const scrollToPage = useCallback(
    (page: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(
        `[data-pdf-page="${page}"]`,
      );
      if (!target) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top =
        container.scrollTop + (targetRect.top - containerRect.top) - 8;
      container.scrollTo({ top, behavior });
    },
    [containerRef],
  );

  return { scrollToPage };
}
