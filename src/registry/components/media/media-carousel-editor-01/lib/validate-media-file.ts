import type { MediaCarouselError, MediaKind } from "../types";

/**
 * Local reimplementation of media-editor-01's `validateGalleryFile` — type +
 * size check, plus an `accept` gate. Kept local (NOT imported) to hold the
 * cross-procomp surface to one module (F-01) and keep media-editor-01 untouched.
 */
export function validateMediaFile(
  file: File,
  maxFileSizeMb: number,
  accept: MediaKind[],
): MediaCarouselError | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const kind: MediaKind | null = isImage ? "image" : isVideo ? "video" : null;

  if (!kind) {
    return {
      kind: "unsupported-type",
      message: `Unsupported file type: ${file.type || "unknown"}`,
      file,
    };
  }
  if (!accept.includes(kind)) {
    return {
      kind: "unsupported-type",
      message: `${kind === "image" ? "Image" : "Video"} files are not accepted here.`,
      file,
    };
  }
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      kind: "file-too-large",
      message: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum is ${maxFileSizeMb} MB.`,
      file,
    };
  }
  return null;
}
