import { DEFAULT_LABELS } from "../types";
import type { MediaEditorLabels, MediaEditorResolvedLabels } from "../types";

/**
 * Nested `MediaEditorLabels` path <-> flat `MediaEditorResolvedLabels` key
 * (1:1, every flat key appears exactly once). The compile-time assertion
 * below fails when a flat key has no nested path.
 */
const NESTED_TO_FLAT = [
  [["shell", "title"], "composerLabel"],
  [["shell", "description"], "composerDescription"],
  [["shell", "back"], "back"],
  [["shell", "apply"], "apply"],
  [["shell", "cancel"], "cancel"],
  [["shell", "backToCapture"], "backToCapture"],
  [["shell", "editTools"], "editTools"],
  [["capture", "requestingCamera"], "permissionRequesting"],
  [["capture", "cameraIdle", "title"], "permissionIdleTitle"],
  [["capture", "cameraIdle", "body"], "permissionIdleBody"],
  [["capture", "cameraIdle", "enableCta"], "permissionEnable"],
  [["capture", "cameraDenied", "title"], "permissionDeniedTitle"],
  [["capture", "cameraDenied", "body"], "permissionDeniedBody"],
  [["capture", "cameraDenied", "retryCta"], "permissionRetry"],
  [["capture", "cameraDenied", "useGalleryCta"], "permissionUsePicker"],
  [["capture", "noCameraTitle"], "permissionNoCameraTitle"],
  [["capture", "cameraErrorTitle"], "permissionErrorTitle"],
  [["capture", "galleryButton"], "galleryPicker"],
  [["capture", "switchCamera"], "switchCamera"],
  [["capture", "modes", "photo"], "modePhoto"],
  [["capture", "modes", "video"], "modeVideo"],
  [["capture", "modes", "text"], "modeText"],
  [["capture", "shutter", "photo"], "shutterPhoto"],
  [["capture", "shutter", "videoStart"], "shutterVideoStart"],
  [["capture", "shutter", "videoStop"], "shutterVideoStop"],
  [["capture", "recording"], "recordingLabel"],
  [["capture", "connectCta"], "connectCamera"],
  [["capture", "connectHint"], "connectHint"],
  [["capture", "errors", "videoUnsupported"], "videoUnsupported"],
  [["capture", "errors", "videoFailed"], "videoFailed"],
  [["capture", "errors", "videoCodecUnavailable"], "videoCodecUnavailable"],
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
  [["draw", "color"], "drawColor"],
  [["draw", "brushSize"], "drawBrush"],
  [["draw", "eraser"], "drawEraser"],
  [["text", "placeholder"], "textPlaceholder"],
  [["text", "fontFamily"], "textFontFamily"],
  [["text", "fontSize"], "textFontSize"],
  [["text", "alignLeft"], "textAlignLeft"],
  [["text", "alignCenter"], "textAlignCenter"],
  [["text", "alignRight"], "textAlignRight"],
  [["text", "delete"], "textDelete"],
  [["text", "background"], "textBackground"],
  [["color", "hex"], "colorHex"],
  [["color", "swatch"], "colorSwatch"],
  [["crop", "free"], "cropAspectFree"],
  [["crop", "original"], "cropAspectOriginal"],
  [["crop", "aspect"], "cropAspectName"],
  [["crop", "aspectCount"], "cropAspectCount"],
  [["canvas", "label"], "canvasAriaLabel"],
  [["canvas", "resetZoom"], "resetZoom"],
  [["canvas", "resizeHandle"], "resizeHandle"],
  [["trim", "start"], "trimStart"],
  [["trim", "end"], "trimEnd"],
  [["trim", "seconds"], "trimSeconds"],
  [["discard", "title"], "discardConfirmTitle"],
  [["discard", "body"], "discardConfirmBody"],
  [["discard", "cancel"], "discardCancel"],
  [["discard", "confirm"], "discardConfirm"],
  [["intake", "prompt"], "intakePrompt"],
  [["intake", "unknownType"], "fileUnknownType"],
  [["intake", "unsupportedType"], "fileUnsupportedType"],
  [["intake", "fileTooLarge"], "fileTooLarge"],
  [["empty", "noSource"], "emptyNoSource"],
  [["empty", "noSourceHint"], "emptyNoSourceHint"],
  [["empty", "noSourceAria"], "emptyNoSourceAria"],
  [["empty", "loadFailed"], "emptyLoadFailed"],
  [["empty", "attempted"], "emptyAttempted"],
  [["empty", "enabled"], "emptyEnabled"],
  [["empty", "type"], "emptyType"],
  [["empty", "blank"], "emptyBlank"],
  [["empty", "none"], "emptyNone"],
  [["empty", "noCaptureSource"], "emptyNoCaptureSource"],
  [["empty", "aspect"], "emptyAspect"],
  [["empty", "sources"], "emptySources"],
] as const satisfies ReadonlyArray<
  readonly [readonly string[], keyof MediaEditorResolvedLabels]
