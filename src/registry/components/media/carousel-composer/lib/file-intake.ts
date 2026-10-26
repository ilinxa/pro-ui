import type {
  CarouselComposerErrorLabels,
  MediaCarouselError,
  MediaCarouselItem,
  MediaKind,
} from "../types";
import { grabPoster, probeVideo, releaseVideo } from "./poster";
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

export interface FilesToItemsOptions {
  accept: MediaKind[];
  acceptMime?: readonly string[];
  maxFileSizeMb: number;
  /** Refuse videos longer than this many seconds. */
  maxVideoSeconds?: number;
  /** Seconds into a video for its poster frame; `false` = none. Default 0.5. */
  posterAt?: number | false;
  errors: CarouselComposerErrorLabels;
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
    const err = validateMediaFile(file, {
      maxFileSizeMb: opts.maxFileSizeMb,
      accept: opts.accept,
      acceptMime: opts.acceptMime,
      errors: opts.errors,
    });
    if (err) {
      errors.push(err);
      continue;
    }
    accepted.push(file);
  }

  const posterAt = opts.posterAt === undefined ? 0.5 : opts.posterAt;

  const built = await Promise.all(
    accepted.map(
      async (
        file,
      ): Promise<{ item: MediaCarouselItem } | { error: MediaCarouselError }> => {
        const kind: MediaKind = file.type.startsWith("video/")
          ? "video"
          : "image";
        const url = URL.createObjectURL(file);
        if (kind === "image") {
          const dims = await readImageDims(url);
          return {
            item: {
              id: nextId(),
              kind,
              url,
              blob: file,
              fileName: file.name,
              width: dims.width || undefined,
              height: dims.height || undefined,
            },
          };
        }
        const probe = await probeVideo(url);
        const { duration } = probe;
        if (
          opts.maxVideoSeconds !== undefined &&
          duration !== undefined &&
          duration > opts.maxVideoSeconds
        ) {
          releaseVideo(probe.video);
          URL.revokeObjectURL(url);
          return {
            error: {
              kind: "video-too-long",
              message: opts.errors.videoTooLong({
                file,
                seconds: duration,
                maxSeconds: opts.maxVideoSeconds,
              }),
              file,
              durationSeconds: duration,
              maxSeconds: opts.maxVideoSeconds,
            },
          };
        }
        let posterBlob: Blob | undefined;
        if (posterAt !== false) {
          posterBlob = (await grabPoster(probe.video, posterAt, duration)) ?? undefined;
        }
        releaseVideo(probe.video);
        return {
          item: {
            id: nextId(),
            kind,
            url,
            blob: file,
            fileName: file.name,
            width: probe.width || undefined,
            height: probe.height || undefined,
            duration,
            posterBlob,
            posterUrl: posterBlob ? URL.createObjectURL(posterBlob) : undefined,
          },
        };
      },
    ),
  );

  const items: MediaCarouselItem[] = [];
  for (const b of built) {
    if ("item" in b) items.push(b.item);
    else errors.push(b.error);
  }
  return { items, errors };
}
