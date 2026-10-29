/**
 * 0.7.0 (SV-3) - off-DOM warm-up of the NEXT item's media. No node is ever mounted for it:
 * an image is fetched + decoded through `new Image()`, a video loads its metadata through a
 * detached `<video preload="metadata">` that is torn down when it is no longer the next item.
 * Browser-only: nothing here may run during render / SSR (the caller invokes it from an effect).
 */

export interface PreloadTarget {
  key: string;
  type: "image" | "video";
  url: string;
  srcSet?: string;
  sizes?: string;
}

export interface MediaPreloader {
  /** Warm `target` (once per key) and release every other warmed video. `null` = release all videos. */
  sync: (target: PreloadTarget | null) => void;
  /** Release everything and forget what was warmed. */
  dispose: () => void;
}

/** `navigator.connection.saveData` (Data Saver). Safe on any environment. */
export function dataSaverOn(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!conn?.saveData;
}

function releaseVideo(el: HTMLVideoElement) {
  try {
    el.removeAttribute("src");
    el.load();
  } catch {
    // jsdom / exotic environments: nothing to release.
  }
}

export function createMediaPreloader(): MediaPreloader {
  const images = new Set<string>();
  const videos = new Map<string, HTMLVideoElement>();

  const releaseVideosExcept = (keep: string | null) => {
    for (const [key, el] of videos) {
      if (key === keep) continue;
      releaseVideo(el);
      videos.delete(key);
    }
  };

  return {
    sync(target) {
      releaseVideosExcept(target && target.type === "video" ? target.key : null);
      if (!target) return;
      if (target.type === "image") {
        const id = `${target.key}|${target.url}`;
        if (images.has(id)) return;
        images.add(id);
        if (typeof Image === "undefined") return;
        const img = new Image();
        if (target.srcSet) img.srcset = target.srcSet;
        if (target.sizes) img.sizes = target.sizes;
        img.src = target.url;
        if (typeof img.decode === "function") img.decode().catch(() => {});
        return;
      }
      if (videos.has(target.key) || typeof document === "undefined") return;
      const el = document.createElement("video");
      el.preload = "metadata";
      el.muted = true;
      el.src = target.url;
      videos.set(target.key, el);
    },
    dispose() {
      releaseVideosExcept(null);
      images.clear();
    },
  };
}
