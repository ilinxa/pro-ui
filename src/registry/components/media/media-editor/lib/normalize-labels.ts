import type { StoryComposerLabels } from "../types";

/**
 * Nested `MediaEditorLabels` path -> internal flat key (1:1).
 * `publish.*` and `empty.noSource` have no consumer in the editor today, so
 * they are intentionally absent.
 */
const NESTED_TO_FLAT: ReadonlyArray<
  readonly [readonly string[], keyof StoryComposerLabels]
> = [
  [["capture", "requestingCamera"], "permissionRequesting"],
  [["capture", "cameraDenied", "title"], "permissionDeniedTitle"],
  [["capture", "cameraDenied", "body"], "permissionDeniedBody"],
  [["capture", "cameraDenied", "retryCta"], "permissionRetry"],
  [["capture", "cameraDenied", "useGalleryCta"], "permissionUsePicker"],
  [["capture", "galleryButton"], "galleryPicker"],
  [["capture", "switchCamera"], "switchCamera"],
  [["capture", "modes", "photo"], "modePhoto"],
  [["capture", "modes", "video"], "modeVideo"],
  [["capture", "modes", "text"], "modeText"],
  [["toolbar", "text"], "toolText"],
  [["toolbar", "draw"], "toolDraw"],
  [["toolbar", "stickers"], "toolStickers"],
  [["toolbar", "filters"], "toolFilters"],
  [["toolbar", "adjust"], "toolAdjust"],
  [["toolbar", "crop"], "toolCrop"],
  [["adjust", "brightness"], "adjustBrightness"],
  [["adjust", "contrast"], "adjustContrast"],
  [["adjust", "saturation"], "adjustSaturation"],
  [["adjust", "blur"], "adjustBlur"],
  [["discard", "title"], "discardConfirmTitle"],
  [["discard", "body"], "discardConfirmBody"],
  [["discard", "cancel"], "discardCancel"],
  [["discard", "confirm"], "discardConfirm"],
];

function readPath(root: unknown, path: readonly string[]): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Normalizes the `labels` prop onto the internal flat label shape.
 *
 * Accepts the documented nested `MediaEditorLabels` shape, the flat internal
 * shape (what story-composer passes), or a mix. Detection is per key: group
 * keys are objects, flat keys are strings. Nested values are applied first,
 * then flat string keys are spread over them, so flat wins on conflict.
 * Non-string values are ignored. Returns only the keys that were set.
 */
export function normalizeEditorLabels(
  input: unknown,
): Partial<StoryComposerLabels> {
  const out: Partial<Record<keyof StoryComposerLabels, string>> = {};
  if (input === null || typeof input !== "object") return out;

  for (const [path, flatKey] of NESTED_TO_FLAT) {
    const v = readPath(input, path);
    if (typeof v === "string") out[flatKey] = v;
  }
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v === "string") {
      out[k as keyof StoryComposerLabels] = v;
    }
  }
  return out;
}

