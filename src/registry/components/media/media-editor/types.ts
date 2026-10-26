import type { ReactNode } from "react";
import type { MediaCaptureExtension } from "./hooks/use-capture-extension";

// ─── Modes + stage ──────────────────────────────────────────────────────
// (Locked: NO renames from story-composer v0.1.5 — see plan §"Type system".
// story-composer v0.2.0 re-exports these for backward-compat.)

export type ComposerMode = "photo" | "video" | "text";

export type ComposerStage =
  | "capture"
  | "edit"
  | "publishing"
  | "done"
  | "error";

// ─── Validation ─────────────────────────────────────────────────────────

export interface ValidationError {
  kind:
    | "file-too-large"
    | "unsupported-type"
    | "unsupported-codec"
    | "duration-exceeded"
    | "no-camera"
    | "permission-denied";
  message: string;
  file?: File;
}

// ─── Stickers ───────────────────────────────────────────────────────────

export interface StickerOption {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface StickerSet {
  id: string;
  label: string;
  stickers: StickerOption[];
}

// ─── Filters + adjustments ──────────────────────────────────────────────

export interface KonvaFilterSpec {
  name: string;
  params?: Record<string, number>;
}

export interface FilterPreset {
  id: string;
  label: string;
  konvaFilters: KonvaFilterSpec[];
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

// ─── Overlay items ──────────────────────────────────────────────────────

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fontFamily: string;
  fontSize: number;
  fill: string;
  align: "left" | "center" | "right";
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface DrawingStroke {
  id: string;
  points: number[];
  color: string;
  brushSize: number;
  mode: "draw" | "erase";
}

// ─── Fonts ──────────────────────────────────────────────────────────────

export interface FontOption {
  id: string;
  label: string;
  family: string;
}

// ─── Aspect ratios + tools ──────────────────────────────────────────────
// v0.1.0 of media-editor adds "16:9" to AspectRatio (additive — non-breaking
// for v0.1.5 consumers; they used at most "9:16" | "1:1" | "4:5" | "free").

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5" | "free";

/**
 * A crop choice. Every `AspectRatio`, plus `"original"` (the loaded photo's own
 * ratio) and any `"W:H"` string with positive numbers (for example `"3:2"`).
 * Crop choices only — the editor canvas `aspect` stays an `AspectRatio`.
 */
export type CropAspect = AspectRatio | "original" | `${number}:${number}`;

export type EditTool =
  | "text"
  | "draw"
  | "stickers"
  | "filters"
  | "adjust"
  | "crop";

// ─── Media source intake (NEW in media-editor — for capability gating) ──

export type MediaSource = "camera" | "upload";
// "library" is not implemented — see description §"Out of scope"

// ─── Crop ───────────────────────────────────────────────────────────────
// Lifted from story-composer/parts/tool-crop-overlay.tsx (where v0.1.5
// defined it). Shape preserved verbatim — 4 fields, no `aspect`. Adding fields
// would break v0.1.5 consumers via type-narrowing.

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Initial source (NEW — CMS re-edit / draft restore path) ────────────

export type InitialSource =
  | { kind: "url"; url: string; mode: "photo" | "video" }
  | { kind: "blob"; blob: Blob; mode: "photo" | "video" }
  | { kind: "file"; file: File };

// ─── Draft media (NEW — capture output before edit transition) ──────────

/**
 * Captured (or imported) media awaiting edit. Set by camera flow + gallery
 * pick. Held in editor state so getState/loadState can round-trip draft
 * restores (e.g., draft persisted to localStorage between sessions).
 */
export interface DraftMedia {
  source: "camera" | "gallery" | "initial";
  kind: "image" | "video";
  blob: Blob;
  /** Object URL for preview — caller owns revocation when draft is replaced. */
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
  mimeType: string;
}

/** Video trim range, in seconds. */
export interface TrimRange {
  startSec: number;
  endSec: number;
  durationSec: number;
}

/** Drawing-tool UI configuration. Not content; not in MediaEditorState. */
export interface DrawingToolConfig {
  color: string;
  brushSize: number;
  mode: "draw" | "erase";
}

/** Text-only mode capture state. */
export interface TextOnlyState {
  text: string;
  fontFamily: string;
  textColor: string;
  gradientId: string;
}

// ─── Source / load errors (NEW) ─────────────────────────────────────────

export type SourceError =
  | { kind: "cors"; url: string; underlying: Error }
  | { kind: "fetch-failed"; url: string; underlying: Error }
  | {
      kind: "mode-not-enabled";
      attempted: ComposerMode;
      enabled: ComposerMode[];
    }
  | { kind: "unsupported-file-type"; fileType: string; file: File }
  | { kind: "invalid-blob"; reason: string };

// ─── Editor state (NEW — serializable snapshot for getState / loadState) ──

export interface GradientPreset {
  id: string;
  label: string;
  /** CSS background value — used directly on the text-only canvas. (Preserves v0.1.5 contract.) */
  background: string;
}

/**
 * The layout that the coordinates in a snapshot (overlay positions, stroke
 * points, crop) were recorded in. All values are stage CSS pixels.
 */
export interface StateFrame {
  /** Stage size when the snapshot was taken. */
  stageWidth: number;
  stageHeight: number;
  /** The photo's displayed rect on that stage, when a photo was loaded. */
  media?: CropRect;
}

export interface MediaEditorState {
  mode: ComposerMode | null;
  stage: ComposerStage;
  imageSrc: string | null;
  videoBlob: Blob | null;
  /** Text-card background. Kept in sync with `textOnly` while in text mode. */
  textBackground: GradientPreset | null;
  /** Text-card text. Kept in sync with `textOnly` while in text mode. */
  textContent: string | null;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: DrawingStroke[];
  filter: string | null;
  adjustments: ImageAdjustments;
  crop: CropRect | null;
  /**
   * Full text-card content (text, font, colour, background). `getState()`
   * always fills it; `loadState` restores it. Optional so snapshots taken
   * before 0.6.0 still load.
   */
  textOnly?: TextOnlyState;
  /**
   * The layout the coordinates in this snapshot were recorded in. `getState()`
   * always fills it once the canvas has measured. `loadState` uses it to map
   * overlay positions, stroke points and the crop onto the current layout (the
   * photo's displayed rect when both have one, else the stage size), so a
   * re-open at another size keeps them on the same picture content. Absent
   * (snapshots before 0.6.0): coordinates are used as they are.
   */
  frame?: StateFrame;
}

// ─── Edit action (NEW — analytics + undo sync) ──────────────────────────

export type EditAction =
  | { kind: "mode-change"; from: ComposerMode | null; to: ComposerMode | null }
  | { kind: "tool-open"; tool: EditTool }
  | { kind: "tool-close"; tool: EditTool }
  | { kind: "text-add"; overlay: TextOverlay }
  | { kind: "text-update"; id: string; patch: Partial<TextOverlay> }
  | { kind: "text-remove"; id: string }
  | { kind: "sticker-add"; placed: PlacedSticker }
  | { kind: "sticker-remove"; id: string }
  | { kind: "draw-stroke"; stroke: DrawingStroke }
  | { kind: "filter-apply"; name: string | null }
  | { kind: "adjust-change"; patch: Partial<ImageAdjustments> }
  | { kind: "crop-set"; crop: CropRect | null }
  | { kind: "undo" }
  | { kind: "redo" }
  | { kind: "reset" };

// ─── Export contracts (NEW — locked at Q-P3 sign-off) ───────────────────

export interface ExportImageOpts {
  /** Default "image/jpeg" (Q-P3 lock); text cards default to "image/png". */
  format?: "image/jpeg" | "image/png" | "image/webp";
  /** 0..1; default 0.9; only meaningful for jpeg/webp. */
  quality?: number;
  /**
   * What to export.
   * - `"stage"` (default): the whole canvas, or the crop frame while one is
   *   set. Areas the photo does not cover are transparent (JPEG encodes them
   *   black) unless `backgroundColor` / `canvasBackground` fills them.
   * - `"media"`: only the photo's displayed area (intersected with the crop
   *   frame while one is set) — no letterbox. Overlays outside it are cut.
   *
   * Text cards export the whole card: `region` and `backgroundColor` do not
   * apply, and the size options scale the card with its aspect kept (`width`
   * wins over `height`; `maxEdge` still caps the result).
   */
  region?: "stage" | "media";
  /**
   * Output pixels per canvas CSS pixel. Default 2, except for
   * `region: "media"` with no size option, where the default is the photo's
   * own resolution (capped at 4096 px on the longer edge). Ignored when
   * `width` or `height` is given; `maxEdge` caps the size it gives. Every
   * export is also capped at 16.7 million pixels (the iOS canvas limit).
   */
  pixelRatio?: number;
  /**
   * Exact output width / height in pixels. With only one of them the other
   * follows the region's aspect; with both, the region is first trimmed
   * (centred) to that aspect. Wins over `maxEdge` and `pixelRatio`.
   */
  width?: number;
  height?: number;
  /**
   * Upper bound for the longer output edge, in pixels. Applied to the size
   * `pixelRatio` (or its default) would give; never scales up.
   */
  maxEdge?: number;
  /**
   * Fill painted under the canvas content before encoding — any CSS colour,
   * including `var(--token)` (resolved against the editor). Default:
   * `canvasBackground` when set, else none (transparent).
   */
  backgroundColor?: string;
  /** 0..1; fires twice (start, end) for jpeg/png; webp may fire interim. */
  onProgress?: (progress: number) => void;
}

export interface ExportVideoOpts {
  /**
   * Default: the first type in `videoOutput.mimeTypes` this browser can record,
   * else the built-in chain (WebM VP9 → VP8 → MP4).
   */
  mimeType?: string;
  /** Default browser-chosen. */
  bitsPerSecond?: number;
  /** 0..1; fires ~10× during re-encode (or once if perf-shortcut applies). */
  onProgress?: (progress: number) => void;
}

export type ExportOpts = ExportImageOpts | ExportVideoOpts;

export interface ExportMetadata {
  mode: ComposerMode;
  /**
   * Pixel size of the exported blob (photo, text card and video alike). For an
   * unedited video returned as the original file this is the file's own size
   * (from the capture, or read from its metadata); only if that cannot be
   * determined does it fall back to 720 x 1280. Before 0.6.0 photo and text
   * exports reported the on-screen (CSS) size here instead.
   */
  width: number;
  height: number;
  /** Video length. For an unedited video, omitted when it cannot be determined. */
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
  crop?: CropRect;
  /** Text-card content, for a text-mode export. */
  textOnly?: TextOnlyState;
  /**
   * The layout `textOverlays`, `stickers` and `crop` coordinates are in (stage
   * CSS pixels — not the blob's pixels). Whole-stage export: blob x =
   * `x * width / frame.stageWidth`; `region: "media"`: blob x =
   * `(x - frame.media.x) * width / frame.media.width`. Omitted for text-card
   * exports and for a video returned as the original file.
   */
  frame?: StateFrame;
}

// ─── Slot context (NEW — replaces ComposerCtx for editor-only consumers) ─

export interface EditorCtx {
  mode: ComposerMode | null;
  stage: ComposerStage;
  isDirty: boolean;
  /** Content changed since the source loaded (see `MediaEditorHandle.isModified`). */
  isModified: boolean;
  isCapturing: boolean;
  isExporting: boolean;
  activeTool: EditTool | null;
  enabledTools: EditTool[];
  enabledModes: ComposerMode[];
  aspect: AspectRatio;
}

// ─── i18n labels ────────────────────────────────────────────────────────
//
// `MediaEditorLabels` (nested, every group and key optional) is the ONLY typed
// input for the `labels` prop. `MediaEditorResolvedLabels` (flat, fully
// populated) is what the editor hands to its parts and to a capture surface
// after merging the consumer's labels over `DEFAULT_LABELS`. Parameterised
// strings are functions, never templates with placeholders.

/**
 * The flat, fully populated label set the editor hands to its parts and to a
 * capture surface (`MediaCaptureSurfaceProps.labels`). Every key has exactly
 * one nested path in `MediaEditorLabels` (see `lib/normalize-labels.ts`).
 * Consumers pass `MediaEditorLabels`; only a custom capture surface or a
 * direct user of the exported parts reads this shape.
 */
export interface MediaEditorResolvedLabels {
  // shell
  composerLabel: string;
  composerDescription: string;
  back: string;
  apply: string;
  cancel: string;
  backToCapture: string;
  editTools: string;
  // capture surface
  modePhoto: string;
  modeVideo: string;
  modeText: string;
  shutterPhoto: string;
  shutterVideoStart: string;
  shutterVideoStop: string;
  galleryPicker: string;
  switchCamera: string;
  recordingLabel: string;
  connectCamera: string;
  connectHint: string;
  permissionRequesting: string;
  permissionIdleTitle: string;
  permissionIdleBody: string;
  permissionEnable: string;
  permissionDeniedTitle: string;
  permissionDeniedBody: string;
  permissionRetry: string;
  permissionUsePicker: string;
  permissionNoCameraTitle: string;
  permissionErrorTitle: string;
  videoUnsupported: string;
  videoFailed: string;
  /** `ValidationError.message` when `videoOutput.mimeTypes` names no format this browser can record. */
  videoCodecUnavailable: string;
  // toolbar + tools
  toolText: string;
  toolDraw: string;
  toolStickers: string;
  toolFilters: string;
  toolAdjust: string;
  toolCrop: string;
  adjustBrightness: string;
  adjustContrast: string;
  adjustSaturation: string;
  adjustBlur: string;
  drawColor: string;
  drawBrush: string;
  drawEraser: string;
  textPlaceholder: string;
  textFontFamily: string;
  textFontSize: string;
  textAlignLeft: string;
  textAlignCenter: string;
  textAlignRight: string;
  textDelete: string;
  textBackground: string;
  colorHex: string;
  colorSwatch: (color: string) => string;
  cropAspectFree: string;
  cropAspectOriginal: string;
  /** `formatted` is `count` through `Intl.NumberFormat(locale)`. */
  cropAspectCount: (count: number, formatted: string) => string;
  // canvas
  canvasAriaLabel: string;
  resetZoom: string;
  /** `corner` is "NW" | "NE" | "SW" | "SE". */
  resizeHandle: (corner: string) => string;
  // trim bar
  trimStart: string;
  trimEnd: string;
  /** `formatted` is `seconds` through `Intl.NumberFormat(locale)`, one decimal. */
  trimSeconds: (seconds: number, formatted: string) => string;
  // discard guard
  discardConfirmTitle: string;
  discardConfirmBody: string;
  discardConfirm: string;
  discardCancel: string;
  // file intake + validation messages
  intakePrompt: string;
  fileUnknownType: string;
  fileUnsupportedType: (fileType: string) => string;
  /** Sizes are in MB; `*Formatted` are the numbers through `Intl.NumberFormat(locale)`. */
  fileTooLarge: (
    sizeMb: number,
    maxMb: number,
    sizeFormatted: string,
    maxFormatted: string,
  ) => string;
  // empty / error copy
  emptyNoSource: string;
  emptyNoSourceHint: string;
  emptyNoSourceAria: string;
  emptyLoadFailed: string;
  emptyAttempted: string;
  emptyEnabled: string;
  emptyType: string;
  emptyBlank: string;
  emptyNone: string;
  emptyNoCaptureSource: string;
  emptyAspect: string;
  emptySources: string;
}

/** Id -> display-name maps for the built-in (or consumer-supplied) preset data. */
export interface MediaEditorPresetNames {
  /** Text-only background gradients, keyed by `GradientPreset.id`. */
  backgrounds?: Record<string, string>;
  /** Font options, keyed by `FontOption.id`. */
  fonts?: Record<string, string>;
  /** Sticker set tabs, keyed by `StickerSet.id`. */
  stickerSets?: Record<string, string>;
  /** Sticker alt texts, keyed by `StickerOption.id`. */
  stickers?: Record<string, string>;
  /** Filter strip names, keyed by `FilterPreset.id`. */
  filters?: Record<string, string>;
}

/** Nested, fully optional input for the `labels` prop. Anything omitted falls back to `DEFAULT_LABELS`. */
export interface MediaEditorLabels {
  shell?: {
    /** Dialog title (screen-reader only). */
    title?: string;
    /** Dialog description (screen-reader only). */
    description?: string;
    back?: string;
    apply?: string;
    cancel?: string;
    backToCapture?: string;
    /** Accessible name of the edit-tools toolbar. */
    editTools?: string;
  };
  capture?: {
    requestingCamera?: string;
    /** Shown before the camera is enabled. */
    cameraIdle?: { title?: string; body?: string; enableCta?: string };
    cameraDenied?: {
      title?: string;
      body?: string;
      retryCta?: string;
      useGalleryCta?: string;
    };
    noCameraTitle?: string;
    cameraErrorTitle?: string;
    galleryButton?: string;
    switchCamera?: string;
    modes?: { photo?: string; video?: string; text?: string };
    shutter?: { photo?: string; videoStart?: string; videoStop?: string };
    recording?: string;
    connectCta?: string;
    connectHint?: string;
    /** Messages for `ValidationError.message` raised by the camera. */
    errors?: {
      videoUnsupported?: string;
      videoFailed?: string;
      videoCodecUnavailable?: string;
    };
  };
  toolbar?: {
    text?: string;
    draw?: string;
    stickers?: string;
    filters?: string;
    adjust?: string;
    crop?: string;
  };
  adjust?: {
    brightness?: string;
    contrast?: string;
    saturation?: string;
    blur?: string;
  };
  draw?: { color?: string; brushSize?: string; eraser?: string };
  text?: {
    placeholder?: string;
    fontFamily?: string;
    fontSize?: string;
    alignLeft?: string;
    alignCenter?: string;
    alignRight?: string;
    delete?: string;
    /** Text-only mode background picker button. */
    background?: string;
  };
  color?: {
    hex?: string;
    swatch?: (color: string) => string;
  };
  crop?: {
    free?: string;
    /** Chip name for the `"original"` crop aspect (the photo's own ratio). */
    original?: string;
    aspectCount?: (count: number, formatted: string) => string;
  };
  canvas?: {
    label?: string;
    resetZoom?: string;
    resizeHandle?: (corner: string) => string;
  };
  /**
   * Labels for the exported `VideoTrimBar`.
   *
   * @notImplemented `<MediaEditor>` does not mount the trim bar; these keys
   * reach only an exported `VideoTrimBar` you mount yourself, through its
   * `labels` prop. Passing them to `<MediaEditor labels>` has no effect (and
   * warns once in development).
   */
  trim?: {
    start?: string;
    end?: string;
    seconds?: (seconds: number, formatted: string) => string;
  };
  discard?: {
    title?: string;
    body?: string;
    cancel?: string;
    confirm?: string;
  };
  intake?: {
    prompt?: string;
    unknownType?: string;
    unsupportedType?: (fileType: string) => string;
    fileTooLarge?: (
      sizeMb: number,
      maxMb: number,
      sizeFormatted: string,
      maxFormatted: string,
    ) => string;
  };
  /** The editor's own empty / error copy (rendered when no `renderEmpty` slot replaces it). */
  empty?: {
    noSource?: string;
    noSourceHint?: string;
    noSourceAria?: string;
    loadFailed?: string;
    attempted?: string;
    enabled?: string;
    type?: string;
    blank?: string;
    none?: string;
    noCaptureSource?: string;
    aspect?: string;
    sources?: string;
  };
  /** Display names for preset data (id -> name). Falls back to each preset's own label. */
  presets?: MediaEditorPresetNames;
}

type DeepRequired<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
    : T;

/** Fully populated nested defaults (every string the editor renders). `presets` has no defaults. */
export type MediaEditorDefaultLabels = Omit<DeepRequired<MediaEditorLabels>, "presets">;

// ─── Public component props ─────────────────────────────────────────────

export interface MediaEditorProps {
  // === Capability surface (the "partial use" dials, plan-locked defaults) ===
  /** Which capture modes are available. Default ["photo","video","text"] (Q-P2). Empty array + initialSource = edit-only mode. */
  enabledModes?: ComposerMode[];
  /** Which edit tools appear in the toolbar. Default all 6. */
  enabledTools?: EditTool[];
  /** Which source intake methods are offered. Default ["camera","upload"]. "library" deferred. */
  mediaSources?: MediaSource[];
  /** Aspect lock for the editor canvas. Default "free" (Q-P1). */
  aspect?: AspectRatio;

