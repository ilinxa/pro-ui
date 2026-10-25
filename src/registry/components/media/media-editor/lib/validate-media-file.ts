import type { MediaEditorResolvedLabels, ValidationError } from "../types";
import { resolveEditorLabels } from "./normalize-labels";
import { formatNumber } from "./format-number";

export interface ValidateGalleryFileOptions {
  /** Message templates (the intake keys of the resolved labels). Default: the English defaults. */
  labels?: Pick<
    MediaEditorResolvedLabels,
    "fileUnknownType" | "fileUnsupportedType" | "fileTooLarge"
  >;
  /** BCP 47 locale for the sizes in the message. Default: `"en"`. */
  locale?: string;
  /**
   * Accepted MIME types (`MediaEditorProps.acceptMediaTypes`); wildcards such
   * as `"video/*"` are allowed. Default `["image/*", "video/*"]`.
   */
  acceptMediaTypes?: readonly string[];
}

/** Default intake accept list. */
export const DEFAULT_ACCEPT_MEDIA_TYPES: readonly string[] = ["image/*", "video/*"];

/** The value for an `<input type="file" accept>` attribute. */
export function acceptAttribute(accept?: readonly string[]): string {
  return (accept && accept.length > 0 ? accept : DEFAULT_ACCEPT_MEDIA_TYPES).join(",");
}

/**
 * True when `fileType` satisfies one entry of `accept`. Entries are exact MIME
 * types (`"video/mp4"`) or `type/*` wildcards; parameters on the file type
 * (`"video/webm;codecs=vp9"`) are ignored. Matching is case-insensitive.
 */
export function matchesAccept(
  fileType: string,
  accept?: readonly string[],
): boolean {
  const list = accept && accept.length > 0 ? accept : DEFAULT_ACCEPT_MEDIA_TYPES;
  const type = (fileType.split(";")[0] ?? "").trim().toLowerCase();
  if (!type) return false;
  return list.some((entry) => {
    const e = (entry.split(";")[0] ?? "").trim().toLowerCase();
    if (!e) return false;
    if (e === "*/*") return true;
    if (e.endsWith("/*")) return type.startsWith(e.slice(0, -1));
    return type === e;
  });
}

/**
 * Gallery/file-intake validation — type + size check. Generic (not
 * camera-specific): lives in BASE so the file/gallery intake surface works
 * with the capture feature slice absent (P3 S3 — the pure-CAPTURE files
 * moved to `features/capture/`, but picking a file off disk isn't a capture
 * concern). Used by the base file-intake surface (media-editor.tsx) AND by
 * `features/capture/parts/editor-camera.tsx`'s gallery button — the feature
 * imports this DIRECTLY (relative into base), never through the barrel.
 *
 * `ValidationError.message` is built from the `intake` labels, so it is
 * translated like the rest of the editor.
 */
export function validateGalleryFile(
  file: File,
  maxFileSizeMb: number,
  options?: ValidateGalleryFileOptions,
): ValidationError | null {
  const labels = options?.labels ?? resolveEditorLabels(undefined);
  // The editor can only edit images and videos, so a custom accept list that
  // names another family (e.g. "application/pdf") still cannot get past this.
  const editable =
    file.type.startsWith("image/") || file.type.startsWith("video/");
  if (!editable || !matchesAccept(file.type, options?.acceptMediaTypes)) {
    return {
      kind: "unsupported-type",
      message: labels.fileUnsupportedType(file.type || labels.fileUnknownType),
      file,
    };
  }
  const bytes = file.size;
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (bytes > maxBytes) {
    const sizeMb = bytes / 1024 / 1024;
    return {
      kind: "file-too-large",
      message: labels.fileTooLarge(
        sizeMb,
        maxFileSizeMb,
        formatNumber(sizeMb, options?.locale, { min: 1, grouping: false }),
        formatNumber(maxFileSizeMb, options?.locale, { max: 3, grouping: false }),
      ),
      file,
    };
  }
  return null;
}
