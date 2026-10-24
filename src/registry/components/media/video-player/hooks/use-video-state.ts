import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import type { BufferedRange, VideoProgress, VideoTrack } from "../types";
import { readBuffered } from "../lib/format";
import { useAutoplayGroup } from "./use-autoplay-group";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface VideoStateValue {
  isPlaying: boolean;
  isMuted: boolean;
  isLoaded: boolean;
  duration: number;
  currentTime: number;
  hasStarted: boolean;
  isBuffering: boolean;
  hasError: boolean;
  buffered: BufferedRange[];
}

type VideoAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "set-muted"; muted: boolean }
  /**
   * A new source starts loading. `resuming`: it replaces a failed one, and playback picks up where
   * it stopped. `buffering`: playback will restart, so show the loading state until it does.
   */
  | { type: "source"; resuming: boolean; buffering: boolean }
  | { type: "clear-error" }
  | { type: "loaded"; duration: number }
  | { type: "set-current-time"; currentTime: number }
  | { type: "buffered"; buffered: BufferedRange[] }
  | { type: "waiting" }
  | { type: "ready" }
  | { type: "error" }
  | { type: "recovering" }
  | { type: "ended" };

const initialState: VideoStateValue = {
  isPlaying: false,
  isMuted: true,
  isLoaded: false,
  duration: NaN,
  currentTime: 0,
  hasStarted: false,
  isBuffering: false,
  hasError: false,
  buffered: [],
};

const sameRanges = (a: BufferedRange[], b: BufferedRange[]) =>
  a.length === b.length && a.every((r, i) => r.start === b[i]!.start && r.end === b[i]!.end);

function videoReducer(state: VideoStateValue, action: VideoAction): VideoStateValue {
  switch (action.type) {
    case "play":
      return state.isPlaying && state.hasStarted && !state.hasError
        ? state
        : { ...state, isPlaying: true, hasStarted: true, hasError: false };
    case "pause":
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case "set-muted":
      return state.isMuted === action.muted ? state : { ...state, isMuted: action.muted };
    case "source":
      return action.resuming
        ? { ...initialState, isMuted: state.isMuted, hasStarted: state.hasStarted, isBuffering: action.buffering }
        : { ...initialState, isMuted: state.isMuted };
    case "clear-error":
      return state.hasError || state.isBuffering ? { ...state, hasError: false, isBuffering: false } : state;
    case "loaded":
      // Metadata is in: nothing is pending any more (a resumed play re-enters `waiting` if it must).
      return { ...state, isLoaded: true, duration: action.duration, isBuffering: false };
    case "set-current-time":
      return state.currentTime === action.currentTime
        ? state
        : { ...state, currentTime: action.currentTime };
    case "buffered":
      return sameRanges(state.buffered, action.buffered) ? state : { ...state, buffered: action.buffered };
    case "waiting":
      return state.isBuffering ? state : { ...state, isBuffering: true };
    case "ready":
      return state.isBuffering ? { ...state, isBuffering: false } : state;
    case "recovering":
      return { ...state, isBuffering: true, hasError: false };
    case "error":
      return { ...state, isBuffering: false, hasError: true, isPlaying: false };
    case "ended":
      return { ...state, isPlaying: false, currentTime: 0 };
    default:
      return state;
  }
}

/** `showing` for `index`, `hidden` for whichever track was showing (cues stay loaded). */
function showTrack(list: TextTrackList, index: number | null) {
  for (let i = 0; i < list.length; i++) {
    const track = list[i];
    if (!track) continue;
    if (i === index) track.mode = "showing";
    else if (track.mode === "showing") track.mode = "hidden";
  }
}

/** First `default` track, else none. */
const defaultTrackIndex = (tracks: VideoTrack[]) => {
  const i = tracks.findIndex((t) => t.default);
  return i === -1 ? null : i;
};

