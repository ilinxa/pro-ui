# video-player-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`video-player-01-procomp-description.md`](./video-player-01-procomp-description.md) for the what & why.
>
> Migration origin: [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `PostVideoPlayer.tsx` (128 LOC).

## Q-P locks (commitments before code)

| # | Question (from description) | Locked answer |
|---|---|---|
| Q-P1 | Component category — `media` (new) or `data`? | **`media`.** First occupant of the existing `media` category at [src/registry/categories.ts](../../../src/registry/categories.ts). Sets precedent for media-carousel-01 / story-rail-01 / story-viewer-01. |
| Q-P2 | Default `controlsAutoHideMs`? | **2000ms.** Matches kasder + standard video-player UX. Pass `0` to disable auto-hide. |
| Q-P3 | rAF-throttle `onTimeUpdate`? | **Yes — non-negotiable.** Native `timeupdate` fires up to 30×/sec in some browsers; rAF caps at display refresh rate. Cleanup-safe via unmount cancel. |
| Q-P4 | Keyboard scope — global or focus-only? | **Focus-only.** Video element gets `tabIndex={0}`; keys (Space, M) only fire when focused. Avoids multi-video focus contention. |
| Q-P5 | `onDoubleTap` window — 300ms hard-coded or configurable? | **300ms hard-coded at component level.** Hook-level (`useDoubleTap(handler, { windowMs })`) accepts override. |
| Q-P6 | `tracks` prop shape — array of objects or `<track>` children? | **Array of `VideoTrack` objects.** Data-driven, ergonomic; component renders `<track>` elements internally. |
| Q-P7 | `renderControls` receives video ref or just state? | **State only.** Ref leak risk (consumer could bypass our state machine). v0.2 candidate: `renderVideoElement?` for full takeover. |
| Q-P8 | Fullscreen — drop or add a default-controls button? | **Drop from v0.1.** Consumers add via `renderControls` if needed. Keeps default API minimal. |
| Q-P9 | `controls={false}` — also disable keyboard shortcuts? | **No.** Space/M still work even with controls hidden — decorative-video case where the user can still want to interact (e.g., mute the background loop). Documented. |
| Q-P10 | Mute toggle `aria-pressed` semantics + labels? | **`aria-pressed={isMuted}`** with action-verb labels: `labels.mute` = "Mute" (action), `labels.unmute` = "Unmute" (action). Whichever button is currently shown carries its own correct label. |

## Pre-emptive design locks (from description-stage analysis)

- **No framer-motion** — control fade is CSS opacity transition. Heart burst is `engagement-bar-01`'s sibling sub-export, not here.
- **No Embla** — that's `media-carousel-01`'s concern.
- **No client-state library** — local React state via `useReducer` for atomic transitions across `isPlaying` / `isMuted` / `isLoaded` / `duration` / `currentTime`.
- **Browser drives state, we mirror it.** `togglePlay()` calls `videoRef.current.play()` → browser fires `onPlay` event → reducer dispatches `play` action → React state updates. Avoids double-source-of-truth.
- **`reducedMotion` always-shows controls.** Under `prefers-reduced-motion: reduce`, the auto-hide timer is skipped entirely (controls stay visible). Cleaner than fade-vs-no-fade dichotomy.

## Final API

### Public types

```ts
// src/registry/components/media/video-player-01/types.ts

import type { ReactNode } from "react";

export interface VideoTrack {
  /** Track type: "captions" / "subtitles" / "descriptions" / "chapters" / "metadata". */
  kind: TextTrackKind;
  /** WebVTT URL. */
  src: string;
  /** BCP-47 language tag (e.g. "en", "tr-TR"). */
  srcLang: string;
  /** Human-readable label shown in the browser's track menu. */
  label: string;
  /** Mark this track as the default. Only one track per kind should be default. */
  default?: boolean;
}

export interface VideoState {
  /** Currently playing. Mirrors the underlying `<video>` element. */
  isPlaying: boolean;
  /** Currently muted. */
  isMuted: boolean;
  /** Active state from the `isActive` prop. False = component paused the video. */
  isActive: boolean;
  /** True after `loadedmetadata` fires. `duration` is reliable from this point. */
  isLoaded: boolean;
  /** Total duration in seconds (NaN until loaded). */
  duration: number;
  /** Current playback position in seconds. rAF-throttled. */
  currentTime: number;
  /** Imperative: toggle play/pause. */
  togglePlay: () => void;
  /** Imperative: toggle mute/unmute. */
  toggleMute: () => void;
}

export interface VideoPlayer01Labels {
  /** Default: "Play". aria-label on the play button. */
  play?: string;
  /** Default: "Pause". aria-label on the pause button. */
  pause?: string;
  /** Default: "Mute". aria-label on the mute toggle when audio is on. */
  mute?: string;
  /** Default: "Unmute". aria-label on the mute toggle when audio is muted. */
  unmute?: string;
  /** Default: "Video". aria-label on the <video> element itself. */
  videoLabel?: string;
}

export interface VideoPlayer01Props {
  /** Video URL. Required. */
  src: string;
  /** Poster image URL. Optional. Browser shows it before playback + on load failure. */
  poster?: string;
  /** Caption / subtitle tracks. Renders as `<track>` children. */
  tracks?: VideoTrack[];

  // ─── Active state (carousel coordination) ────────────────────────
  /** When false, video pauses + state resets. Default: true. */
  isActive?: boolean;

  // ─── <video> attribute pass-through ──────────────────────────────
  /** Default: true. */
  loop?: boolean;
  /** Default: true (autoplay-friendly; browsers block unmuted autoplay). */
  muted?: boolean;
  /** Default: true (iOS Safari requires this for inline playback). */
  playsInline?: boolean;
  /** Default: "metadata". */
  preload?: "none" | "metadata" | "auto";
  /** Default: false. When true, the browser may auto-play on load (subject to browser autoplay policy). */
  autoPlay?: boolean;

  // ─── Visual ──────────────────────────────────────────────────────
  /** Object-fit for the video element. Default: "cover". */
  objectFit?: "cover" | "contain";

  // ─── Controls ────────────────────────────────────────────────────
  /** Show control overlay (default OR custom). Default: true. Pass false for decorative / autoplay-loop. */
  controls?: boolean;
  /** Custom control overlay. Receives full state + dispatchers. */
  renderControls?: (state: VideoState) => ReactNode;
  /** Auto-hide controls after N ms during playback. Default: 2000. Pass 0 to disable. */
  controlsAutoHideMs?: number;

  // ─── Gestures ────────────────────────────────────────────────────
  /** Fires on a 300ms-window double-tap. Component renders no visual — caller wires e.g. heart burst. */
  onDoubleTap?: () => void;

  // ─── Lifecycle callbacks ─────────────────────────────────────────
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /** Throttled to one call per requestAnimationFrame max. */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Fires once on `loadedmetadata`. */
  onLoadedMetadata?: (duration: number) => void;
  /** Fires on `error`. */
  onError?: (error: MediaError | null) => void;

  // ─── i18n ────────────────────────────────────────────────────────
  /** Localized labels. Defaults are English. */
  labels?: VideoPlayer01Labels;

  // ─── Style overrides ─────────────────────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for the <video> element. */
  videoClassName?: string;
  /** Override classes for the default control overlay. Ignored when `renderControls` is provided. */
  controlsClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_VIDEO_PLAYER_LABELS: Required<VideoPlayer01Labels> = {
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  videoLabel: "Video",
};
```

### Hook signatures

```ts
// hooks/use-video-state.ts (INTERNAL — not exported from index.ts in v0.1)

export interface UseVideoStateOptions {
  initialMuted: boolean;
  isActive: boolean;
}

export interface UseVideoStateResult {
  state: VideoStateValue;        // { isPlaying, isMuted, isLoaded, duration, currentTime }
  videoRef: React.RefCallback<HTMLVideoElement>;
  togglePlay: () => void;
  toggleMute: () => void;
  // Event handlers wired to the <video> element:
  videoEventHandlers: {
    onPlay: () => void;
    onPause: () => void;
    onEnded: () => void;
    onLoadedMetadata: () => void;
    onTimeUpdate: () => void;
    onError: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onVolumeChange: () => void;
  };
}

export function useVideoState(opts: UseVideoStateOptions): UseVideoStateResult;
```

```ts
// hooks/use-double-tap.ts (PUBLIC — exported from index.ts)

export interface UseDoubleTapOptions {
  /** Time window in ms within which a second tap counts as a double-tap. Default: 300. */
  windowMs?: number;
}

/**
 * Returns a click handler that fires `onDoubleTap` only on the second tap
 * within the configured time window. Uses a single `useRef` for the last-tap
 * timestamp; no setState; render-stable across re-renders.
 *
 * Reusable outside `<video>` contexts — image double-tap-to-like, card
 * double-tap-to-favorite, etc.
 */
export function useDoubleTap(
  onDoubleTap: (() => void) | undefined,
  options?: UseDoubleTapOptions,
): React.MouseEventHandler<HTMLElement>;
```

### Exported names

```ts
// index.ts
export { default as VideoPlayer01 } from "./video-player-01";

export type {
  VideoPlayer01Props,
  VideoPlayer01Labels,
  VideoState,
  VideoTrack,
} from "./types";

export { DEFAULT_VIDEO_PLAYER_LABELS } from "./types";

export {
  useDoubleTap,
  type UseDoubleTapOptions,
} from "./hooks/use-double-tap";

export { meta } from "./meta";
```

### No generics

Strict shape. `src` is `string` only (no `<source>` array in v0.1).

## File-by-file plan

11 files. Sealed-folder.

```
src/registry/components/media/video-player-01/
├── video-player-01.tsx                    # 1 — root
├── parts/
│   ├── video-element.tsx                  # 2 — <video> + ref + state-machine wiring
│   └── default-controls.tsx               # 3 — kasder-style overlay (play / mute / pause indicator)
├── hooks/
│   ├── use-video-state.ts                 # 4 — useReducer state machine
│   └── use-double-tap.ts                  # 5 — public, exported standalone
├── types.ts                                # 6
├── dummy-data.ts                           # 7
├── demo.tsx                                # 8
├── usage.tsx                               # 9
├── meta.ts                                 # 10
└── index.ts                                # 11
```

### 1. `video-player-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults: `isActive ?? true`, `loop ?? true`, `muted ?? true`, `playsInline ?? true`, `preload ?? "metadata"`, `autoPlay ?? false`, `objectFit ?? "cover"`, `controls ?? true`, `controlsAutoHideMs ?? 2000`.
- Owns top-level wrapping `<div>` styling (`relative w-full h-full bg-black overflow-hidden` + `className`).
- Composes `<VideoElement>` (renders `<video>` + tracks + drives state) + (when `controls`) the appropriate control overlay (`renderControls(state)` if provided, else `<DefaultControls state={...} ... />`).
- Wires `useDoubleTap(onDoubleTap)` and attaches the resulting handler to the wrapping `<div>` `onClick`.
- Wires `useEffect([isActive])` that calls `videoRef.current?.pause()` when `isActive` flips false. Browser fires `onPause` → reducer state updates.
- Forwards `onPlay` / `onPause` / `onEnded` / `onTimeUpdate` / `onLoadedMetadata` / `onError` callbacks via stable refs (avoid `useEffect` cascade on every callback identity change).

```tsx
"use client";

import { memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_VIDEO_PLAYER_LABELS,
  type VideoPlayer01Labels,
  type VideoPlayer01Props,
  type VideoState,
} from "./types";
import { useVideoState } from "./hooks/use-video-state";
import { useDoubleTap } from "./hooks/use-double-tap";
import { VideoElement } from "./parts/video-element";
import { DefaultControls } from "./parts/default-controls";

function VideoPlayer01Inner({
  src,
  poster,
  tracks = [],
  isActive = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "metadata",
  autoPlay = false,
  objectFit = "cover",
  controls = true,
  renderControls,
  controlsAutoHideMs = 2000,
  onDoubleTap,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
  labels: labelsProp,
  className,
  videoClassName,
  controlsClassName,
}: VideoPlayer01Props) {
  const labels: Required<VideoPlayer01Labels> = useMemo(
    () => ({ ...DEFAULT_VIDEO_PLAYER_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const { state, videoRef, togglePlay, toggleMute, videoEventHandlers } =
    useVideoState({
      initialMuted: muted,
      isActive,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onLoadedMetadata,
      onError,
    });

  // (isActive auto-pause now lives inside useVideoState — hook owns video DOM.)
  const handleDoubleTap = useDoubleTap(onDoubleTap);

  const stateForRender: VideoState = {
    ...state,
    isActive,
    togglePlay,
    toggleMute,
  };

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-black",
        className,
      )}
      onClick={handleDoubleTap}
    >
      <VideoElement
        videoRef={videoRef}
        eventHandlers={videoEventHandlers}
        src={src}
        poster={poster}
        tracks={tracks}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
        autoPlay={autoPlay}
        objectFit={objectFit}
        ariaLabel={labels.videoLabel}
        videoClassName={videoClassName}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
      />

      {controls &&
        (renderControls ? (
          renderControls(stateForRender)
        ) : (
          <DefaultControls
            state={stateForRender}
            labels={labels}
            controlsAutoHideMs={controlsAutoHideMs}
            controlsClassName={controlsClassName}
          />
        ))}
    </div>
  );
}

const VideoPlayer01 = memo(VideoPlayer01Inner);
VideoPlayer01.displayName = "VideoPlayer01";

export { VideoPlayer01 };
export default VideoPlayer01;
```

### 2. `parts/video-element.tsx` — `<video>` + ref + tracks + click-to-toggle

Stateless presentational. Renders the `<video>` element with ref + event handlers + `<track>` children + keyboard wiring (focus-required Space/M).

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { VideoTrack } from "../types";

interface VideoElementProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  eventHandlers: {
    onPlay; onPause; onEnded; onLoadStart; onLoadedMetadata;
    onTimeUpdate; onError; onVolumeChange;
  };
  src: string;
  poster?: string;
  tracks: VideoTrack[];
  loop: boolean;
  muted: boolean;
  playsInline: boolean;
  preload: "none" | "metadata" | "auto";
  autoPlay: boolean;
  objectFit: "cover" | "contain";
  ariaLabel: string;
  videoClassName?: string;
  /** Called when the user clicks the video element (NOT a control button). */
  onTogglePlay: () => void;
  /** Called for the M keyboard shortcut. */
  onToggleMute: () => void;
}

