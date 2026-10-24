import type { ReactNode, Ref } from "react";

export interface VideoTrack {
  /** Track type. */
  kind: TextTrackKind;
  /** WebVTT URL. A cross-origin URL also needs `crossOrigin` on the player (and CORS on the server). */
  src: string;
  /** BCP-47 language tag (e.g. "en", "tr-TR"). */
  srcLang: string;
  /** Human-readable label, shown in the captions menu when there are several tracks. */
  label: string;
  /** Mark this track as default (only one per kind should be default). */
  default?: boolean;
}

/** One buffered span of the media, in seconds. */
export interface BufferedRange {
  start: number;
  end: number;
}

/** Media-time progress, from the element's own events (never a wall clock). */
export interface VideoProgress {
  currentTime: number;
  duration: number;
  buffered: BufferedRange[];
}

export type VideoDirection = "ltr" | "rtl";

export interface VideoState {
  /** Currently playing — mirrors the underlying `<video>` element. */
  isPlaying: boolean;
  /** Currently muted (the prop when `muted` is controlled). */
  isMuted: boolean;
  /** Active state from the `isActive` prop. */
  isActive: boolean;
  /** True after `loadedmetadata` fires. `duration` is reliable from this point. */
  isLoaded: boolean;
  /** Total duration in seconds (NaN until loaded, unless `durationHint` is set). */
  duration: number;
  /** Current playback position in seconds (rAF-throttled). */
  currentTime: number;
  /** True once playback has started for the current source (false = idle). */
  hasStarted: boolean;
  /** Waiting for data (`waiting` / `stalled`, or a URL refresh in flight). */
  isBuffering: boolean;
  /** The media failed and no refresh is coming — the error overlay shows. */
  hasError: boolean;
  /** Buffered spans, in seconds. */
  buffered: BufferedRange[];
  /** Resolved text direction. */
  dir: VideoDirection;
  /** Caption tracks (the `tracks` prop). */
  tracks: VideoTrack[];
  /** Index into `tracks` of the showing track, or `null` when captions are off. */
  activeTrack: number | null;
  /** True when a fullscreen API is available (resolved after mount). */
  canFullscreen: boolean;
  /** True while the player is fullscreen. */
  isFullscreen: boolean;
  /** Imperative: toggle play/pause. */
  togglePlay: () => void;
  /** Imperative: toggle mute/unmute (calls `onMutedChange` instead when `muted` is controlled). */
  toggleMute: () => void;
  /** Imperative: jump to `seconds` (clamped to the duration). */
  seek: (seconds: number) => void;
  /** Reload the current source after an error, resuming where it stopped. */
  retry: () => void;
  /** Show the track at `index`, or turn captions off with `null`. */
  setActiveTrack: (index: number | null) => void;
  /** Enter or leave fullscreen. */
  toggleFullscreen: () => void;
}

/** Imperative handle — pass `ref` to `<VideoPlayer>`. The `<video>` element itself is not exposed. */
export interface VideoPlayerHandle {
  /** Start playback. Resolves when playing; a browser refusal (autoplay policy) is swallowed. */
  play: () => Promise<void>;
  pause: () => void;
  /** Jump to `seconds` (clamped to the duration). */
  seek: (seconds: number) => void;
  toggleMute: () => void;
  /** Enter / leave fullscreen. Does nothing where no fullscreen API exists (`state.canFullscreen` is false). */
  toggleFullscreen: () => void;
}

/** Every label resolved — what the parts read. */
export interface ResolvedVideoPlayerLabels {
  /** aria-label on the play button. */
  play: string;
  /** aria-label on the pause button. */
  pause: string;
  /** aria-label on the mute toggle when audio is on. */
  mute: string;
  /** aria-label on the mute toggle when audio is muted. */
  unmute: string;
  /** aria-label on the `<video>` element itself. */
  videoLabel: string;
  /** aria-label on the seek bar. */
  seek: string;
  /** `aria-valuetext` on the seek bar. Receives seconds and the same values formatted. */
  position: (current: number, total: number, formatted: { current: string; total: string }) => string;
  /** Visible elapsed / total text. */
  timeDisplay: (current: string, total: string) => string;
  /** Accessible name of the idle duration badge. */
  durationBadge: (total: number, formatted: string) => string;
  /** aria-label on the fullscreen button. */
  fullscreen: string;
  /** aria-label on the fullscreen button while fullscreen. */
  exitFullscreen: string;
  /** aria-label on the captions toggle (one track). */
  captions: string;
  /** aria-label on the captions menu button (several tracks). */
  captionsMenu: string;
  /** The "off" item in the captions menu. */
  captionsOff: string;
  /** Accessible name of the buffering spinner. */
  buffering: string;
  /** Error overlay text. */
  error: string;
  /** Error overlay button. */
  retry: string;
}

/** Labels input: any subset; an `undefined` value never erases a default. */
export type VideoPlayerLabels = Partial<ResolvedVideoPlayerLabels>;

export interface VideoPlayerProps {
  /** Video URL. Required. A new `src` resets the player (and the `onMediaError` budget). */
  src: string;
  /** Poster image URL. Browser shows it before playback + on load failure. */
  poster?: string;
  /** Caption / subtitle tracks. Renders as `<track>` children and, when not empty, a captions control. */
  tracks?: VideoTrack[];
  /** Passed to `<video crossOrigin>` — needed for cross-origin caption files. Unset by default (a video served without CORS headers would fail with it). */
  crossOrigin?: "anonymous" | "use-credentials";

