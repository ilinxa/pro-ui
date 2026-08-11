import type { ValidationError } from "../types";

/**
 * Gallery/file-intake validation — type + size check. Generic (not
 * camera-specific): lives in BASE so the file/gallery intake surface works
 * with the capture feature slice absent (P3 S3 — the pure-CAPTURE files
 * moved to `features/capture/`, but picking a file off disk isn't a capture
 * concern). Used by the base file-intake surface (media-editor.tsx) AND by
 * `features/capture/parts/editor-camera.tsx`'s gallery button — the feature
 * imports this DIRECTLY (relative into base), never through the barrel.
 */
export function validateGalleryFile(
  file: File,
  maxFileSizeMb: number,
): ValidationError | null {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return {
      kind: "unsupported-type",
      message: `Unsupported file type: ${file.type || "unknown"}`,
      file,
    };
  }
  const bytes = file.size;
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (bytes > maxBytes) {
    return {
      kind: "file-too-large",
      message: `File is ${(bytes / 1024 / 1024).toFixed(1)} MB — maximum is ${maxFileSizeMb} MB`,
      file,
    };
  }
  return null;
}