export function VideoElement({
  videoRef,
  eventHandlers,
  src,
  poster,
  tracks,
  loop,
  muted,
  playsInline,
  preload,
  autoPlay,
  objectFit,
  ariaLabel,
  videoClassName,
  onTogglePlay,
  onToggleMute,
}: VideoElementProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLVideoElement>) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      onTogglePlay();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      onToggleMute();
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      autoPlay={autoPlay}
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onTogglePlay}
      onKeyDown={handleKeyDown}
      {...eventHandlers}
      className={cn(
        "h-full w-full cursor-pointer",
        objectFit === "cover" ? "object-cover" : "object-contain",
        videoClassName,
      )}
    >
      {tracks.map((t, i) => (
        <track
          key={`${t.kind}-${t.srcLang}-${i}`}
          kind={t.kind}
          src={t.src}
          srcLang={t.srcLang}
          label={t.label}
          default={t.default}
        />
      ))}
    </video>
  );
}
```

(Implementation note: the `onToggleMute` keyboard handler will be added via a parent-passed prop in actual implementation — keeping the spec lean here.)

### 3. `parts/default-controls.tsx` — kasder-style overlay

The control overlay matching kasder's pattern. Owns its own `showControls` state + auto-hide timer + reduced-motion respect.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoPlayer01Labels, VideoState } from "../types";

interface DefaultControlsProps {
  state: VideoState;
  labels: Required<VideoPlayer01Labels>;
  controlsAutoHideMs: number;
  controlsClassName?: string;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function DefaultControls({
  state,
  labels,
  controlsAutoHideMs,
  controlsClassName,
}: DefaultControlsProps) {
  const { isPlaying, isMuted, togglePlay, toggleMute } = state;
  const reducedMotion = usePrefersReducedMotion();
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule auto-hide when playing + auto-hide enabled + reduced-motion off
  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (!isPlaying || controlsAutoHideMs <= 0 || reducedMotion) {
      setShowControls(true);
      return;
    }
    setShowControls(true);
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, controlsAutoHideMs);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, controlsAutoHideMs, reducedMotion]);

  const wakeControls = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (isPlaying && controlsAutoHideMs > 0 && !reducedMotion) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, controlsAutoHideMs);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        controlsClassName,
      )}
      onMouseEnter={wakeControls}
      onMouseMove={wakeControls}
    >
      {/* Big center play button — always visible when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="secondary"
            size="icon"
            className="pointer-events-auto h-14 w-14 rounded-full bg-background/80 hover:bg-background/90"
            onClick={togglePlay}
            aria-label={labels.play}
          >
            <Play className="h-6 w-6 fill-current" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Bottom-right mute toggle — auto-hides during playback */}
      <div
        className={cn(
          "absolute bottom-3 right-3 flex gap-2 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="pointer-events-auto h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? labels.unmute : labels.mute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Bottom-left small pause indicator — only when playing + showing controls */}
      {isPlaying && showControls && (
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto absolute bottom-3 left-3 h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={togglePlay}
          aria-label={labels.pause}
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
```