  // === Initial source (skip capture surface) ===
  initialSource?: InitialSource;
  onInitialSourceError?: (error: SourceError) => void;

  // === Presentation ===
  /** "inline" | "dialog" | "auto". Default "auto" — picks dialog if enabledModes non-empty, else inline. */
  presentation?: "inline" | "dialog" | "auto";
  /** Required when presentation resolves to "dialog". Dev-error if missing. */
  isOpen?: boolean;
  /** Required when presentation resolves to "dialog". */
  onClose?: () => void;
  /**
   * Extra classes for the dialog's content element (dialog presentation only),
   * merged after the editor's own.
   */
  dialogClassName?: string;
  /**
   * CSS colour shown behind the photo on the canvas. When set, image exports
   * are filled with it too (an export's `backgroundColor` still wins), so the
   * preview matches what is exported. Default: black on screen, no fill in the
   * export (transparent; JPEG encodes it black).
   */
  canvasBackground?: string;

  // === Capture extension (P3 S3 — install @ilinxa/media-editor-capture) ===
  /**
   * Enables camera capture. Install `@ilinxa/media-editor-capture` and pass
   * its `mediaCapture` export straight through:
   * `<MediaEditor capture={mediaCapture} />`. Without it, `"camera"` in
   * `mediaSources` falls back to the base file/gallery intake surface (one
   * dev console.warn) — base-alone stays fully usable (pick a file → edit →
   * export), it just can't drive a live camera.
   */
  capture?: MediaCaptureExtension;

