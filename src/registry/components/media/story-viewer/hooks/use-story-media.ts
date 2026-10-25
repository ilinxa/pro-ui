"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findAdjacentStoryIndex } from "./use-story-viewer-state";
import type {
  Story,
  StoryItem,
  StoryItemUnavailableReason,
  StoryResolvedMedia,
} from "../types";

/** How many resolved results the viewer keeps while open (current, next, and a little history for the cube ghost). */
const RESULT_CAP = 8;

export interface UseStoryMediaOptions {
  isOpen: boolean;
  stories: Story[];
  cursor: { storyIndex: number; itemIndex: number };
  currentStory: Story | undefined;
  currentItem: StoryItem | undefined;
  /** `${storyId}:${itemId}` of the current item ("" when none). */
  itemKey: string;
  /** A removal notice is held: nothing resolves, nothing is reported. */
  held: boolean;
  resolveMedia?: (item: StoryItem) => Promise<StoryResolvedMedia | null>;
  /**
   * A custom `renderItem` frame is mounted. Without `resolveMedia`, an item with no `src`
   * is then owned by that frame (a text card): not unavailable; the frame reports
   * ready / errors through its context.
   */
  hasCustomFrame?: boolean;
  onMediaError?: (item: StoryItem) => Promise<string | void>;
  onItemUnavailable?: (
    storyId: string,
    itemId: string,
    reason: StoryItemUnavailableReason,
  ) => void;
  unavailableNoticeMs?: number;
  standalone?: boolean;
  addPauseReason: (reason: string) => void;
  removePauseReason: (...reasons: string[]) => void;
  goToNextItem: (cause?: "completed" | "left") => void;
}

export interface UseStoryMediaResult {
  /** URL to render for the current item (`undefined` while it resolves / when unavailable). */
  src: string | undefined;
  poster: string | undefined;
  /** `resolveMedia` is pending for the current item: it is not ready. */
  resolving: boolean;
  /** Why the current item cannot play, or `null`. */
  unavailable: Exclude<StoryItemUnavailableReason, "removed"> | null;
  /** The notice never moves on (standalone + single-item story). */
  stayUntilClosed: boolean;
  /** Mark the current item unavailable (used by `loadTimeoutMs`). Ignored when already unavailable. */
  markUnavailable: (reason: "media" | "timeout") => void;
  /**
   * A media failure of kind `image` / `frame` / `video` was seen. With `onMediaError` the host is
   * asked once for a new `src`; otherwise (or on a void answer / second failure) the item is
   * unavailable ("media"). Returns `true` (the pipeline owns every failure).
   */
  reportFailure: (kind: "image" | "video" | "frame") => boolean;
  /** For `<VideoPlayer onMediaError>`: asks the host once; undefined without an `onMediaError`. */
  videoMediaError: ((failedSrc: string) => Promise<string | void>) | undefined;
  /** The playable URL of any item the viewer already has (for the cube ghost faces). */
  srcFor: (story: Story, item: StoryItem) => string | undefined;
}

/**
 * Media pipeline for the current item: lazy URL resolution (current + next only),
 * the one-shot `onMediaError` retry, and the unavailable path (`resolve` / `media` /
 * `timeout`) with its notice timing, pause reason and `onItemUnavailable`.
 *
 * Resolved URLs live in component state only; they are never written to storage
 * or the URL.
 */