### 4. `hooks/use-video-state.ts` — `useReducer` state machine

Internal hook (not in `index.ts` exports). Owns the reducer + browser-event dispatchers + imperative `togglePlay` / `toggleMute`.

```ts
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { VideoState } from "../types";

type VideoStateValue = Pick<
  VideoState,
  "isPlaying" | "isMuted" | "isLoaded" | "duration" | "currentTime"
>;

type VideoAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "set-muted"; muted: boolean }
  | { type: "loadstart" }   // src changed — reset transient state, preserve mute
  | { type: "loaded"; duration: number }
  | { type: "set-current-time"; currentTime: number }
  | { type: "ended" }
  | { type: "reset" };

const initialState: VideoStateValue = {
  isPlaying: false,
  isMuted: true,
  isLoaded: false,
  duration: NaN,
  currentTime: 0,
};

function videoReducer(state: VideoStateValue, action: VideoAction): VideoStateValue {
  switch (action.type) {
    case "play": return state.isPlaying ? state : { ...state, isPlaying: true };
    case "pause": return state.isPlaying ? { ...state, isPlaying: false } : state;
    case "set-muted":
      return state.isMuted === action.muted ? state : { ...state, isMuted: action.muted };
    case "loadstart":
      // src changed — clear transient state so consumers don't see stale (duration, currentTime).
      // Preserve isMuted (user pref).
      return { ...initialState, isMuted: state.isMuted };
    case "loaded":
      return { ...state, isLoaded: true, duration: action.duration };
    case "set-current-time":
      return state.currentTime === action.currentTime
        ? state
        : { ...state, currentTime: action.currentTime };
    case "ended":
      return { ...state, isPlaying: false, currentTime: 0 };
    case "reset":
      return { ...initialState, isMuted: state.isMuted }; // preserve mute pref
    default: return state;
  }
}

export interface UseVideoStateOptions {
  initialMuted: boolean;
  isActive: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onError?: (error: MediaError | null) => void;
}

export function useVideoState({
  initialMuted,
  isActive,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
}: UseVideoStateOptions) {
  const [state, dispatch] = useReducer(videoReducer, {
    ...initialState,
    isMuted: initialMuted,
  });

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
  }, []);

  // Stable refs for callbacks (avoid effect cascade on every callback identity change)
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onLoadedMetadataRef = useRef(onLoadedMetadata);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onEndedRef.current = onEnded;
    onTimeUpdateRef.current = onTimeUpdate;
    onLoadedMetadataRef.current = onLoadedMetadata;
    onErrorRef.current = onError;
  });

  // rAF-throttled time update
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pause when isActive flips false. Hook owns video DOM, so the effect
  // is here (not in the root). Reads only `isActive` — stable single dep.
  useEffect(() => {
    if (!isActive) videoElRef.current?.pause();
  }, [isActive]);

  // Memoized handlers — empty deps because all state is in stable refs.
  // Prevents React from re-attaching listeners on every render.
  const handleVideoPlay = useCallback(() => {
    dispatch({ type: "play" });
    onPlayRef.current?.();
  }, []);

  const handleVideoPause = useCallback(() => {
    dispatch({ type: "pause" });
    onPauseRef.current?.();
  }, []);

  const handleVideoEnded = useCallback(() => {
    dispatch({ type: "ended" });
    onEndedRef.current?.();
  }, []);

  const handleVideoLoadStart = useCallback(() => {
    dispatch({ type: "loadstart" });
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    dispatch({ type: "loaded", duration: el.duration });
    onLoadedMetadataRef.current?.(el.duration);
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = videoElRef.current;
      if (!el) return;
      dispatch({ type: "set-current-time", currentTime: el.currentTime });
      onTimeUpdateRef.current?.(el.currentTime, el.duration);
    });
  }, []);

  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      onErrorRef.current?.(el.error);
    },
    [],
  );

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
      onLoadStart: handleVideoLoadStart,
      onLoadedMetadata: handleVideoLoadedMetadata,
      onTimeUpdate: handleVideoTimeUpdate,
      onError: handleVideoError,
      onVolumeChange: handleVideoVolumeChange,
    }),
    [
      handleVideoPlay,
      handleVideoPause,
      handleVideoEnded,
      handleVideoLoadStart,
      handleVideoLoadedMetadata,
      handleVideoTimeUpdate,
      handleVideoError,
      handleVideoVolumeChange,
    ],
  );

  const togglePlay = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        // Browser autoplay policy may reject; user gesture is required.
        // No-op; consumer can re-trigger via user click.
      });
    } else {
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    el.muted = !el.muted;
    // onVolumeChange event will fire and dispatch set-muted.
  }, []);

  return { state, videoRef, togglePlay, toggleMute, videoEventHandlers };
}
```

