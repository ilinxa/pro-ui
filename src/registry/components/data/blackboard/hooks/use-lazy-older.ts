import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface UseLazyOlderOpts {
  scrollRef: RefObject<HTMLElement | null>;
  sentinelRef: RefObject<HTMLElement | null>;
  /** Fetch + prepend the next older page. Resolves once state has been updated. */
  load: () => Promise<void>;
  hasMore: boolean;
  enabled: boolean;
  /** The id of the current top note — changes when an older page prepends. */
  topId: string | null;
  /** When true (newest-at-bottom), preserve scroll position across a top-prepend. */
  anchor: boolean;
}

/**
 * Drives scroll-up lazy loading: an IntersectionObserver on a top sentinel triggers
 * `load()` when it scrolls into view (guarded against re-entry), and — in anchor mode —
 * preserves the viewport so prepended notes don't make the content jump.
 */
export function useLazyOlder({
  scrollRef,
  sentinelRef,
  load,
  hasMore,
  enabled,
  topId,
  anchor,
}: UseLazyOlderOpts): { loadingOlder: boolean } {
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingRef = useRef(false);
  const prevHeightRef = useRef<number | null>(null);

  const trigger = useCallback(async () => {
    if (loadingRef.current || !hasMore || !enabled) return;
    loadingRef.current = true;
    setLoadingOlder(true);
    if (anchor && scrollRef.current) prevHeightRef.current = scrollRef.current.scrollHeight;
    try {
      await load();
    } finally {
      loadingRef.current = false;
      setLoadingOlder(false);
    }
  }, [hasMore, enabled, anchor, load, scrollRef]);

  // Restore scroll position after a top-prepend (anchor mode only).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!anchor || el == null || prevHeightRef.current == null) return;
    const delta = el.scrollHeight - prevHeightRef.current;
    if (delta > 0) el.scrollTop += delta;
    prevHeightRef.current = null;
    // Keyed on topId: fires exactly when the leading note changes (a prepend).
  }, [topId, anchor, scrollRef]);

  // Observe the sentinel within the scroll container.
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !enabled || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void trigger();
      },
      { root, rootMargin: "120px 0px 0px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [scrollRef, sentinelRef, enabled, hasMore, trigger]);

  return { loadingOlder };
}
