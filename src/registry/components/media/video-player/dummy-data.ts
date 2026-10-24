import type { VideoTrack } from "./types";

// Hotlink-friendly demo sources. Pexels' video CDN blocks anonymous hotlinks
// (returns 403), so the fixtures use test-videos.co.uk (Big Buck Bunny / Sintel
// / Jellyfish — public test-clip mirrors) and MDN's cc0-videos bucket.

/** Royalty-free landscape clip (~10s, ~1MB). */
export const SAMPLE_VIDEO_URL =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";

/** Generic 1280×720 placeholder poster. Swap for a real still in production. */
export const SAMPLE_POSTER_URL =
  "https://images.placeholders.dev/?width=1280&height=720&text=Sample+Video";

/**
 * Short clip exported as the "vertical" sample slot for fixtures consumers.
 * Note: this source is landscape. Story-style consumers should swap in their
 * own vertical asset.
 */
export const SAMPLE_VERTICAL_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4";

/** Short loopable clip for autoplay-loop scenarios (~10s flower clip). */
export const SAMPLE_LOOP_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/** Second landscape clip — used for the isActive carousel demo (Jellyfish). */
export const SAMPLE_VIDEO_URL_B =
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4";

/** Third landscape clip — used for the isActive carousel demo (Sintel). */
export const SAMPLE_VIDEO_URL_C =
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4";

/**
 * A clip with a matching caption file (MDN's "friday" example). Both are served with
 * `access-control-allow-origin: *`, so they work with `crossOrigin="anonymous"` — which a
 * cross-origin caption file requires. The test-videos.co.uk clips above send no CORS header, so
 * do NOT combine them with `crossOrigin`.
 */
export const SAMPLE_CAPTIONED_VIDEO_URL =
  "https://developer.mozilla.org/shared-assets/videos/friday.mp4";

/** English captions for `SAMPLE_CAPTIONED_VIDEO_URL` (not shown until the viewer turns them on). */
export const SAMPLE_TRACKS_EN: VideoTrack[] = [
  {
    kind: "captions",
    src: "https://developer.mozilla.org/shared-assets/misc/friday.vtt",
    srcLang: "en",
    label: "English",
  },
];

/** Two tracks for the captions menu (the same file under two labels — a stand-in for real translations). */
export const SAMPLE_TRACKS_MULTI: VideoTrack[] = [
  ...SAMPLE_TRACKS_EN,
  {
    kind: "subtitles",
    src: "https://developer.mozilla.org/shared-assets/misc/friday.vtt",
    srcLang: "tr",
    label: "Türkçe",
  },
];

/** RTL sample copy for the demo's right-to-left example (consumer contract C4). */
export const SAMPLE_RTL_CAPTION = "مقطع فيديو تجريبي";
