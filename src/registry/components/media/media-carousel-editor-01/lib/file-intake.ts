import type { MediaCarouselError, MediaCarouselItem, MediaKind } from "../types";
import { validateMediaFile } from "./validate-media-file";

// Per-module-load random prefix so the counter fallback can't collide with ids
// reconstructed from a prior draft after a navigation re-evaluates the module.
const ID_PREFIX = `mci-${Math.floor(Math.random() * 1e9).toString(36)}`;
let idCounter = 0;
function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${ID_PREFIX}-${(idCounter++).toString(36)}`;
}

function readImageDims(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

function readVideoDims(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => resolve({ width: 0, height: 0 });
    video.src = url;
  });
}

export interface FilesToItemsOptions {
  accept: MediaKind[];
  maxFileSizeMb: number;
}

export interface FilesToItemsResult {
  items: MediaCarouselItem[];
  errors: MediaCarouselError[];
}

/**
 * Validate + ingest dropped/picked files into `MediaCarouselItem`s. Creates
 * object URLs and reads natural dimensions (async) so the resolved aspect is
 * correct on first paint. The `maxItems` cap is enforced downstream in the
 * state hook (`addItems`), synchronously against the latest items — so two rapid
 * drops can't each compute room against a stale count.
 */
export async function filesToItems(
  fileList: File[] | FileList,
  opts: FilesToItemsOptions,
): Promise<FilesToItemsResult> {
  const files = Array.from(fileList);
  const errors: MediaCarouselError[] = [];
  const accepted: File[] = [];

  for (const file of files) {
    const err = validateMediaFile(file, opts.maxFileSizeMb, opts.accept);
    if (err) {
      errors.push(err);
      continue;
    }
    accepted.push(file);
  }

  const items = await Promise.all(
    accepted.map(async (file): Promise<MediaCarouselItem> => {
      const kind: MediaKind = file.type.startsWith("video/")
        ? "video"
        : "image";
      const url = URL.createObjectURL(file);
      const dims =
        kind === "image" ? await readImageDims(url) : await readVideoDims(url);
      return {
        id: nextId(),
        kind,
        url,
        blob: file,
        fileName: file.name,
        width: dims.width || undefined,
        height: dims.height || undefined,
      };
    }),
  );

  return { items, errors };
}