### 5. `hooks/use-double-tap.ts` — public, exported

```ts
import { useCallback, useRef } from "react";

export interface UseDoubleTapOptions {
  /** Time window in ms within which a second tap counts as a double-tap. Default: 300. */
  windowMs?: number;
}

/**
 * Returns a click handler that fires `onDoubleTap` only when invoked twice
 * within `windowMs` of each other. Single-tap is silent. After firing, the
 * timestamp resets so a triple-tap doesn't fire again.
 *
 * Reusable outside `<video>` contexts — image double-tap-to-like, card
 * double-tap-to-favorite, etc.
 */
export function useDoubleTap(
  onDoubleTap: (() => void) | undefined,
  options?: UseDoubleTapOptions,
): React.MouseEventHandler<HTMLElement> {
  const lastTapRef = useRef(0);
  const windowMs = options?.windowMs ?? 300;

  return useCallback(() => {
    if (!onDoubleTap) return;
    const now = Date.now();
    if (now - lastTapRef.current < windowMs) {
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, windowMs]);
}
```

### 6. `types.ts`

All public types as shown in **Final API** above. Including `DEFAULT_VIDEO_PLAYER_LABELS` constant export.

### 7. `dummy-data.ts`

Sample video URLs (royalty-free / Pexels / Coverr) + posters + sample track URLs.