  // === Capture config (only meaningful if enabledModes overlaps capture modes) ===
  defaultMode?: ComposerMode;
  defaultFacing?: "user" | "environment";
  /** Default 30s. */
  maxVideoDuration?: number;
  /** Default true. */
  recordAudio?: boolean;
  /** Default 50MB. */
  maxFileSizeMb?: number;
  onValidationError?: (error: ValidationError) => void;
  onPermissionDenied?: () => void;

  // === Intake + output formats ===
  /**
   * MIME types the editor accepts, for both file pickers (base and capture)
   * and the file validator. MIME types only (wildcards like `video/*` allowed),
   * not file extensions; `initialSource` is not validated against it.
   * Default `["image/*", "video/*"]`.
   */
  acceptMediaTypes?: string[];
  /**
   * Allowed video output formats, for re-encoding and camera recording.
   * `mimeTypes` is an allow-list in order of preference (for example
   * `["video/mp4"]`); entries are exact MIME types (no wildcards). When the browser can record none of them, the video
   * mode is hidden and `onValidationError` fires once. Default: the built-in
   * chain (WebM VP9 → WebM VP8 → MP4). An unedited video is passed through
   * as the original file either way.
   */
  videoOutput?: { mimeTypes?: string[] };

  // === Edit-tool config ===
  stickers?: StickerSet[];
  replaceBuiltinStickers?: boolean;
  fonts?: FontOption[];
  colorPresets?: string[];
  filterPresets?: FilterPreset[];
  replaceBuiltinFilters?: boolean;
  /**
   * Overrides default crop choices. Default derivation: if aspect !== "free" →
   * [aspect]; else all 5. Accepts `"original"` (the photo's own ratio) and
   * `"W:H"` strings; invalid entries are dropped with a dev warning. Crop
   * frames are laid out on, and clamped to, the photo's displayed area.
   */
  cropAspects?: CropAspect[];

