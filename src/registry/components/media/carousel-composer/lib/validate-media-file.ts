import type {
  CarouselComposerErrorLabels,
  MediaCarouselError,
  MediaKind,
} from "../types";

export interface ValidateMediaOptions {
  maxFileSizeMb: number;
  /** Which kinds are accepted. */
  accept: MediaKind[];
  /** Exact MIME allow-list; when set the file's type must be in it. */
  acceptMime?: readonly string[];
  errors: CarouselComposerErrorLabels;
}

/**
 * Type + size check for one file: it must be an image or a video, in `accept`,
 * in `acceptMime` when that is set, and within the size cap. Messages come from
 * `errors`. The video length limit is checked later, once metadata is read.
 */
export function validateMediaFile(
  file: File,
  opts: ValidateMediaOptions,
): MediaCarouselError | null {
  const type = file.type;
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  const kind: MediaKind | null = isImage ? "image" : isVideo ? "video" : null;

  if (!kind) {
    return {
      kind: "unsupported-type",
      message: opts.errors.unsupportedType({ file, type }),
      file,
    };
  }
  if (
    opts.acceptMime &&
    !opts.acceptMime.some((m) => m.toLowerCase() === type.toLowerCase())
  ) {
    return {
      kind: "unsupported-type",
      message: opts.errors.unsupportedType({ file, type }),
      file,
    };
  }
  if (!opts.accept.includes(kind)) {
    return {
      kind: "unsupported-type",
      message: opts.errors.kindNotAccepted({ file, kind }),
      file,
    };
  }
  const maxBytes = opts.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      kind: "file-too-large",
      message: opts.errors.fileTooLarge({
        file,
        sizeMb: file.size / 1024 / 1024,
        maxMb: opts.maxFileSizeMb,
      }),
      file,
    };
  }
  return null;
}