```ts
import type { VideoTrack } from "./types";

/** Royalty-free landscape clip (~6s). */
export const SAMPLE_VIDEO_URL =
  "https://videos.pexels.com/video-files/856005/856005-hd_1280_720_30fps.mp4";

export const SAMPLE_POSTER_URL =
  "https://images.pexels.com/videos/856005/free-video-856005.jpg?auto=compress&cs=tinysrgb&w=1280";

/** Vertical clip for story-like demos. */
export const SAMPLE_VERTICAL_VIDEO_URL =
  "https://videos.pexels.com/video-files/2098989/2098989-uhd_2160_4096_25fps.mp4";

/** Shorter loopable clip for autoplay-loop scenarios. */
export const SAMPLE_LOOP_VIDEO_URL =
  "https://videos.pexels.com/video-files/2491284/2491284-uhd_2560_1440_25fps.mp4";

export const SAMPLE_TRACKS_EN: VideoTrack[] = [
  {
    kind: "captions",
    src: "https://example.com/captions/en.vtt", // dummy URL — won't load, but renders <track>
    srcLang: "en",
    label: "English",
    default: true,
  },
];
```

### 8. `demo.tsx`

5-tab demo with shadcn `Tabs`. Each tab demonstrates one surface.

1. **Default** — `<VideoPlayer01 src={SAMPLE_VIDEO_URL} poster={SAMPLE_POSTER_URL} />` — proves muted-autoplay-friendly defaults + control overlay + auto-hide
2. **Custom controls** — uses `renderControls` to show a minimal overlay with a horizontal progress bar + just a play/pause button (proves slot takeover + state access)
3. **Captions** — single track entry, demonstrates `<track>` rendering (browser shows the CC button in native fullscreen menu)
4. **Decorative** — `controls={false}` + `autoPlay` + `loop` for an Instagram-feed-style background loop (proves no-controls path; keyboard still works if focused)
5. **isActive auto-pause** — 3 videos in a row with a "active index" toggle button; only one plays at a time (proves the carousel use case before media-carousel-01 ships)