  // === Discard guard ===
  /** Default true. Dialog mode only — fires on Escape/backdrop click/programmatic close() when modified (see `isModified`) or when the media came from the camera or the file picker in this session (a capture is not re-loadable). Inline mode ignores (consumer owns navigation guarding via getIsDirty() handle). */
  confirmOnDiscard?: boolean;

  // === Localization ===
  /**
   * Nested, fully optional `MediaEditorLabels`. Anything omitted falls back to
   * `DEFAULT_LABELS`. Flat `MediaEditorResolvedLabels` keys are still accepted
   * at runtime (deprecated; they win over nested on conflict) — use
   * `editorLabelsFromFlat` to convert a flat object to the nested shape.
   */
  labels?: MediaEditorLabels;
  /**
   * BCP 47 locale tag used to format the numbers the editor shows (trim
   * seconds, crop-aspect count, adjust values). Default `"en"`; an invalid tag
   * falls back to `"en"`.
   * Pass it explicitly for output that is identical on server and client.
   */
  locale?: string;

  // === State change observability ===
  /** Fires whenever the active capture mode changes (tab switch, gallery pick,
   *  initialSource load, programmatic). Skips the initial mount. */
  onModeChange?: (mode: ComposerMode | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /**
   * Analytics/undo-sync hook. Emits navigation + lifecycle actions
   * (`mode-change`, `tool-open`, `tool-close`, `reset`) and one action per
   * committed content change (`text-add`, `text-update`, `text-remove`,
   * `sticker-add`, `sticker-remove`, `draw-stroke`, `filter-apply`,
   * `adjust-change`, `crop-set`): drag / transform / stroke end, each text
   * or style edit, and `adjust-change` once a slider has been still for
   * 250 ms (flushed early by an export). Back on a tool panel emits
   * `text-remove` / `sticker-remove` for items added since the tool opened.
   * Loading a source emits none of them. `undo` / `redo` are not emitted (the
   * editor has no undo stack).
   */
  onEditAction?: (action: EditAction) => void;

  // === Slots (escape hatches) ===
  renderTopBar?: (ctx: EditorCtx) => ReactNode;
  renderBottomToolbar?: (ctx: EditorCtx) => ReactNode;
  renderPermissionDenied?: (ctx: {
    retry: () => void;
    usePicker: () => void;
  }) => ReactNode;
  renderEmpty?: () => ReactNode;

  /**
   * Rendered as the last child of the editor surface (above the editor
   * content). In dialog presentation it renders inside the dialog content, so
   * controls in the overlay are interactive despite the modal. Position it
   * `absolute inset-0` with `z-40` or higher (editor chrome uses up to `z-30`).
   *
   * While it renders something, the rest of the editor is `inert`, and focus
   * moves to its first focusable element (or to the overlay itself when it has
   * none) and back to the control that held it when the overlay unmounts. In a
   * dialog, Escape / backdrop presses do not close the dialog or open the
   * discard confirm while the overlay is mounted — the overlay owns
   * interaction. `null`, `undefined`, booleans and `""` render nothing and
   * leave the editor interactive (`0` renders "0", so it counts as an overlay).
   */
  overlay?: ReactNode;
}

// ─── Imperative handle (LOCKED in description §7) ──────────────────────

export interface LoadStateOpts {
  /**
   * The blob backing `state.imageSrc` (photo path). A persisted snapshot's
   * `imageSrc` is typically a dead object URL (revoked when the capturing
   * editor instance unmounted) — when `sourceBlob` is provided, `loadState`
   * re-mints a fresh object URL from it instead of trusting `imageSrc`, and
   * rebuilds the internal draft so the edit tools work as they did pre-unmount.
   * Obtain it from `getSourceBlob()` at snapshot time. (Review 1.3.)
   */
  sourceBlob?: Blob | null;
  /**
   * Keep the current `isModified()` value instead of clearing it. For a
   * round-trip of the editor's own state (`loadState({ ...getState(), mode })`)
   * that is not a new source. Default false.
   */
  keepModified?: boolean;
}

export interface MediaEditorHandle {
  // === Inspect ===
  /** True iff the user has captured OR loaded OR edited something. Capture without edit IS dirty. */
  getIsDirty: () => boolean;
  /**
   * True once content changed relative to the loaded source — the
   * `initialSource`, a `loadState`, or a capture / gallery pick. Loading alone
   * is not a modification (unlike `getIsDirty`). The dialog's discard confirm
   * uses it.
   */
  isModified: () => boolean;
  /**
   * True when the canvas shows the current source: no source load (incl.
   * `initialSource`), crop Apply or `loadState` swap, or overlay remap is in
   * flight.
   */
  isSettled: () => boolean;
  /**
   * Resolves once the canvas shows the current source and the overlays have
   * been moved onto it (after a crop Apply or `loadState`); rejects when the
   * source fails to load, the editor unmounts, or `timeoutMs` (default 10000)
   * passes. `exportImage` awaits it, and rejects instead of exporting a blank
   * canvas.
   */
  whenSettled: (opts?: { timeoutMs?: number }) => Promise<void>;
  getMode: () => ComposerMode | null;
  /** Serializable snapshot — for draft persistence. */
  getState: () => MediaEditorState;
  loadState: (state: MediaEditorState, opts?: LoadStateOpts) => void;
  /**
   * Blob backing the current photo draft / canvas image — persist it alongside
   * `getState()` so a later `loadState(state, { sourceBlob })` can
   * re-materialize the (revoked) object URL. Null when nothing is loaded, or
   * in video mode (persist `getState().videoBlob` instead).
   */
  getSourceBlob: () => Blob | null;

