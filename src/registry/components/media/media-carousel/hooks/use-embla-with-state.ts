"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type {
  EmblaCarouselType,
  EmblaOptionsType,
} from "embla-carousel";

export interface UseEmblaWithStateOptions extends EmblaOptionsType {
  /** Fires on slide change. Does NOT fire on initial mount-sync. */
  onSelect?: (index: number) => void;
}

export interface UseEmblaWithStateResult {
  ref: (node: HTMLElement | null) => void;
  api: EmblaCarouselType | null;
  currentIndex: number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
}

/**
 * Wraps `useEmblaCarousel` with currentIndex state via `useSyncExternalStore`
 * (avoids `setState`-in-effect lint violations) and lifecycle callbacks.
 *
 * **Mount-sync semantics:** `currentIndex` syncs to Embla's initial snap
 * automatically on mount. The user's `onSelect` callback does NOT fire on
 * the mount-sync — only on real slide changes (tracked via `isFirstFireRef`).
 *
 * `startIndex` is also the server / pre-init snapshot, so a non-zero start hydrates cleanly.
 *
 * Embla options should be memoized by the caller (Embla re-initializes on
 * options-object identity change).
 */
export function useEmblaWithState({
  onSelect,
  ...emblaOptions
}: UseEmblaWithStateOptions): UseEmblaWithStateResult {
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  const initialIndex = emblaOptions.startIndex ?? 0;

  // External-store subscription for currentIndex — no setState in effect.
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on("select", callback);
      emblaApi.on("reInit", callback);
      return () => {
        emblaApi.off("select", callback);
        emblaApi.off("reInit", callback);
      };
    },
    [emblaApi],
  );

  const getSnapshot = useCallback(
    () => emblaApi?.selectedScrollSnap() ?? initialIndex,
    [emblaApi, initialIndex],
  );

  const getServerSnapshot = useCallback(() => initialIndex, [initialIndex]);

  const currentIndex = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Stable ref for onSelect callback — avoids effect cascade on identity change.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Fire user `onSelect` only on real slide changes — skip the initial mount. A last-notified
  // index (not a first-run flag) so StrictMode's effect replay stays silent too.
  const lastNotifiedRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastNotifiedRef.current === null) {
      lastNotifiedRef.current = currentIndex;
      return;
    }
    if (lastNotifiedRef.current === currentIndex) return;
    lastNotifiedRef.current = currentIndex;
    onSelectRef.current?.(currentIndex);
  }, [currentIndex]);

  // A React options change re-inits Embla with the caller's options, and `startIndex` in them
  // wins over the slide Embla was on — put it back, without animating and without a callback.
  const lastIndexRef = useRef(initialIndex);
  useEffect(() => {
    lastIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    if (!emblaApi) return;
    const restore = () => {
      const last = lastIndexRef.current;
      if (emblaApi.selectedScrollSnap() !== last) emblaApi.scrollTo(last, true);
    };
    emblaApi.on("reInit", restore);
    return () => {
      emblaApi.off("reInit", restore);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return {
    ref: emblaRef,
    api: emblaApi ?? null,
    currentIndex,
    scrollTo,
    scrollPrev,
    scrollNext,
  };
}
