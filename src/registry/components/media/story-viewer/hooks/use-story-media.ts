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
import { createMediaPreloader, dataSaverOn, type MediaPreloader } from "../lib/preload";
import type {
  Story,
  StoryItem,
  StoryItemUnavailableReason,
  StoryResolvedMedia,
} from "../types";

/** How many resolved results the viewer keeps while open (current, next, and a little history for the cube ghost). */
const RESULT_CAP = 8;
/** A result is never asked for again sooner than this after it was fetched (no tight loop on `maxAgeMs: 0`). */
const MIN_REFETCH_MS = 500;

/** Wall clock for render-time adjustments (kept out of component bodies on purpose). */
// now-ok: only compared with the expiry of a `resolveMedia` answer, which exists only on the client after it resolved (the server render has none), so it never makes server and client markup differ
const nowMs = () => Date.now();

/** One resolved result plus what the viewer needs to age it. */
interface ResultEntry {
  media: StoryResolvedMedia;
  /** Epoch ms after which the result may not be reused (`Infinity` = never). */
  exp: number;
  /** Epoch ms it was fetched. */
  at: number;
  /** `invalidateMedia` hit the item on screen: it keeps playing this entry; `next` replaces it on leave. */
  stale?: boolean;
  /** The fresh result fetched for a stale on-screen item. */
  next?: ResultEntry;
}

function computeExpiry(media: StoryResolvedMedia, at: number): number {
  let exp = Infinity;
  if (typeof media.maxAgeMs === "number" && Number.isFinite(media.maxAgeMs)) {
    exp = at + Math.max(0, media.maxAgeMs);
  }
  if (typeof media.expiresAt === "number" && Number.isFinite(media.expiresAt)) {
    exp = Math.min(exp, media.expiresAt);
  }
  return exp;
}

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
  /** Active pause reasons. The notice timer waits while any reason other than `unavailable` holds. */
  pauseReasons?: string[];
  addPauseReason: (reason: string) => void;
  removePauseReason: (...reasons: string[]) => void;
  goToNextItem: (cause?: "completed" | "left") => void;
  /** 0.7.0 - warm the next item's media off-DOM. Default `true`. */
  preloadNext?: boolean;
}

export interface UseStoryMediaResult {
  /** URL to render for the current item (`undefined` while it resolves / when unavailable). */
  src: string | undefined;
  poster: string | undefined;
  /** 0.7.0 - `srcset` for the current image (item or resolved; none after an `onMediaError` retry). */
  srcSet: string | undefined;
  /** 0.7.0 - `sizes` that goes with `srcSet`. */
  sizes: string | undefined;
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
   * asked for a new `src` (again after a retried URL has loaded and failed later); otherwise (or on
   * a void answer / a retry that failed before it loaded) the item is unavailable ("media").
   * Returns `true` (the pipeline owns every failure).
   */
  reportFailure: (kind: "image" | "video" | "frame") => boolean;
  /** The current item's media loaded (image load / video playing / frame ready). Re-arms the retry. */
  markLoaded: () => void;
  /** For `<VideoPlayer onMediaError>`: asks the host; undefined without an `onMediaError`. */
  videoMediaError: ((failedSrc: string) => Promise<string | void>) | undefined;
  /** The playable URL of any item the viewer already has (for the cube ghost faces). Never an expired one. */
  srcFor: (story: Story, item: StoryItem) => string | undefined;
  /** 0.7.0 - handle `invalidateMedia`. */
  invalidateMedia: (itemId?: string, storyId?: string) => void;
}

