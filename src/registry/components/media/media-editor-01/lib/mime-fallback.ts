/**
 * MediaRecorder codec preference chain.
 *
 * Chrome/Edge/Firefox prefer WebM (VP9 → VP8); Safari only supports MP4.
 * Each entry includes the audio codec so the resulting MIME string is
 * directly usable in `new MediaRecorder(stream, { mimeType })`.
 */
export const PREFERRED_RECORDER_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
] as const;

export type RecorderMimeType = (typeof PREFERRED_RECORDER_MIME_TYPES)[number];

/**
 * Picks the highest-preference MIME the current browser supports for
 * MediaRecorder. Returns null when nothing matches (very old browsers).
 */
export function selectRecorderMime(): RecorderMimeType | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of PREFERRED_RECORDER_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {
      // Some browsers throw on unknown MIMEs — keep looking.
    }
  }
  return null;
}

/** Extracts the bare container ("webm" or "mp4") for filename hints. */
export function containerFor(mime: string): "webm" | "mp4" | "unknown" {
  if (mime.startsWith("video/webm")) return "webm";
  if (mime.startsWith("video/mp4")) return "mp4";
  return "unknown";
}