export function useStoryMedia(opts: UseStoryMediaOptions): UseStoryMediaResult {
  const {
    isOpen,
    stories,
    cursor,
    currentStory,
    currentItem,
    itemKey,
    held,
    resolveMedia,
    hasCustomFrame = false,
    onMediaError,
    unavailableNoticeMs = 1500,
    standalone = false,
    addPauseReason,
    removePauseReason,
  } = opts;

  const hasResolver = !!resolveMedia;
  const hasErrorHandler = !!onMediaError;

  const resolveRef = useRef(resolveMedia);
  const errorHandlerRef = useRef(onMediaError);
  const onUnavailableRef = useRef(opts.onItemUnavailable);
  const goNextRef = useRef(opts.goToNextItem);
  useEffect(() => {
    resolveRef.current = resolveMedia;
    errorHandlerRef.current = onMediaError;
    onUnavailableRef.current = opts.onItemUnavailable;
    goNextRef.current = opts.goToNextItem;
  });

  // ─── Resolution window: the current item and the next one ───────────────
  const windowItems = useMemo(() => {
    const out: { key: string; item: StoryItem }[] = [];
    if (!currentStory || !currentItem) return out;
    out.push({ key: `${currentStory.id}:${currentItem.id}`, item: currentItem });
    const nextInStory = currentStory.items[cursor.itemIndex + 1];
    if (nextInStory) {
      out.push({ key: `${currentStory.id}:${nextInStory.id}`, item: nextInStory });
    } else {
      const ns = stories[findAdjacentStoryIndex(stories, cursor.storyIndex, 1)];
      const ni = ns?.items[0];
      if (ns && ni) out.push({ key: `${ns.id}:${ni.id}`, item: ni });
    }
    return out;
  }, [stories, cursor.storyIndex, cursor.itemIndex, currentStory, currentItem]);

  const [results, setResults] = useState<Record<string, StoryResolvedMedia>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});
  const inflightRef = useRef(new Set<string>());
  const windowKeysRef = useRef<string[]>([]);
  useEffect(() => {
    windowKeysRef.current = isOpen ? windowItems.map((w) => w.key) : [];
  }, [windowItems, isOpen]);

  // Close drops everything (a reopen resolves afresh); leaving an item drops its
  // failure so a revisit tries again. Render-time adjustments, no effects.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setResults({});
      setFailed({});
    }
  }
  const [prevKey, setPrevKey] = useState(itemKey);
  if (prevKey !== itemKey) {
    setPrevKey(itemKey);
    if (failed[prevKey]) {
      const next = { ...failed };
      delete next[prevKey];
      setFailed(next);
    }
  }

  const windowSig = windowItems.map((w) => w.key).join("|");
  useEffect(() => {
    if (!isOpen || !hasResolver || held) return;
    for (const { key, item } of windowItems) {
      if (item.src || results[key] || failed[key] || inflightRef.current.has(key)) continue;
      inflightRef.current.add(key);
      const settle = (value: StoryResolvedMedia | null) => {
        inflightRef.current.delete(key);
        if (!windowKeysRef.current.includes(key)) return; // navigated away / closed meanwhile
        if (value && typeof value.src === "string" && value.src) {
          setResults((prev) => {
            const next = { ...prev, [key]: value };
            const keys = Object.keys(next);
            for (const old of keys.slice(0, Math.max(0, keys.length - RESULT_CAP))) {
              if (old !== key) delete next[old];
            }
            return next;
          });
        } else {
          setFailed((prev) => ({ ...prev, [key]: true }));
        }
      };
      try {
        const pending = resolveRef.current?.(item);
        if (pending && typeof pending.then === "function") {
          pending.then(settle, () => settle(null));
        } else {
          settle(null);
        }
      } catch {
        settle(null);
      }
    }
    // windowItems is covered by windowSig + the identity-keyed memo.
  }, [isOpen, hasResolver, held, windowSig, windowItems, results, failed]);

  // ─── Retry state (image / frame) and unavailable flags ──────────────────
  const [override, setOverride] = useState<{ key: string; src: string } | null>(null);
  const [flag, setFlag] = useState<{
    key: string;
    reason: "media" | "timeout";
  } | null>(null);
  const retriedKeyRef = useRef("");
  const videoErrorsRef = useRef({ key: "", count: 0 });
  const itemKeyRef = useRef(itemKey);
  useEffect(() => {
    itemKeyRef.current = itemKey;
  });
  // New entry (item change / open / close) -> clean slate.
  const [entry, setEntry] = useState({ key: itemKey, open: isOpen });
  if (entry.key !== itemKey || entry.open !== isOpen) {
    setEntry({ key: itemKey, open: isOpen });
    if (override) setOverride(null);
    if (flag) setFlag(null);
  }
  useEffect(() => {
    retriedKeyRef.current = "";
    videoErrorsRef.current = { key: "", count: 0 };
  }, [itemKey, isOpen]);

  const markUnavailable = useCallback(
    (reason: "media" | "timeout") => {
      setFlag((prev) =>
        prev && prev.key === itemKeyRef.current
          ? prev
          : { key: itemKeyRef.current, reason },
      );
    },
    [],
  );

  const resolved = results[itemKey];
  const currentOverride = override && override.key === itemKey ? override.src : undefined;
  const hasOwnSrc = !!currentItem?.src;
  const resolveFailed =
    !!currentItem &&
    !hasOwnSrc &&
    ((!hasResolver && !hasCustomFrame) || !!failed[itemKey]);
  const flagged = flag && flag.key === itemKey ? flag.reason : null;
  const unavailable: UseStoryMediaResult["unavailable"] =
    held || !currentItem || !isOpen
      ? null
      : resolveFailed
        ? "resolve"
        : flagged;
  const resolving =
    !!currentItem && !held && !hasOwnSrc && hasResolver && !resolved && !failed[itemKey];
  const src = unavailable
    ? undefined
    : (currentOverride ?? currentItem?.src ?? resolved?.src);
  const poster = resolved?.poster;

  // The failing item as the host should see it (resolved `src` filled in).
  const currentItemRef = useRef<StoryItem | undefined>(undefined);
  const srcRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    currentItemRef.current =
      currentItem && src ? { ...currentItem, src } : currentItem;
    srcRef.current = src;
  });

  const reportFailure = useCallback(
    (kind: "image" | "video" | "frame"): boolean => {
      const handler = errorHandlerRef.current;
      const key = itemKeyRef.current;
      if (!handler) {
        // No `onMediaError` = no new `src`: the item is unavailable at once.
        markUnavailable("media");
        return true;
      }
      if (kind === "video") {
        // <VideoPlayer> asks `videoMediaError` itself on the first error and resumes;
        // a second error on this item is final.
        const seen = videoErrorsRef.current;
        const count = seen.key === key ? seen.count + 1 : 1;
        videoErrorsRef.current = { key, count };
        if (count > 1) markUnavailable("media");
        return true;
      }
      if (retriedKeyRef.current === key) {
        markUnavailable("media");
        return true;
      }
      retriedKeyRef.current = key;
      const item = currentItemRef.current;
      if (!item) return true;
      const failedSrc = srcRef.current;
      const settle = (next: string | void) => {
        if (itemKeyRef.current !== key) return;
        if (typeof next === "string" && next && next !== failedSrc) {
          setOverride({ key, src: next });
        } else {
          markUnavailable("media");
        }
      };
      try {
        const result = handler(item);
        if (result && typeof result.then === "function") {
          result.then(settle, () => settle(undefined));
        } else {
          settle(result as unknown as string | void);
        }
      } catch {
        settle(undefined);
      }
      return true;
    },
    [markUnavailable],
  );

  const videoMediaError = useMemo(() => {
    if (!hasErrorHandler) return undefined;
    return (failedSrc: string): Promise<string | void> => {
      const key = itemKeyRef.current;
      const settle = (next: string | void): string | void => {
        if (itemKeyRef.current === key && !(typeof next === "string" && next && next !== failedSrc)) {
          markUnavailable("media");
        }
        return next;
      };
      try {
        const item = currentItemRef.current;
        const handler = errorHandlerRef.current;
        if (!item || !handler) return Promise.resolve(settle(undefined));
        return Promise.resolve(handler(item)).then(settle, () => settle(undefined));
      } catch {
        return Promise.resolve(settle(undefined));
      }
    };
  }, [hasErrorHandler, markUnavailable]);

  // ─── Unavailable: pause reason, one event, then move on ─────────────────
  const active = unavailable !== null;
  useLayoutEffect(() => {
    if (!active) return;
    addPauseReason("unavailable");
    return () => removePauseReason("unavailable");
  }, [active, addPauseReason, removePauseReason]);

  const firedRef = useRef("");
  useEffect(() => {
    if (!unavailable || !currentStory || !currentItem) {
      firedRef.current = "";
      return;
    }
    const sig = `${itemKey}|${unavailable}`;
    if (firedRef.current === sig) return;
    firedRef.current = sig;
    onUnavailableRef.current?.(currentStory.id, currentItem.id, unavailable);
  }, [unavailable, itemKey, currentStory, currentItem]);

  const stayUntilClosed = standalone && currentStory?.items.length === 1;
  useEffect(() => {
    if (!unavailable || stayUntilClosed) return;
    if (unavailableNoticeMs <= 0) {
      goNextRef.current("left");
      return;
    }
    const t = window.setTimeout(() => goNextRef.current("left"), unavailableNoticeMs);
    return () => window.clearTimeout(t);
  }, [unavailable, itemKey, stayUntilClosed, unavailableNoticeMs]);

  const srcFor = useCallback(
    (story: Story, item: StoryItem): string | undefined =>
      item.src || results[`${story.id}:${item.id}`]?.src,
    [results],
  );

  return {
    src,
    poster,
    resolving,
    unavailable,
    stayUntilClosed: !!stayUntilClosed,
    markUnavailable,
    reportFailure,
    videoMediaError,
    srcFor,
  };
}
