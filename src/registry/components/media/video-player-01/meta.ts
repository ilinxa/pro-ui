import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "video-player-01",
  name: "Video Player 01",
  category: "media",

  description:
    "<video> wrapper with muted-autoplay-friendly defaults, slot-based controls, isActive auto-pause for carousel coordination, double-tap callback for like-style gestures, and rAF-throttled time-update lifecycle.",
  context:
    "Use anywhere user-generated or editorial video plays — Instagram-post media, story viewers, news article inline videos, event recordings, product previews. The isActive prop pauses the video cleanly when its slide goes off-screen, so consumers (carousels, story viewers) coordinate playback via a single boolean. Custom control UI via the renderControls slot; default overlay matches the kasder play/pause/mute pattern with auto-hide. Double-tap callback fires through useDoubleTap (also exported standalone for non-video double-tap-to-like). Migration origin: kasder kas-social-front-v0 PostVideoPlayer.tsx; second ship in the 8-component social-posts-system arc; first occupant of the `media` category.",
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
    "loadstart event clears stale state on src change (no transient duration / currentTime mismatches)",
    "a11y: aria-label on <video>, aria-pressed on mute, aria-label on each control",
  ],
  tags: ["video-player-01", "video", "media", "player", "carousel"],

  version: "0.1.2",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-10",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["expandable-text-01", "media-carousel-01", "story-viewer-01"],
};
