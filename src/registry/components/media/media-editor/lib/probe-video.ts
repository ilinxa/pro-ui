export interface VideoProbe {
  width: number;
  height: number;
  /** Rounded to whole milliseconds; omitted when the container reports no finite duration. */
  durationMs?: number;
}

/**
 * Reads a video blob's intrinsic size and duration through a detached
 * `<video>` element (`loadedmetadata`). Resolves `null` when the metadata does
 * not arrive within `timeoutMs`, the blob fails to decode, or the platform has
 * no DOM — callers fall back to their own defaults. Never rejects.
 */
export function probeVideo(
  blob: Blob,
  timeoutMs = 1500,
): Promise<VideoProbe | null> {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let url: string;
    try {
      url = URL.createObjectURL(blob);
    } catch {
      resolve(null);
      return;
    }
    const video = document.createElement("video");
    let settled = false;
    const finish = (result: VideoProbe | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load?.();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video;
      if (!videoWidth || !videoHeight) {
        finish(null);
        return;
      }
      finish({
        width: videoWidth,
        height: videoHeight,
        durationMs: Number.isFinite(duration)
          ? Math.round(duration * 1000)
          : undefined,
      });
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}
