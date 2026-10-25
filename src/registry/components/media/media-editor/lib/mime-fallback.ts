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

function supported(mime: string): boolean {
  try {
    return MediaRecorder.isTypeSupported(mime);
  } catch {
    // Some browsers throw on unknown MIMEs — treat as unsupported.
    return false;
  }
}

/** Container part of a MIME string: `"video/mp4;codecs=avc1"` -> `"video/mp4"`. */
function baseType(mime: string): string {
  return (mime.split(";")[0] ?? "").trim().toLowerCase();
}

/**
 * Picks the highest-preference MIME the current browser supports for
 * MediaRecorder. Returns null when nothing matches (very old browsers).
 *
 * `allowed` is an allow-list in preference order (`videoOutput.mimeTypes`).
 * Each entry is probed as written; an entry without parameters
 * (`"video/mp4"`) also allows the codec variants of the built-in chain with
 * the same container. With no `allowed` the built-in chain is walked in
 * order (WebM VP9 -> VP8 -> MP4).
 */
export function selectRecorderMime(): RecorderMimeType | null;
export function selectRecorderMime(allowed?: readonly string[]): string | null;
export function selectRecorderMime(allowed?: readonly string[]): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (!allowed) {
    for (const mime of PREFERRED_RECORDER_MIME_TYPES) {
      if (supported(mime)) return mime;
    }
    return null;
  }
  for (const entry of allowed) {
    if (supported(entry)) return entry;
    if (entry.includes(";")) continue;
    const base = baseType(entry);
    for (const mime of PREFERRED_RECORDER_MIME_TYPES) {
      if (baseType(mime) === base && supported(mime)) return mime;
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
