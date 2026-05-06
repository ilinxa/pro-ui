import type { VideoTrack } from "./types";

/** Royalty-free landscape clip (~6s). Pexels. */
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

/** Second landscape clip (different colors) — used for the isActive carousel demo. */
export const SAMPLE_VIDEO_URL_B =
  "https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4";

/** Third landscape clip — used for the isActive carousel demo. */
export const SAMPLE_VIDEO_URL_C =
  "https://videos.pexels.com/video-files/2871916/2871916-uhd_2560_1440_25fps.mp4";

/** Sample English captions track. URL is a placeholder — verifies that <track> renders. */
export const SAMPLE_TRACKS_EN: VideoTrack[] = [
  {
    kind: "captions",
    src: "https://example.com/captions/sample-en.vtt",
    srcLang: "en",
    label: "English",
    default: true,
  },
];