Each tab in a `aspect-video` (16:9) wrapper for sizing.

### 9. `usage.tsx`

Code-block walkthrough:

- Minimal usage
- `isActive` for carousel coordination
- Decorative video (autoplay loop)
- Custom controls via `renderControls`
- Captions via `tracks` prop
- Localized labels
- Standalone `useDoubleTap` for image double-tap-to-like
- Anti-patterns (no `<video>` ref leak; no fullscreen in v0.1; no volume slider)
- Accessibility notes

### 10. `meta.ts`

```ts
import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "video-player-01",
  name: "Video Player 01",
  category: "media",

  description:
    "<video> wrapper with muted-autoplay-friendly defaults, slot-based controls, isActive auto-pause for carousel coordination, double-tap callback for like-style gestures, and rAF-throttled time-update lifecycle.",
  context:
    "Use anywhere user-generated or editorial video plays — Instagram-post media, story viewers, news article inline videos, event recordings, product previews. The isActive prop pauses the video cleanly when its slide goes off-screen, so consumers (carousels, story viewers) coordinate playback via a single boolean. Custom control UI via the renderControls slot; default overlay matches the kasder play/pause/mute pattern with auto-hide. Double-tap callback fires through useDoubleTap (also exported standalone for non-video double-tap-to-like). Migration origin: kasder kas-social-front-v0 PostVideoPlayer.tsx; second ship in the 8-component social-posts-system arc.",
  features: [
    "Muted autoplay-friendly defaults (muted=true, loop=true, playsInline=true)",
    "isActive prop pauses cleanly when false (carousel coordination)",
    "Slot-based controls via renderControls(state) — full takeover",
    "Default overlay: big play button + bottom-right mute + bottom-left pause indicator + 2s auto-hide during playback",
    "Auto-hide skipped under prefers-reduced-motion",
    "Caption tracks via tracks: VideoTrack[] (rendered as <track> children)",
    "objectFit: cover | contain (default cover)",
    "Keyboard: Space=play/pause, M=mute (focus-required)",
    "rAF-throttled onTimeUpdate (perf-safe — caps at display refresh rate)",
    "Lifecycle callbacks: onPlay / onPause / onEnded / onTimeUpdate / onLoadedMetadata / onError",
    "Public useDoubleTap hook export for non-video consumers",
    "i18n via 5-key labels object",
    "useReducer state machine — atomic transitions, browser drives state, we mirror it",
    "a11y: aria-label on <video>, aria-pressed on mute, aria-label on each control",
  ],
  tags: ["video-player-01", "video", "media", "player", "carousel"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "tabs"],
    npm: { "lucide-react": "^0.x" },
    internal: [],
  },

  related: ["expandable-text-01", "media-carousel-01", "story-viewer-01"],
};
```

### 11. `index.ts`

