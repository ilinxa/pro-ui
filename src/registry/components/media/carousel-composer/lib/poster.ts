/** Longest edge of a poster frame, in pixels. Keeps a 4K video within canvas limits. */
const POSTER_MAX_EDGE = 1280;

/** How long to wait for a video's metadata or a seek before giving up. */
const WAIT_MS = 8000;

export interface VideoProbe {
  width: number;
  height: number;
  /** Seconds; `undefined` when the browser cannot read it. */
  duration?: number;
  video: HTMLVideoElement;
}

/** Load a video's metadata. Resolves with zeros / no duration when it cannot be read. */
export function probeVideo(url: string): Promise<VideoProbe> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const d = video.duration;
      resolve({
        width: ok ? video.videoWidth : 0,
        height: ok ? video.videoHeight : 0,
        duration: ok && Number.isFinite(d) && d > 0 ? d : undefined,
        video,
      });
    };
    const timer = setTimeout(() => finish(false), WAIT_MS);
    video.onloadedmetadata = () => finish(true);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

/** Drop the probe's media resources. */
export function releaseVideo(video: HTMLVideoElement): void {
  video.onloadedmetadata = null;
  video.onerror = null;
  video.removeAttribute("src");
  try {
    video.load();
  } catch {
    /* not supported — nothing to release */
  }
}

/**
 * Grab one JPEG frame from an already-probed video at `at` seconds (clamped to
 * the duration). Resolves `null` on any failure; a missing poster is never an error.
 */
export function grabPoster(
  video: HTMLVideoElement,
  at: number,
  duration?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onFail);
      resolve(blob);
    };
    const draw = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return finish(null);
        const scale = Math.min(1, POSTER_MAX_EDGE / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.85);
      } catch {
        finish(null);
      }
    };
    const onSeeked = () => draw();
    const onFail = () => finish(null);
    const timer = setTimeout(() => finish(null), WAIT_MS);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onFail);
    try {
      const max = duration !== undefined ? Math.max(0, duration - 0.05) : at;
      let target = Math.max(0, Math.min(at, max));
      // A seek to the current time fires no "seeked"; nudge it.
      if (target === video.currentTime) target += 0.001;
      video.currentTime = target;
    } catch {
      finish(null);
    }
  });
}
