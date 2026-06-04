import type { MediaCarouselError, MediaCarouselItem, MediaKind } from "../types";
import { validateMediaFile } from "./validate-media-file";

let idCounter = 0;
function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mci-${(idCounter++).toString(36)}`;
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
  maxItems: number;
  existingCount: number;
}

export interface FilesToItemsResult {
  items: MediaCarouselItem[];
  errors: MediaCarouselError[];
  /** True if the input would have exceeded `maxItems` (overflow dropped). */
  exceeded: boolean;
  /** Number of valid files the caller TRIED to add (incl. dropped overflow). */
  attempted: number;
}

/**
 * Validate + ingest dropped/picked files into committed `MediaCarouselItem`s.
 * Creates object URLs and reads natural dimensions (async) so the resolved
 * aspect is correct on first paint. Overflow beyond `maxItems` is dropped and
 * flagged via `exceeded`; invalid files surface as `errors`.
 */
export async function filesToItems(
  fileList: File[] | FileList,
  opts: FilesToItemsOptions,
): Promise<FilesToItemsResult> {
  const files = Array.from(fileList);
  const errors: MediaCarouselError[] = [];
  const accepted: File[] = [];
  const room = Math.max(0, opts.maxItems - opts.existingCount);
  let attempted = 0;
  let exceeded = false;

  for (const file of files) {
    const err = validateMediaFile(file, opts.maxFileSizeMb, opts.accept);
    if (err) {
      errors.push(err);
      continue;
    }
    attempted += 1;
    if (accepted.length >= room) {
      exceeded = true;
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

  return { items, errors, exceeded, attempted };
}