  // === Capture (imperative capture is not implemented — each method dev-warns and does nothing; drive capture via the in-UI controls) ===
  /** @notImplemented Dev-warns and does nothing. Use the in-UI camera controls. */
  switchCamera: () => Promise<void>;
  /** @notImplemented Dev-warns and does nothing. Use the in-UI camera controls. */
  takePhoto: () => Promise<void>;
  /** @notImplemented Dev-warns and does nothing. Use the in-UI camera controls. */
  startRecording: () => Promise<void>;
  /** @notImplemented Dev-warns and does nothing. Use the in-UI camera controls. */
  stopRecording: () => Promise<void>;
  /** @notImplemented Dev-warns and does nothing. Use the in-UI gallery button. */
  importFromGallery: () => void;

  // === Edit ===
  /**
   * `addText(text)` sets the text content. The no-argument form is not
   * implemented.
   *
   * @notImplemented `addText()` with no argument dev-warns and does nothing;
   * pass the text instead.
   */
  addText: (text?: string) => void;
  addSticker: (sticker: StickerOption) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  applyFilter: (name: string | null) => void;
  clearLayer: (layer: "drawing" | "stickers" | "text") => void;
  /** @notImplemented Dev-warns and does nothing — no mutations are recorded as commands. */
  undo: () => void;
  /** @notImplemented Dev-warns and does nothing — no mutations are recorded as commands. */
  redo: () => void;