>;

// Compile-time exhaustiveness: resolves to `never` (and fails to compile)
// when a `MediaEditorResolvedLabels` key has no nested path in the table.
type MissingPaths = Exclude<
  keyof MediaEditorResolvedLabels,
  (typeof NESTED_TO_FLAT)[number][1]
>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ALL_KEYS_HAVE_A_PATH: [MissingPaths] extends [never] ? true : never = true;

function readPath(root: unknown, path: readonly string[]): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

type FlatKey = keyof MediaEditorResolvedLabels;

/** Runtime kind of a label key: "function" for parameterised templates, else "string". */
function kindOf(key: string): "string" | "function" | undefined {
  const entry = NESTED_TO_FLAT.find((e) => e[1] === key);
  if (!entry) return undefined;
  const v = readPath(DEFAULT_LABELS, entry[0]);
  return typeof v === "function" ? "function" : "string";
}

/**
 * Normalizes the `labels` prop onto the flat `MediaEditorResolvedLabels`
 * shape (partial: only the keys that were set).
 *
 * Accepts the nested `MediaEditorLabels` shape, the flat shape (deprecated;
 * what story-composer passed before 0.5.0), or a mix. Nested values are
 * applied first, then flat keys are spread over them, so flat wins on
 * conflict. String-valued keys must be strings and function-valued keys must
 * be functions; anything else is ignored. Unknown flat string keys pass
 * through untouched.
 */
export function normalizeEditorLabels(
  input: unknown,
): Partial<MediaEditorResolvedLabels> {
  const out: Record<string, unknown> = {};
  if (input === null || typeof input !== "object") return out;

  for (const [path, flatKey] of NESTED_TO_FLAT) {
    const v = readPath(input, path);
    if (typeof v === kindOf(flatKey)) out[flatKey] = v;
  }
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const kind = kindOf(k);
    if (kind === undefined ? typeof v === "string" : typeof v === kind) {
      out[k] = v;
    }
  }
  return out as Partial<MediaEditorResolvedLabels>;
}

/**
 * The fully populated label set: `DEFAULT_LABELS` (the single source of the
 * English strings) with the consumer's labels (nested, flat or mixed) merged
 * over it.
 */
export function resolveEditorLabels(input: unknown): MediaEditorResolvedLabels {
  return {
    ...normalizeEditorLabels(DEFAULT_LABELS),
    ...normalizeEditorLabels(input),
  } as MediaEditorResolvedLabels;
}

/**
 * Inverse of the nested -> flat table: converts a flat label object (for
 * example a host's own flat labels) into the nested `MediaEditorLabels` shape
 * the `labels` prop takes. Keys it does not know are ignored, so an object
 * with extra keys is fine.
 */
export function editorLabelsFromFlat(
  flat: Partial<MediaEditorResolvedLabels>,
): MediaEditorLabels {
  const out: Record<string, unknown> = {};
  const source = flat as Record<string, unknown>;
  for (const [path, flatKey] of NESTED_TO_FLAT) {
    const v = source[flatKey as FlatKey];
    if (typeof v !== kindOf(flatKey)) continue;
    let cur = out;
    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i]!;
      const next = cur[seg];
      if (next === undefined || next === null || typeof next !== "object") {
        cur[seg] = {};
      }
      cur = cur[seg] as Record<string, unknown>;
    }
    cur[path[path.length - 1]!] = v;
  }
  return out as MediaEditorLabels;
}