/**
 * Media pipeline for the current item: lazy URL resolution (current + next only),
 * the `onMediaError` retry (re-armed once a retried URL loads), result ageing
 * (`maxAgeMs` / `expiresAt` / `invalidateMedia`), the unavailable path (`resolve` /
 * `media` / `timeout`) with its notice timing, pause reason and `onItemUnavailable`,
 * and the off-DOM preload of the next item.
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
    pauseReasons,
    addPauseReason,
    removePauseReason,
    preloadNext = true,
  } = opts;

  const hasResolver = !!resolveMedia;
  const hasErrorHandler = !!onMediaError;

  const resolveRef = useRef(resolveMedia);
  const errorHandlerRef = useRef(onMediaError);
  const onUnavailableRef = useRef(opts.onItemUnavailable);
  const goNextRef = useRef(opts.goToNextItem);
  const storiesRef = useRef(stories);
  useEffect(() => {
    resolveRef.current = resolveMedia;
    errorHandlerRef.current = onMediaError;
    onUnavailableRef.current = opts.onItemUnavailable;
    goNextRef.current = opts.goToNextItem;
    storiesRef.current = stories;
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

  const [results, setResults] = useState<Record<string, ResultEntry>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});
  /** URLs `onMediaError` supplied, remembered for the item's next visit while the viewer is open. */
  const [retryUrls, setRetryUrls] = useState<Record<string, string>>({});
  /** Items whose remembered retry URL must be dropped once they leave the screen (`invalidateMedia`). */
  const [retryStale, setRetryStale] = useState<Record<string, true>>({});
  const [clock, setClock] = useState(0);
  const inflightRef = useRef(new Set<string>());
  const ticketRef = useRef(new Map<string, number>());
  const ticketSeqRef = useRef(0);
  const windowKeysRef = useRef<string[]>([]);
  const itemKeyRef = useRef(itemKey);
  useEffect(() => {
    windowKeysRef.current = isOpen ? windowItems.map((w) => w.key) : [];
    itemKeyRef.current = itemKey;
  });

  // Close drops everything (a reopen resolves afresh); leaving an item drops its failure so a
  // revisit tries again. Render-time adjustments, no effects.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setResults({});
      setFailed({});
      setRetryUrls({});
      setRetryStale({});
    }
  }
  const [prevKey, setPrevKey] = useState(itemKey);
  if (prevKey !== itemKey) {
    setPrevKey(itemKey);
    // The item that just left: a failure is forgotten (a revisit tries again); an item
    // `invalidateMedia` marked stale while on screen takes its fresh result (or is dropped).
    if (failed[prevKey]) {
      const next = { ...failed };
      delete next[prevKey];
      setFailed(next);
    }
    const left = results[prevKey];
    const now = nowMs();
    const arrived = results[itemKey];
    const arrivedExpired = !!arrived && arrived.exp <= now;
    if ((left && left.stale) || arrivedExpired) {
      const next = { ...results };
      if (left?.stale) {
        if (left.next) next[prevKey] = left.next;
        else delete next[prevKey];
      }
      // The item that just arrived has not been shown yet: an aged-out result is dropped, so it is
      // resolved again before it plays. (The item already on screen is never touched.)
      if (arrivedExpired) delete next[itemKey];
      setResults(next);
    }
    if (retryStale[prevKey]) {
      const next = { ...retryUrls };
      delete next[prevKey];
      setRetryUrls(next);
      const flags = { ...retryStale };
      delete flags[prevKey];
      setRetryStale(flags);
    }
    // Negative cache: a resolve failure recorded while the item was only "next" gets ONE retry
    // now that it is current (a failure while current stays, until the item is left).
    if (failed[itemKey]) {
      const next = { ...failed };
      delete next[prevKey];
      delete next[itemKey];
      setFailed(next);
    }
  }

  const windowSig = windowItems.map((w) => w.key).join("|");
  useEffect(() => {
    if (!isOpen || !hasResolver || held) return;
    const now = nowMs();
    for (const { key, item } of windowItems) {
      if (item.src || failed[key] || inflightRef.current.has(key)) continue;
      const entry = results[key];
      const onScreen = key === itemKey;
      let needs = !entry;
      if (entry) {
        if (onScreen) needs = !!entry.stale && !entry.next;
        else needs = entry.exp <= now && now - entry.at >= MIN_REFETCH_MS;
      }
      if (!needs) continue;
      inflightRef.current.add(key);
      const ticket = ++ticketSeqRef.current;
      ticketRef.current.set(key, ticket);
      const hadEntry = !!entry;
      const settle = (value: StoryResolvedMedia | null) => {
        if (ticketRef.current.get(key) !== ticket) return; // invalidated / superseded
        ticketRef.current.delete(key);
        inflightRef.current.delete(key);
        if (!windowKeysRef.current.includes(key)) return; // navigated away / closed meanwhile
        if (value && typeof value.src === "string" && value.src) {
          const at = nowMs();
          const fresh: ResultEntry = { media: value, exp: computeExpiry(value, at), at };
          setResults((prev) => {
            const old = prev[key];
            const next = { ...prev };
            if (old && old.stale && key === itemKeyRef.current) {
              next[key] = { ...old, next: fresh };
            } else {
              delete next[key];
              next[key] = fresh;
            }
            const keys = Object.keys(next);
            for (const drop of keys.slice(0, Math.max(0, keys.length - RESULT_CAP))) {
              if (drop !== key && drop !== itemKeyRef.current) delete next[drop];
            }
            return next;
          });
        } else if (hadEntry) {
          // A refresh failed: keep what is on screen / cached, never turn it unavailable.
          setResults((prev) => {
            const old = prev[key];
            return old && old.stale ? { ...prev, [key]: { ...old, stale: false } } : prev;
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
  }, [isOpen, hasResolver, held, windowSig, windowItems, results, failed, itemKey, clock]);

  // Wake up when the earliest NON-current window result ages out (the item on screen is never swapped).
  useEffect(() => {
    if (!isOpen || !hasResolver) return;
    let earliest = Infinity;
    const now = nowMs();
    for (const { key, item } of windowItems) {
      if (key === itemKey || item.src) continue;
      const entry = results[key];
      if (!entry || !Number.isFinite(entry.exp)) continue;
      earliest = Math.min(earliest, Math.max(entry.exp, entry.at + MIN_REFETCH_MS));
    }
    if (!Number.isFinite(earliest)) return;
    const t = window.setTimeout(() => setClock((c) => c + 1), Math.max(0, earliest - now));
    return () => window.clearTimeout(t);
  }, [isOpen, hasResolver, windowItems, results, itemKey]);

  // ─── Retry state (image / frame / video) and unavailable flags ──────────
  const [flag, setFlag] = useState<{
    key: string;
    reason: "media" | "timeout";
  } | null>(null);
  const retriedKeyRef = useRef("");
  const videoErrorsRef = useRef({ key: "", count: 0 });
  /** A retry URL was applied and has not loaded yet: `{ key, url }`. */
  const awaitedRef = useRef<{ key: string; url: string } | null>(null);
  // New entry (item change / open / close) -> clean slate.
  const [entry, setEntry] = useState({ key: itemKey, open: isOpen });
  if (entry.key !== itemKey || entry.open !== isOpen) {
    setEntry({ key: itemKey, open: isOpen });
    if (flag) setFlag(null);
  }
  useEffect(() => {
    retriedKeyRef.current = "";
    videoErrorsRef.current = { key: "", count: 0 };
    awaitedRef.current = null;
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

  const resolvedEntry = results[itemKey];
  const resolved = resolvedEntry?.media;
  const retryUrl = retryUrls[itemKey];
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
    : (retryUrl ?? currentItem?.src ?? resolved?.src);
  const poster = resolved?.poster;
  // `srcset` belongs to the original URL only: a retry URL plays alone.
  const srcSet = retryUrl ? undefined : (currentItem?.srcSet ?? resolved?.srcSet);
  const sizes = retryUrl ? undefined : (currentItem?.sizes ?? resolved?.sizes);

  // The failing item as the host should see it (resolved `src` filled in).
  const currentItemRef = useRef<StoryItem | undefined>(undefined);
  const srcRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    currentItemRef.current =
      currentItem && src ? { ...currentItem, src } : currentItem;
    srcRef.current = src;
  });

  const rememberRetry = useCallback((key: string, url: string) => {
    awaitedRef.current = { key, url };
    setRetryUrls((prev) => ({ ...prev, [key]: url }));
  }, []);
  const dropRetryUrl = useCallback((key: string) => {
    setRetryUrls((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  const forgetRetry = useCallback(
    (key: string) => {
      if (awaitedRef.current?.key === key) awaitedRef.current = null;
      dropRetryUrl(key);
    },
    [dropRetryUrl],
  );

  /**
   * The current item's media loaded. If it was playing a retry URL, the one-shot retry is re-armed:
   * a later failure asks the host again (once per URL that loaded).
   */
  const markLoaded = useCallback(() => {
    const awaited = awaitedRef.current;
    if (!awaited || awaited.key !== itemKeyRef.current) return;
    // A ready signal from the failed URL (e.g. a video `timeupdate` queued before the swap) does
    // not count: only the retry URL itself, once it is the one on the stage.
    if (srcRef.current !== awaited.url) return;
    awaitedRef.current = null;
    retriedKeyRef.current = "";
    videoErrorsRef.current = { key: "", count: 0 };
  }, []);

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
        // <VideoPlayer> asks `videoMediaError` itself on an error and resumes; a second error
        // before the retried URL loaded is final.
        const seen = videoErrorsRef.current;
        const count = seen.key === key ? seen.count + 1 : 1;
        videoErrorsRef.current = { key, count };
        if (count > 1) {
          // Keep `awaitedRef`: the player's own ask for this URL arrives next and must be refused.
          dropRetryUrl(key);
          markUnavailable("media");
        }
        return true;
      }
      if (retriedKeyRef.current === key) {
        forgetRetry(key);
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
          rememberRetry(key, next);
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
    [markUnavailable, rememberRetry, forgetRetry, dropRetryUrl],
  );

  const videoMediaError = useMemo(() => {
    if (!hasErrorHandler) return undefined;
    return (failedSrc: string): Promise<string | void> => {
      const key = itemKeyRef.current;
      // A retried URL that failed before it ever loaded: the host is not asked again.
      if (awaitedRef.current?.key === key) {
        forgetRetry(key);
        markUnavailable("media");
        return Promise.resolve(undefined);
      }
      const settle = (next: string | void): string | void => {
        if (itemKeyRef.current === key) {
          if (typeof next === "string" && next && next !== failedSrc) {
            // Echo the URL into `src` so the player (which asks once per `src`) can ask again
            // if this one loads and fails later.
            rememberRetry(key, next);
          } else {
            markUnavailable("media");
          }
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
  }, [hasErrorHandler, markUnavailable, rememberRetry, forgetRetry]);

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
  // 0.6.2 - the notice counts down only while nothing else holds the viewer: another pause reason
  // (sheet, hold, hidden tab, host...) stops the clock and the rest of the time runs afterwards.
  const otherHolds = !!pauseReasons && pauseReasons.some((r) => r !== "unavailable");
  const noticeLeftRef = useRef<{ sig: string; ms: number } | null>(null);
  useEffect(() => {
    if (!unavailable || stayUntilClosed) {
      noticeLeftRef.current = null;
      return;
    }
    if (unavailableNoticeMs <= 0) {
      goNextRef.current("left");
      return;
    }
    const sig = `${itemKey}|${unavailable}`;
    if (noticeLeftRef.current?.sig !== sig) {
      noticeLeftRef.current = { sig, ms: unavailableNoticeMs };
    }
    if (otherHolds) return;
    const left = noticeLeftRef.current;
    const startedAt = Date.now();
    const t = window.setTimeout(() => goNextRef.current("left"), left.ms);
    return () => {
      window.clearTimeout(t);
      left.ms = Math.max(0, left.ms - (Date.now() - startedAt));
    };
  }, [unavailable, itemKey, stayUntilClosed, unavailableNoticeMs, otherHolds]);

  const srcFor = useCallback(
    (story: Story, item: StoryItem): string | undefined => {
      const key = `${story.id}:${item.id}`;
      const own = retryUrls[key] ?? item.src;
      if (own) return own;
      const e = results[key];
      if (!e) return undefined;
      // The ghost of the item on screen shows what the stage shows; any other never an aged-out URL.
      return key === itemKey || e.exp > nowMs() ? e.media.src : undefined;
    },
    [results, retryUrls, itemKey],
  );

  // ─── invalidateMedia (handle) ───────────────────────────────────────────
  const invalidateMedia = useCallback((itemId?: string, storyId?: string) => {
    const all = itemId === undefined && storyId === undefined;
    const wanted = new Set<string>();
    if (!all) {
      for (const s of storiesRef.current) {
        if (storyId !== undefined && s.id !== storyId) continue;
        for (const it of s.items) {
          if (itemId !== undefined && it.id !== itemId) continue;
          wanted.add(`${s.id}:${it.id}`);
        }
      }
    }
    const matches = (key: string) => all || wanted.has(key);
    const current = itemKeyRef.current;
    for (const key of [...ticketRef.current.keys()]) {
      if (!matches(key)) continue;
      ticketRef.current.delete(key); // an answer still in flight is for the old URL
      inflightRef.current.delete(key);
    }
    setResults((prev) => {
      const next: Record<string, ResultEntry> = {};
      let changed = false;
      for (const [key, e] of Object.entries(prev)) {
        if (!matches(key)) {
          next[key] = e;
        } else if (key === current) {
          next[key] = { ...e, stale: true, next: undefined };
          changed = true;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setFailed((prev) => {
      const keys = Object.keys(prev).filter(matches);
      if (!keys.length) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
    setRetryUrls((prev) => {
      const keys = Object.keys(prev).filter((k) => matches(k) && k !== current);
      if (!keys.length) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
    if (current && matches(current)) {
      setRetryStale((prev) => (prev[current] ? prev : { ...prev, [current]: true }));
    }
    setClock((c) => c + 1);
  }, []);

  // ─── preloadNext: warm the next item off-DOM once its URL is known ──────
  const preloaderRef = useRef<MediaPreloader | null>(null);
  const nextW = windowItems[1];
  const nextKey = nextW?.key;
  const nextEntry = nextKey ? results[nextKey] : undefined;
  const nextUrl = nextW
    ? (retryUrls[nextW.key] ??
      nextW.item.src ??
      (nextEntry && nextEntry.exp > nowMs() ? nextEntry.media.src : undefined))
    : undefined;
  const nextType = nextW?.item.type;
  const nextSrcSet = nextW && !retryUrls[nextW.key] ? (nextW.item.srcSet ?? nextEntry?.media.srcSet) : undefined;
  const nextSizes = nextW && !retryUrls[nextW.key] ? (nextW.item.sizes ?? nextEntry?.media.sizes) : undefined;
  useEffect(() => {
    if (!isOpen || !preloadNext || held || dataSaverOn()) {
      preloaderRef.current?.dispose();
      return;
    }
    const preloader = (preloaderRef.current ??= createMediaPreloader());
    if (!nextKey || !nextUrl || !nextType) {
      preloader.sync(null);
      return;
    }
    preloader.sync({ key: nextKey, type: nextType, url: nextUrl, srcSet: nextSrcSet, sizes: nextSizes });
  }, [isOpen, preloadNext, held, nextKey, nextUrl, nextType, nextSrcSet, nextSizes]);
  useEffect(() => () => preloaderRef.current?.dispose(), []);

  return {
    src,
    poster,
    srcSet,
    sizes,
    resolving,
    unavailable,
    stayUntilClosed: !!stayUntilClosed,
    markUnavailable,
    reportFailure,
    markLoaded,
    videoMediaError,
    srcFor,
    invalidateMedia,
  };
}
