export { default as VideoPlayer } from "./video-player";

export type {
  BufferedRange,
  ResolvedVideoPlayerLabels,
  VideoDirection,
  VideoPlayerHandle,
  VideoPlayerProps,
  VideoPlayerLabels,
  VideoProgress,
  VideoState,
  VideoTrack,
} from "./types";

export { DEFAULT_VIDEO_PLAYER_LABELS, defaultVideoPlayerLabels } from "./types";

// Flat parts — compose them inside `renderControls` for a lighter or custom overlay.
export { VideoPlayerPlayButton } from "./parts/play-button";
export { VideoPlayerMuteButton } from "./parts/mute-button";
export { VideoPlayerSeekBar } from "./parts/seek-bar";
export { VideoPlayerTime, VideoPlayerDurationBadge } from "./parts/time";
export { VideoPlayerFullscreenButton } from "./parts/fullscreen-button";
export { VideoPlayerCaptionsButton } from "./parts/captions-button";
export { VideoPlayerStatus } from "./parts/status";
export { useVideoPlayer, type VideoPlayerContextValue } from "./parts/video-player-context";

export {
  useDoubleTap,
  type UseDoubleTapOptions,
} from "./hooks/use-double-tap";