  // ─── Active state (carousel coordination) ────────────────────────
  /** When false, the video pauses and nothing starts it. Default: true. */
  isActive?: boolean;

  // ─── <video> attribute pass-through ──────────────────────────────
  /** Default: true — or false when `onEnded` is passed (otherwise `ended` could never fire). */
  loop?: boolean;
  /**
   * Default: true (autoplay-friendly; browsers block unmuted autoplay).
   * Controlled when `onMutedChange` is also passed: the prop wins on every render and the mute
   * button calls `onMutedChange` instead of changing the element. Without it, the user's toggle
   * applies until the prop next changes.
   */
  muted?: boolean;
  /** Receives the requested mute state. Makes `muted` controlled. */
  onMutedChange?: (muted: boolean) => void;
  /** Default: true (iOS Safari requires this for inline playback). */
  playsInline?: boolean;
  /** Default: "metadata". For long feeds pass "none" (+ `durationHint` for the idle badge). */
  preload?: "none" | "metadata" | "auto";
  /** Default: false. Subject to browser autoplay policy. */
  autoPlay?: boolean;
  /** Duration in seconds known ahead of loading (from your API) — shown by the idle badge until metadata loads. */
  durationHint?: number;

  // ─── Autoplay in view ────────────────────────────────────────────
  /** Play (muted) while at least `autoPlayThreshold` of the player is visible; pause when it leaves. Off under reduced motion. Default: false. */
  autoPlayInView?: boolean;
  /** Visibility ratio for `autoPlayInView`. Default: 0.5. */
  autoPlayThreshold?: number;
  /** At most one player per group plays: a player that starts pauses the others in its group. */
  autoplayGroup?: string;

  // ─── Visual ──────────────────────────────────────────────────────
  /** Object-fit for the video element. Default: "cover". */
  objectFit?: "cover" | "contain";
  /** Text direction. Default: the element's direction after mount, else "ltr". */
  dir?: VideoDirection;

  // ─── Controls ────────────────────────────────────────────────────
  /** Show control overlay (default OR custom). Default: true. With false: no overlay, no seek keys on the video. */
  controls?: boolean;
  /**
   * Custom control overlay. Receives full state + dispatchers. Rendered inside the player, so the
   * flat parts (`VideoPlayerSeekBar`, `VideoPlayerMuteButton`, …) work in it.
   */
  renderControls?: (state: VideoState) => ReactNode;
  /** Auto-hide controls after N ms during playback. Default: 2000. Pass 0 to disable. */
  controlsAutoHideMs?: number;
  /** Default controls: the seek bar. Default: true. */
  showSeekBar?: boolean;
  /** Default controls: elapsed / total time. Default: true. */
  showTime?: boolean;
  /** Default controls: a fullscreen button (hidden when no fullscreen API exists). Default: false. */
  showFullscreen?: boolean;
  /** Seconds per arrow-key step on the seek bar (and on the focused video). Default: 5. */
  seekStep?: number;

  // ─── Gestures ────────────────────────────────────────────────────
  /** Fires on a 300ms-window double-tap. A single tap then toggles playback after the window. */
  onDoubleTap?: () => void;

  // ─── Lifecycle callbacks ─────────────────────────────────────────
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /** Throttled to one call per requestAnimationFrame max. */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Media time + buffered spans; rAF-throttled, also on the `progress` event. */
  onProgress?: (progress: VideoProgress) => void;
  /** Fires on `loadedmetadata` — once per source load (again after a URL refresh or Retry). */
  onLoadedMetadata?: (duration: number) => void;
  /** Fires on every video element error. */
  onError?: (error: MediaError | null) => void;
  /**
   * Refresh an expired URL. Called once per `src`: a returned / resolved URL replaces the source
   * and playback resumes at the same time (and play state). A void answer, a rejection or a second
   * error shows the error overlay. While it is pending the player shows its buffering state.
   */
  onMediaError?: (src: string) => Promise<string | void> | string | void;

  // ─── i18n ────────────────────────────────────────────────────────
  /** Localized labels. Defaults are English. */
  labels?: VideoPlayerLabels;
  /** BCP-47 locale for time text. Default "en"; an invalid tag falls back to "en". */
  locale?: string;
  /** Override the time format (`m:ss` / `h:mm:ss` with `locale` digits by default). */
  formatDuration?: (seconds: number, locale: string) => string;

  // ─── Style overrides ─────────────────────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for the <video> element. */
  videoClassName?: string;
  /** Override classes for the default control overlay. Ignored when `renderControls` is provided. */
  controlsClassName?: string;

  /** Imperative handle. */
  ref?: Ref<VideoPlayerHandle>;
}

/** Default English labels — exported for consumer composition. */
export const defaultVideoPlayerLabels: ResolvedVideoPlayerLabels = {
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  videoLabel: "Video",
  seek: "Seek",
  position: (_current, _total, f) => `${f.current} of ${f.total}`,
  timeDisplay: (current, total) => `${current} / ${total}`,
  durationBadge: (_total, formatted) => `Duration ${formatted}`,
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  captions: "Captions",
  captionsMenu: "Subtitles and captions",
  captionsOff: "Off",
  buffering: "Loading",
  error: "This video can't be played.",
  retry: "Retry",
};

/** @deprecated Use `defaultVideoPlayerLabels`. Kept as an alias for one minor. */
export const DEFAULT_VIDEO_PLAYER_LABELS: Required<VideoPlayerLabels> = defaultVideoPlayerLabels;