  // === Export ===
  exportImage: (
    opts?: ExportImageOpts,
  ) => Promise<{ blob: Blob; metadata: ExportMetadata }>;
  exportVideo: (
    opts?: ExportVideoOpts,
  ) => Promise<{ blob: Blob; metadata: ExportMetadata }>;
  /** Polymorphic — picks exportImage or exportVideo based on current mode. */
  export: (
    opts?: ExportOpts,
  ) => Promise<{ blob: Blob; metadata: ExportMetadata }>;

  // === Lifecycle ===
  reset: () => void;
  /**
   * Dialog mode is controlled by the consumer, so the handle cannot open the
   * editor; inline mode has nothing to open.
   *
   * @notImplemented Dev-warns and does nothing. Set `isOpen` on the component instead.
   */
  open: () => void;
  /**
   * Dialog mode only — no-op in inline. Asks to close (the discard confirm
   * shows when modified); the host closes by setting `isOpen` false in
   * `onClose`. Focus returns to the element that opened the editor on close
   * and when the editor unmounts while holding focus.
   */
  close: () => void;
}

// ─── Default labels ─────────────────────────────────────────────────────
// Single source of the English strings: the editor's runtime fallback is
// derived from this object (`resolveEditorLabels` in lib/normalize-labels.ts).

export const DEFAULT_LABELS: MediaEditorDefaultLabels = {
  shell: {
    title: "Media editor",
    description: "Capture a photo, record a video, or compose text-only content.",
    back: "Back",
    apply: "Apply",
    cancel: "Cancel",
    backToCapture: "Back to capture",
    editTools: "Edit tools",
  },
  capture: {
    requestingCamera: "Requesting camera…",
    cameraIdle: {
      title: "Camera ready",
      body: "Tap below to enable your camera, or pick a file from the gallery.",
      enableCta: "Enable camera",
    },
    cameraDenied: {
      title: "Camera access blocked",
      body: "We need camera permission to capture media. Enable it in your browser settings, or pick a file from your gallery.",
      retryCta: "Try again",
      useGalleryCta: "Use gallery instead",
    },
    noCameraTitle: "No camera available",
    cameraErrorTitle: "Camera unavailable",
    galleryButton: "Choose from gallery",
    switchCamera: "Switch camera",
    modes: { photo: "Photo", video: "Video", text: "Text" },
    shutter: {
      photo: "Take photo",
      videoStart: "Start recording",
      videoStop: "Stop recording",
    },
    recording: "Recording",
    connectCta: "Connect to camera",
    connectHint: "Pick a mode above, or jump straight to the camera.",
    errors: {
      videoUnsupported: "Video recording is not supported here",
      videoFailed: "Video recording failed",
      videoCodecUnavailable:
        "None of the allowed video formats can be recorded in this browser",
    },
  },
  toolbar: {
    text: "Text",
    draw: "Draw",
    stickers: "Stickers",
    filters: "Filters",
    adjust: "Adjust",
    crop: "Crop",
  },
  adjust: {
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    blur: "Blur",
  },
  draw: { color: "Color", brushSize: "Brush size", eraser: "Eraser" },
  text: {
    placeholder: "Type something…",
    fontFamily: "Font",
    fontSize: "Size",
    alignLeft: "Align left",
    alignCenter: "Align center",
    alignRight: "Align right",
    delete: "Delete text",
    background: "Background",
  },
  color: {
    hex: "Hex",
    swatch: (color) => `Color ${color}`,
  },
  crop: {
    free: "free",
    original: "original",
    aspectCount: (_count, formatted) => `(${formatted} crop aspects)`,
  },
  canvas: {
    label: "Media editor canvas — arrow keys pan, +/- zoom, 0 resets",
    resetZoom: "Reset zoom",
    resizeHandle: (corner) => `Resize ${corner}`,
  },
  trim: {
    start: "Trim start",
    end: "Trim end",
    seconds: (_seconds, formatted) => `${formatted}s`,
  },
  discard: {
    title: "Discard?",
    body: "You'll lose your captured media and edits.",
    cancel: "Keep editing",
    confirm: "Discard",
  },
  intake: {
    prompt: "Pick a photo or video from your device.",
    unknownType: "unknown",
    unsupportedType: (fileType) => `Unsupported file type: ${fileType}`,
    fileTooLarge: (_sizeMb, _maxMb, sizeFormatted, maxFormatted) =>
      `File is ${sizeFormatted} MB — maximum is ${maxFormatted} MB`,
  },
  empty: {
    noSource: "No source provided",
    noSourceHint: "Pass initialSource or enable a capture mode in enabledModes.",
    noSourceAria:
      "Media editor: no source provided. Pass initialSource or enable a capture mode.",
    loadFailed: "Couldn't load source",
    attempted: "attempted",
    enabled: "enabled",
    type: "type",
    blank: "(blank)",
    none: "(none)",
    noCaptureSource: "No capture source available",
    aspect: "aspect:",
    sources: "sources:",
  },
};