export interface UseVideoStateOptions {
  /** The host's `src`. */
  src: string;
  /** The `muted` prop. */
  muted: boolean;
  /** `muted` is controlled (an `onMutedChange` was passed). */
  onMutedChange?: (muted: boolean) => void;
  isActive: boolean;
  tracks: VideoTrack[];
  autoplayGroup?: string;
  /** Autoplay in view is on (and not disabled by reduced motion). */
  autoPlayInView: boolean;
  /** Visibility for autoplay: `null` = unknown (never starts or stops playback). */
  visible: boolean | null;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onProgress?: (progress: VideoProgress) => void;
  onLoadedMetadata?: (duration: number) => void;
  onError?: (error: MediaError | null) => void;
  onMediaError?: (src: string) => Promise<string | void> | string | void;
}

export function useVideoState(options: UseVideoStateOptions) {
  const { src, muted, isActive, tracks, autoplayGroup } = options;
  const mutedControlled = options.onMutedChange !== undefined;

  const [state, dispatch] = useReducer(videoReducer, { ...initialState, isMuted: muted });

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
  }, []);

  // Latest options for the memoised handlers (no effect cascade on identity change).
  const optionsRef = useRef(options);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    optionsRef.current = options;
    isActiveRef.current = isActive;
  });

  // ─── Source: the host's `src`, or the URL `onMediaError` returned for it ─────────────────
  const [override, setOverride] = useState<{ for: string; src: string } | null>(null);
  const effectiveSrc = override && override.for === src ? override.src : src;
  const effectiveSrcRef = useRef(effectiveSrc);
  /** Host `src` values `onMediaError` was already asked about — once per `src` (C8). */
  const askedRef = useRef(new Set<string>());
  /** Where to pick up after an error: set at the error, consumed by the next `loadedmetadata`. */
  const resumeRef = useRef<{ time: number; play: boolean } | null>(null);
  /** Playing as far as the user is concerned — survives the `error` event. */
  const playingRef = useRef(false);
  /** A handler saw these events (so the mount check below does not repeat them). */
  const metadataSeenRef = useRef(false);
  const errorSeenRef = useRef(false);
  /** The URL the last `onMediaError` answer gave, and whether an answer is still pending. */
  const refreshUrlRef = useRef<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (effectiveSrcRef.current === effectiveSrc) return;
    effectiveSrcRef.current = effectiveSrc;
    // Resume only into the refreshed URL — or a URL that arrived while the refresh was pending (a
    // host such as media-carousel echoes the refreshed URL into `src`). Any other new `src` is
    // different media: it starts from 0, idle.
    const refreshed =
      resumeRef.current !== null && (pendingRef.current || effectiveSrc === refreshUrlRef.current);
    if (!refreshed) {
      resumeRef.current = null;
      playingRef.current = false;
    }
    dispatch({ type: "source", resuming: refreshed, buffering: refreshed && !!resumeRef.current?.play });
  }, [effectiveSrc]);

  // ─── Muted: controlled → the prop wins on every render ─────────────────────────────────
  useIsoLayoutEffect(() => {
    const el = videoElRef.current;
    if (mutedControlled && el && el.muted !== muted) el.muted = muted;
  });
  const isMuted = mutedControlled ? muted : state.isMuted;

  // rAF cleanup on unmount.
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pause when isActive flips false. Hook owns video DOM, single dep.
  useEffect(() => {
    if (!isActive) videoElRef.current?.pause();
  }, [isActive]);

  const pause = useCallback(() => {
    videoElRef.current?.pause();
  }, []);
  const claimGroup = useAutoplayGroup(autoplayGroup, pause);

  const play = useCallback(async () => {
    const el = videoElRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch {
      // Browser autoplay policy may reject; a user gesture is required.
    }
  }, []);

  const report = useCallback((el: HTMLVideoElement) => {
    const buffered = readBuffered(el);
    dispatch({ type: "buffered", buffered });
    optionsRef.current.onProgress?.({ currentTime: el.currentTime, duration: el.duration, buffered });
  }, []);

  // ─── Media event handlers ───────────────────────────────────────────────────────────────
  const handleVideoPlay = useCallback(() => {
    playingRef.current = true;
    dispatch({ type: "play" });
    claimGroup();
    optionsRef.current.onPlay?.();
  }, [claimGroup]);

  const handleVideoPause = useCallback(() => {
    playingRef.current = false;
    dispatch({ type: "pause" });
    optionsRef.current.onPause?.();
  }, []);

  const handleVideoEnded = useCallback(() => {
    playingRef.current = false;
    dispatch({ type: "ended" });
    optionsRef.current.onEnded?.();
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    metadataSeenRef.current = true;
    dispatch({ type: "loaded", duration: el.duration });
    optionsRef.current.onLoadedMetadata?.(el.duration);
    const resume = resumeRef.current;
    if (!resume) return;
    resumeRef.current = null;
    if (resume.time > 0 && (!Number.isFinite(el.duration) || resume.time < el.duration)) {
      el.currentTime = resume.time;
      dispatch({ type: "set-current-time", currentTime: resume.time });
    }
    if (resume.play && isActiveRef.current) void el.play().catch(() => {});
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = videoElRef.current;
      if (!el) return;
      dispatch({ type: "set-current-time", currentTime: el.currentTime });
      optionsRef.current.onTimeUpdate?.(el.currentTime, el.duration);
      report(el);
    });
  }, [report]);

  const handleVideoProgress = useCallback(() => {
    const el = videoElRef.current;
    if (el) report(el);
  }, [report]);

  const handleVideoWaiting = useCallback(() => dispatch({ type: "waiting" }), []);
  const handleVideoReady = useCallback(() => dispatch({ type: "ready" }), []);

  /** The media failed: report it, remember where to resume, and ask `onMediaError` once per `src`. */
  const failWith = useCallback((el: HTMLVideoElement) => {
    errorSeenRef.current = true;
    const opts = optionsRef.current;
    opts.onError?.(el.error);
    if (!resumeRef.current) {
      resumeRef.current = { time: el.currentTime || 0, play: playingRef.current };
    }
    const host = opts.src;
    const handler = opts.onMediaError;
    if (!handler || askedRef.current.has(host)) {
      dispatch({ type: "error" });
      return;
    }
    askedRef.current.add(host);
    pendingRef.current = true;
    dispatch({ type: "recovering" });
    const failed = effectiveSrcRef.current;
    const apply = (next: string | void) => {
      pendingRef.current = false;
      // The host moved on while we waited (or echoed the refreshed URL itself): its `src` owns
      // the player now.
      if (optionsRef.current.src !== host) return;
      if (typeof next === "string" && next && next !== failed) {
        refreshUrlRef.current = next;
        setOverride({ for: host, src: next });
      } else {
        dispatch({ type: "error" });
      }
    };
    try {
      const result = handler(failed);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<string | void>).then(apply, () => apply(undefined));
      } else {
        apply(result as string | void);
      }
    } catch {
      // A throwing handler is a failed refresh: show the error, never ask again for this `src`.
      apply(undefined);
    }
  }, []);

  const handleVideoError = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => failWith(e.currentTarget),
    [failWith],
  );

  // A server-rendered `<video>` starts loading before hydration, and events it fired before React
  // attached its handlers are lost: metadata (→ no duration, no seek bar), an error (→ an expired
  // URL never reaches `onMediaError`), `autoPlay`'s play. Read the element once on mount instead.
  useEffect(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (el.error && !errorSeenRef.current) {
      failWith(el);
      return;
    }
    if (el.readyState >= 1 && !metadataSeenRef.current) handleVideoLoadedMetadata();
    if (!el.paused) handleVideoPlay();
  }, [failWith, handleVideoLoadedMetadata, handleVideoPlay]);

  const handleVideoVolumeChange = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    dispatch({ type: "set-muted", muted: el.muted });
  }, []);

  const videoEventHandlers = useMemo(
    () => ({
      onPlay: handleVideoPlay,
      onPause: handleVideoPause,
      onEnded: handleVideoEnded,
      onLoadedMetadata: handleVideoLoadedMetadata,
      onTimeUpdate: handleVideoTimeUpdate,
      onProgress: handleVideoProgress,
      onWaiting: handleVideoWaiting,
      onStalled: handleVideoWaiting,
      onPlaying: handleVideoReady,
      onCanPlay: handleVideoReady,
      onError: handleVideoError,
      onVolumeChange: handleVideoVolumeChange,
    }),
    [
      handleVideoPlay,
      handleVideoPause,
      handleVideoEnded,
      handleVideoLoadedMetadata,
      handleVideoTimeUpdate,
      handleVideoProgress,
      handleVideoWaiting,
      handleVideoReady,
      handleVideoError,
      handleVideoVolumeChange,
    ],
  );

  // ─── Commands ───────────────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        // Browser autoplay policy may reject; user gesture is required.
      });
    } else {
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoElRef.current;
    const opts = optionsRef.current;
    if (opts.onMutedChange) {
      opts.onMutedChange(!opts.muted);
      return;
    }
    if (!el) return;
    el.muted = !el.muted;
    // Browsers also fire `volumechange`; dispatching here keeps environments that don't in sync.
    dispatch({ type: "set-muted", muted: el.muted });
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = videoElRef.current;
    if (!el || !Number.isFinite(seconds)) return;
    const max = Number.isFinite(el.duration) ? el.duration : Infinity;
    const next = Math.min(Math.max(0, seconds), max);
    el.currentTime = next;
    dispatch({ type: "set-current-time", currentTime: next });
  }, []);

  const retry = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (!resumeRef.current) resumeRef.current = { time: el.currentTime || 0, play: playingRef.current };
    el.load();
    if (resumeRef.current.play && isActiveRef.current) {
      dispatch({ type: "recovering" });
      // `play()` also loads under `preload="none"`, where `load()` alone fetches nothing.
      void el.play().catch(() => {});
    } else {
      // Paused / idle: drop the overlay; the time is restored when metadata loads (or on play).
      dispatch({ type: "clear-error" });
    }
  }, []);

  // ─── Autoplay in view (VP5) ─────────────────────────────────────────────────────────────
  const { autoPlayInView, visible } = options;
  useEffect(() => {
    if (!autoPlayInView || visible === null) return;
    const el = videoElRef.current;
    if (!el) return;
    if (!visible) {
      el.pause();
      return;
    }
    if (!isActive) return;
    const opts = optionsRef.current;
    // Browsers allow muted autoplay only — unless the host controls `muted` to false.
    if (!(opts.onMutedChange && !opts.muted) && !el.muted) {
      el.muted = true;
      if (!opts.onMutedChange) dispatch({ type: "set-muted", muted: true });
    }
    void el.play().catch(() => {});
  }, [autoPlayInView, visible, isActive]);

  // ─── Captions ───────────────────────────────────────────────────────────────────────────
  const tracksKey = tracks.map((t) => `${t.kind}\u0000${t.srcLang}\u0000${t.src}`).join("\u0001");
  const [trackState, setTrackState] = useState<{ key: string; active: number | null }>(() => ({
    key: tracksKey,
    active: defaultTrackIndex(tracks),
  }));
  const activeTrack = trackState.key === tracksKey ? trackState.active : defaultTrackIndex(tracks);

  const setActiveTrack = useCallback(
    (index: number | null) => {
      const list = videoElRef.current?.textTracks;
      if (list) showTrack(list, index);
      setTrackState({ key: tracksKey, active: index });
    },
    [tracksKey],
  );

  // A track switched on elsewhere (the browser's own fullscreen menu) — follow it.
  useEffect(() => {
    const list = videoElRef.current?.textTracks;
    if (!list || typeof list.addEventListener !== "function") return;
    const onChange = () => {
      let showing: number | null = null;
      for (let i = 0; i < list.length; i++) if (list[i]?.mode === "showing") showing = i;
      setTrackState({ key: tracksKey, active: showing });
    };
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [tracksKey]);

  return {
    state: { ...state, isMuted },
    activeTrack,
    effectiveSrc,
    videoElRef,
    videoRef,
    videoEventHandlers,
    play,
    pause,
    togglePlay,
    toggleMute,
    seek,
    retry,
    setActiveTrack,
  };
}
