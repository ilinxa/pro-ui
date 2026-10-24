import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "video-player",
  name: "Video Player",
  category: "media",

  description:
    "Video player — seek bar, captions, fullscreen, buffering and error states with URL refresh, autoplay groups, composable controls, and double-tap gestures.",
  context:
    "Use anywhere user-generated or editorial video plays — Instagram-post media, story viewers, news article inline videos, event recordings, product previews. The isActive prop pauses the video cleanly when its slide goes off-screen, so consumers (carousels, story viewers) coordinate playback via a single boolean. Custom control UI via the renderControls slot; default overlay matches the kasder play/pause/mute pattern with auto-hide. Double-tap callback fires through useDoubleTap (also exported standalone for non-video double-tap-to-like). Migration origin: kasder kas-social-front-v0 PostVideoPlayer.tsx; second ship in the 8-component social-posts-system arc; first occupant of the `media` category.",
  features: [
    "Muted autoplay-friendly defaults (muted=true, loop=true unless onEnded is passed, playsInline=true)",
    "isActive prop pauses cleanly when false (carousel coordination)",
    "Seek bar (role=slider) driven by media time, with buffered ranges, direction-aware arrow keys, Home/End and pointer drag",
    "Elapsed / total time and an idle duration badge through locale + formatDuration (durationHint for preload=none)",
    "Opt-in fullscreen (container requestFullscreen, iOS webkitEnterFullscreen fallback; hidden when neither exists)",
    "Captions control for tracks: a toggle for one track, a keyboard-operable menu for several; crossOrigin pass-through",
    "Buffering spinner + error overlay with Retry; onMediaError refreshes an expired URL once per src and resumes at the same time and play state",
    "Opt-in autoPlayInView (muted, visibility threshold) with autoplayGroup — at most one player per group plays; off under reduced motion",
    "Controlled muted via onMutedChange (feed-wide sound preference); uncontrolled by default",
    "Imperative ref handle: play / pause / seek / toggleMute / toggleFullscreen",
    "Flat parts for renderControls: VideoPlayerPlayButton, MuteButton, SeekBar, Time, DurationBadge, FullscreenButton, CaptionsButton, Status",
    "Default overlay: big play button + bottom-start pause + bottom-end mute + seek bar row; 2s auto-hide that wakes on pointer, tap, focus and keys; hidden controls take no clicks",
    "Double tap: with onDoubleTap a single tap waits out the 300ms window, so a double tap never plays-then-pauses",
    "Keyboard: Space=play/pause, M=mute, ←/→ seek while controls render (focus-required)",
    "rAF-throttled onTimeUpdate and onProgress ({ currentTime, duration, buffered })",
    "Lifecycle callbacks: onPlay / onPause / onEnded / onTimeUpdate / onProgress / onLoadedMetadata / onError",
    "Public useDoubleTap hook export (with an optional onSingleTap) for non-video consumers",
    "Typed labels (functions for values) + locale; dir prop or inherited direction; RTL-mirrored seek bar",
    "a11y: aria-label on <video>, aria-pressed toggles, slider valuetext, status / alert regions",
  ],
  tags: ["video-player", "video", "media", "player", "carousel"],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 90,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-24",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["expandable-text", "media-carousel", "story-viewer"],
};