Public exports as shown in **Final API** above.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()`
- `@/components/ui/button` — `Button` for default control overlay

### NPM

- `react` (already installed)
- `lucide-react` — Play / Pause / Volume2 / VolumeX (already installed)
- shadcn `tabs` for the demo (already installed)

### Forbidden

- `next/*`
- `framer-motion` (CSS opacity transitions only here; framer is `engagement-bar-01` / `story-viewer-01` territory)
- `embla-carousel-react` (carousel concerns belong to `media-carousel-01`)
- Any HLS / DASH / streaming library
- Any video processing / transcoding library

## Composition pattern

**Headless wrapping over a state-machine hook.** The reducer manages atomic transitions; the `<video>` element drives state via DOM events. Default controls + custom controls slot consume the same `VideoState` shape.

## Edge cases

| Case | Behavior |
|---|---|
| `src` changes at runtime | React re-renders the same `<video>` with new `src`; browser handles new load; `loadedmetadata` fires → reducer dispatches `loaded` with new duration. State NOT manually reset (preserves `isMuted` user pref) |
| `autoPlay=true` rejected by browser | `play()` promise rejects silently in `togglePlay`'s `.catch()`. `isPlaying` stays `false`. User must click to start (browser autoplay policy) |
| `isActive` flips false during playback | `useEffect` calls `togglePlay()` (which calls `pause()`); browser fires `onPause` event → reducer dispatches `pause` |
| `isActive` flips true during paused state | No auto-resume. Consumer drives `play()` via user gesture. (Auto-resume would feel surprising in a carousel.) |
| User clicks the video element | `onClick` → `togglePlay()` (kasder pattern). Double-tap detection via `useDoubleTap` runs in parallel on the wrapping `<div>` |
| Double-tap fires | `onDoubleTap` callback fires; component renders no visual. Single `togglePlay` from the first click already dispatched (acceptable side effect — toggle then immediately toggle back on the second tap is a wash; real impl could `.preventDefault` but kasder doesn't) |
| `controls={false}` | No overlay rendered. Click-to-toggle still works on the video. Keyboard still works if focused. Per Q-P9 |
| `renderControls` returns `null` / `undefined` | Renders nothing — equivalent to `controls={false}` but consumer-driven |
| `tracks` empty / undefined | No `<track>` children rendered |
| `tracks` includes invalid `kind` | TS enforces `TextTrackKind` union; runtime accepts any string but browser ignores unknown |
| Container resizes | Video auto-fills (`h-full w-full`); `objectFit` controls clipping vs letterboxing |
| `muted` prop changes at runtime | Synced via `<video muted>` attribute; browser re-applies; `onVolumeChange` fires → reducer updates `isMuted` |
| Component unmounts during playback | `<video>` unmounts; browser pauses; rAF cleanup fires; no memory leak |
| Component unmounts with pending rAF | `useEffect` cleanup cancels rAF; no callback fires after unmount |
| Component unmounts with pending hide-controls timeout | `useEffect` cleanup clears timeout; no setState after unmount |
| `prefers-reduced-motion: reduce` user | Auto-hide skipped entirely; controls always visible during playback |
| Reduced-motion changes mid-session | `matchMedia` listener updates `reducedMotion`; effect re-runs; behavior switches |
| RTL | Bottom-right mute toggle stays bottom-right (no directional concern); pause indicator stays bottom-left. Document if RTL flip is desired (consumer can override with `controlsClassName`) |
| Touch device | Click events fire; `useDoubleTap` works; auto-hide on first touch shows controls then schedules hide |
| Multiple videos on page | Each owns its own state; no cross-talk; consumer manages `isActive` for carousel coordination |
| `videoLabel` not localized but page is in another language | `aria-label="Video"` is OK fallback; consumers should override |

## Accessibility

- `<video>` element gets `aria-label={labels.videoLabel}` for screen-reader announcement.
- `<video tabIndex={0}>` so it's keyboard-focusable; Space + M handlers fire only when focused (Q-P4 lock).
- Each control button gets an `aria-label`. Mute toggle additionally gets `aria-pressed={isMuted}` (Q-P10).
- All decorative icons inside controls get `aria-hidden="true"`.
- Caption tracks via `<track>` — browser exposes them in the native subtitles UI (typically a CC button in the controls).
- Fade transitions on controls use CSS `transition-opacity duration-300`. Under `prefers-reduced-motion: reduce`, we skip the auto-hide schedule entirely — no transition, controls stay visible.
- Custom `renderControls` is consumer's responsibility — preserve `aria-pressed` on toggle buttons + `aria-label` on icon-only buttons. Documented in usage.tsx.
- Click-to-play on the video element is supplemented by the always-visible big play button (when paused) — no need to discover the click-anywhere affordance.

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK)
- [ ] `pnpm build` clean — `/components/video-player-01` prerendered (36th route)
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry under the new `media` category section (first occupant)
- [ ] Visual sanity:
  - Default tab: video loads, big play button visible, click → plays, mute toggle in bottom-right, controls auto-hide after 2s
  - Custom controls tab: progress bar + play/pause render via `renderControls` slot
  - Captions tab: `<track>` rendered (verify in DevTools)
  - Decorative tab: no overlay; video autoplays + loops
  - isActive tab: switching active index pauses other videos cleanly
- [ ] Browser sanity (deferred but flagged in STATUS):
  - Space/M keyboard with focus
  - Double-tap fires `onDoubleTap`
  - Reduced-motion: controls stay visible
  - rAF throttling: `onTimeUpdate` fires ~60×/sec max (verify via console.log throttle)

## Risks & alternatives

### Risk 1: Browser autoplay policy rejects `play()`

When `autoPlay={true}` + `muted={false}`, browsers (Chrome, Safari) reject `play()`. `togglePlay`'s `.catch()` swallows the rejection silently; `isPlaying` stays `false`; user must click to start.

**Mitigation:** documented in usage. The default `muted=true` keeps autoplay working in 99% of cases. Consumers wanting unmuted autoplay are explicitly fighting the platform.

### Risk 2: `<video>` ref attached via `useCallback` may cause re-mount on hot reload

`useCallback([])` returns a stable reference, so React doesn't detach/reattach. ✓ Safe.

### Risk 3: Multiple `<video>` elements on one page sharing focus

Each is independently focusable. Tab order goes through them all. Space/M only fires on the focused one. No cross-talk. ✓

### Risk 4: `onTimeUpdate` rAF cleanup race

If component unmounts between `onTimeUpdate` firing and the rAF callback running, the callback would access a stale `videoElRef.current` (`null`). The callback already guards `if (!el) return;` ✓ Safe.

### Risk 5: `togglePlay` calls `play()` while another `play()` is pending

The `.play()` promise can be interrupted by an immediate `pause()`. Browser behavior is to abort. Acceptable — the user-driven toggle is the source of truth. No bug.

### Risk 6: `<video>` `<track>` `kind` typed as `TextTrackKind`

`TextTrackKind` includes `"chapters"` and `"metadata"` which most consumers don't use. Acceptable — TS enforces the union, no need to narrow further.

### Risk 7: `useDoubleTap` fires an extra `togglePlay` between taps

The video's `onClick={togglePlay}` fires twice in quick succession during a double-tap. The video toggles play, then toggles play back. Visually a wash — no flicker because the second toggle is within the same animation frame. Documented as intentional behavior.

**Alternative:** debounce the click handler when a double-tap is in progress. Adds complexity; defer to v0.2 if real users complain.

### Alternatives considered

1. **`useState` instead of `useReducer`** — rejected. 5+ state fields with atomic transitions favor `useReducer`. Cleaner action semantics.
2. **Shared global mute state across all videos** — rejected. Each video owns its mute. Consumers wanting "mute all" wire it themselves via `muted` prop + a context.
3. **Native `<video controls>`** — rejected. The whole point is custom design + carousel coordination + slot-based override.
4. **`react-player` peer dep** — rejected. Heavy (~50KB gzipped); designed for YouTube/Vimeo embed; overkill for raw `<video>`. Build our own.
5. **`pointer` events instead of `click`** — rejected for v0.1. `click` works on both touch + mouse via React's synthetic event normalization. Pointer events would force separate `pointerdown` / `pointerup` handling for negligible UX gain.
6. **Volume slider in v0.1** — rejected. Mute-only matches kasder + Instagram. Volume slider is a separate UX with touch/keyboard concerns.

## Implementation phases

### Phase A — hooks + types + scaffolding (Day 1, ~1.5 hours)

- `pnpm new:component media/video-player-01` — scaffolds the sealed folder
- Author `types.ts` with all public types
- Author `hooks/use-double-tap.ts` (smallest, can be unit-tested later if/when test runner lands)
- Author `hooks/use-video-state.ts` (the state machine reducer + browser-event dispatchers + imperative methods)
- `pnpm tsc --noEmit` should pass on the bare scaffolding

### Phase B — video element + default controls (Day 1, ~1.5 hours)

- Author `parts/video-element.tsx` (the `<video>` + tracks + keyboard wiring)
- Author `parts/default-controls.tsx` (the kasder-style overlay + `usePrefersReducedMotion` + auto-hide timer)
- Author `video-player-01.tsx` root (composes the above)
- Smoke-test directly inside `demo.tsx` while authoring

### Phase C — demo + docs + ship (Day 1, ~1.5 hours)

- Author `dummy-data.ts` (sample Pexels URLs + tracks)
- Author `demo.tsx` (5 tabs)
- Author `usage.tsx`
- Author `meta.ts`
- Add 3 lines to `src/registry/manifest.ts`
- Run `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` — all clean
- Add to `registry.json` (base + fixtures items)
- Run `pnpm registry:build` — verify `public/r/video-player-01.json` + `public/r/video-player-01-fixtures.json`
- Update `.claude/STATUS.md`
- Author `video-player-01-procomp-guide.md`

### Estimated total: ~4.5 hours focused work

Larger than `expandable-text-01` (~3 hours) due to the state machine + slot architecture. Establishes the `media` category, the `useDoubleTap` public hook, and the `renderXxx` slot pattern for the rest of the social-posts arc.

## Open follow-ups (post v0.1)

- v0.2: fullscreen toggle (`requestFullscreen()` + button in default controls)
- v0.2: volume slider (touch + keyboard considerations)
- v0.2: HLS/DASH support via `useHls?: boolean` flag + `hls.js` peer dep, OR `renderVideoElement?` slot
- v0.2: buffering spinner overlay
- v0.2: error UI via `renderError?: (error) => ReactNode` slot
- v0.2: playback rate selector
- v0.2: picture-in-picture toggle
- v0.2: public `useVideoState` hook export (if consumers genuinely need to drive their own `<video>` with our state)
- v0.3: subtitle styling override (`captionsStyle?: CaptionStyleProps`)
- v0.3: programmatic seeking via imperative handle (currently only togglePlay/toggleMute exposed via slot state)
