"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../types";

type Recovery = (item: MediaItem) => Promise<string | void> | string | void;

/** One entry per item id + host URL: the host changing `url` starts over. */
const basisOf = (item: MediaItem) => `${item.id}\u0000${item.url}`;

export interface MediaRecovery {
  /** The URL to render: the replacement after a successful recovery, else `item.url`. */
  urlFor: (item: MediaItem) => string;
  /** Call from the media element's `error` event. */
  onError: (item: MediaItem) => void;
}

/**
 * `onMediaError` once per item + URL (C8): a resolved string replaces the URL and the element
 * retries; a second failure (of the replacement, or after a void / rejected answer) never asks
 * again. Without a handler it does nothing.
 */
export function useMediaRecovery(onMediaError: Recovery | undefined): MediaRecovery {
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const askedRef = useRef(new Set<string>());
  const handlerRef = useRef(onMediaError);
  useEffect(() => {
    handlerRef.current = onMediaError;
  });

  const urlFor = useCallback(
    (item: MediaItem) => replacements[basisOf(item)] ?? item.url,
    [replacements],
  );

  const onError = useCallback((item: MediaItem) => {
    const handler = handlerRef.current;
    const basis = basisOf(item);
    if (!handler || askedRef.current.has(basis)) return;
    askedRef.current.add(basis);
    const apply = (next: string | void) => {
      if (typeof next === "string" && next && next !== item.url) {
        setReplacements((prev) => ({ ...prev, [basis]: next }));
      }
    };
    try {
      const result = handler(item);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<string | void>).then(apply, () => {});
      } else {
        apply(result as string | void);
      }
    } catch {
      // A throwing handler is a failed recovery: keep the broken media, never ask again.
    }
  }, []);

  return { urlFor, onError };
}
