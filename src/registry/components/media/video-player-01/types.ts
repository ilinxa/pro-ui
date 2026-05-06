import type { ReactNode } from "react";

export interface VideoTrack {
  /** Track type. */
  kind: TextTrackKind;
  /** WebVTT URL. */
  src: string;
  /** BCP-47 language tag (e.g. "en", "tr-TR"). */
  srcLang: string;
  /** Human-readable label shown in the browser's track menu. */
  label: string;
  /** Mark this track as default (only one per kind should be default). */
  default?: boolean;
}

export interface VideoState {
  /** Currently playing — mirrors the underlying `<video>` element. */
  isPlaying: boolean;
  /** Currently muted. */
  isMuted: boolean;
  /** Active state from the `isActive` prop. */
  isActive: boolean;
  /** True after `loadedmetadata` fires. `duration` is reliable from this point. */
  isLoaded: boolean;
  /** Total duration in seconds (NaN until loaded). */
  duration: number;
  /** Current playback position in seconds (rAF-throttled). */
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
  /** Poster image URL. Browser shows it before playback + on load failure. */
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
  /** Default: false. Subject to browser autoplay policy. */
  autoPlay?: boolean;

  // ─── Visual ──────────────────────────────────────────────────────
  /** Object-fit for the video element. Default: "cover". */
  objectFit?: "cover" | "contain";

  // ─── Controls ────────────────────────────────────────────────────
  /** Show control overlay (default OR custom). Default: true. */
  controls?: boolean;
  /** Custom control overlay. Receives full state + dispatchers. */
  renderControls?: (state: VideoState) => ReactNode;
  /** Auto-hide controls after N ms during playback. Default: 2000. Pass 0 to disable. */
  controlsAutoHideMs?: number;

  // ─── Gestures ────────────────────────────────────────────────────
  /** Fires on a 300ms-window double-tap. Caller wires e.g. heart burst. */
  onDoubleTap?: () => void;

  // ─── Lifecycle callbacks ─────────────────────────────────────────
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /** Throttled to one call per requestAnimationFrame max. */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Fires once on `loadedmetadata`. */
  onLoadedMetadata?: (duration: number) => void;
  /** Fires on video element error. */
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
