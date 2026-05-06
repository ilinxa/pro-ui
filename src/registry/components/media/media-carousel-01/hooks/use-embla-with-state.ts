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

const SERVER_INDEX = 0;

/**
 * Wraps `useEmblaCarousel` with currentIndex state via `useSyncExternalStore`
 * (avoids `setState`-in-effect lint violations) and lifecycle callbacks.
 *
 * **Mount-sync semantics:** `currentIndex` syncs to Embla's initial snap
 * automatically on mount. The user's `onSelect` callback does NOT fire on
 * the mount-sync — only on real slide changes (tracked via `isFirstFireRef`).
 *
 * Embla options should be memoized by the caller (Embla re-initializes on
 * options-object identity change).
 */
export function useEmblaWithState({
  onSelect,
  ...emblaOptions
}: UseEmblaWithStateOptions): UseEmblaWithStateResult {
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  // External-store subscription for currentIndex — no setState in effect.
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on("select", callback);
      return () => {
        emblaApi.off("select", callback);
      };
    },
    [emblaApi],
  );

  const getSnapshot = useCallback(
    () => emblaApi?.selectedScrollSnap() ?? SERVER_INDEX,
    [emblaApi],
  );

  const getServerSnapshot = useCallback(() => SERVER_INDEX, []);

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

  // Fire user `onSelect` only on real slide changes — skip the initial mount.
  const isFirstFireRef = useRef(true);
  useEffect(() => {
    if (isFirstFireRef.current) {
      isFirstFireRef.current = false;
      return;
    }
    onSelectRef.current?.(currentIndex);
  }, [currentIndex]);

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
