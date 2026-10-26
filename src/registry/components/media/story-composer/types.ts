import type { ReactNode } from "react";
import type {
  AspectRatio,
  MediaCaptureExtension,
  MediaEditorLabels,
  MediaSource,
  StateFrame,
  TextOnlyState,
} from "../media-editor";
export type { AspectRatio };

// ─── Modes + stage ──────────────────────────────────────────────────────

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

// AspectRatio moved to media-editor in v0.2.0 (added "16:9" as additive
// non-breaking extension — narrowing-style consumers unaffected).
// Imported here so this types.ts can reference AspectRatio internally + re-exports it.

export type EditTool =
  | "text"
  | "draw"
  | "stickers"
  | "filters"
  | "adjust"
  | "crop";

// ─── Publish ────────────────────────────────────────────────────────────

export interface PublishMetadata {
  mode: ComposerMode;
  /** Pixel size of the published blob. */
  width: number;
  height: number;
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
  /**
   * The layout `textOverlays` / `stickers` coordinates are in — editor stage
   * CSS pixels, not the blob's pixels. Map a point with
   * `x * width / frame.stageWidth` for a whole-stage export.
   */
  frame?: StateFrame;
  /** Text-card content, for a text-mode story. */
  textOnly?: TextOnlyState;
}

export interface PublishResult {
  url: string;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface PublishedStoryItem {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface PublishedStory {
  id: string;
  createdAt: string;
  items: PublishedStoryItem[];
}

/**
 * Fields collected on the publish details step: the first-class `caption`
 * plus anything the host adds through `renderPublishFields`. Handed to the
 * uploader as its third argument and appended to the default upload's FormData.
 *
 * FormData rules of the default upload: strings are sent as-is (an empty-string
 * caption IS sent), other values are `JSON.stringify`-ed, and `null` /
 * `undefined` values are skipped. A field named `file`, `metadata` or any
 * `uploadFields` key would overwrite a reserved/host entry, so it is skipped
 * with a one-time dev warning. A custom `uploader` receives the object untouched.
 */
export type PublishFields = { caption?: string } & Record<string, unknown>;

/**
 * Phase of the publish flow, as seen by `renderPublishFields` / `renderPublishingOverlay`.
 *
 * Lifecycle: `idle` -> `compositing` -> `uploading` -> `done` (success) or `error`.
 * `done` is transient: it announces `labels.published` and settles back to `idle`
 * when the composer is reopened (`isOpen` false -> true) or the details step is
 * next opened, whichever comes first. Closing (`isOpen` false), `reset()` and
 * Cancel return to `idle` (a pending `done` survives the close so the
 * announcement is not cut off).
 */
export type PublishStatus =
  | "idle"
  | "compositing"
  | "uploading"
  | "done"
  | "error";

// ─── Slot context ───────────────────────────────────────────────────────

export interface ComposerCtx {
  mode: ComposerMode;
  stage: ComposerStage;
  isDirty: boolean;
  publishing: { active: boolean; progress: number };
  setMode: (m: ComposerMode) => void;
  cancel: () => void;
  /**
   * Start publishing. With a details step configured (`caption` /
   * `renderPublishFields`) and not open, it OPENS the step instead. Ignored
   * while a publish is already running. When the caption rules / `canPublish`
   * block it, it warns once in development and resolves without publishing.
   */
  publish: () => Promise<void>;
  /** Open the details step (for a custom `renderTopBar`). Warns in development when none is configured. */
  openDetails: () => void;
}

// ─── Uploader ───────────────────────────────────────────────────────────

export type Uploader = (
  blob: Blob,
  metadata: PublishMetadata,
  /** Caption + host fields from the details step (`{}` when none are configured). */
  fields?: PublishFields,
) => Promise<PublishResult>;

// ─── i18n labels ────────────────────────────────────────────────────────

export interface StoryComposerLabels {
  composerLabel?: string;
  composerDescription?: string;

  modePhoto?: string;
  modeVideo?: string;
  modeText?: string;

  shutterPhoto?: string;
  shutterVideoStart?: string;
  shutterVideoStop?: string;

  galleryPicker?: string;
  switchCamera?: string;

  permissionDeniedTitle?: string;
  permissionDeniedBody?: string;
  permissionRetry?: string;
  permissionUsePicker?: string;
  permissionRequesting?: string;

  toolText?: string;
  toolDraw?: string;
  toolStickers?: string;
  toolFilters?: string;
  toolAdjust?: string;
  toolCrop?: string;

  adjustBrightness?: string;
  adjustContrast?: string;
  adjustSaturation?: string;
  adjustBlur?: string;

  drawColor?: string;
  drawBrush?: string;
  drawEraser?: string;

  textPlaceholder?: string;
  textFontFamily?: string;
  textFontSize?: string;

  publish?: string;
  publishing?: string;
  published?: string;
  close?: string;

  discardConfirmTitle?: string;
  discardConfirmBody?: string;
  discardConfirm?: string;
  discardCancel?: string;

  uploadFailedTitle?: string;
  uploadFailedBody?: string;
  uploadRetry?: string;
  /** Cancel in the upload-error state (returns to the editor, draft intact). */
  uploadCancel?: string;
  /** Default-uploader error messages (reach `onPublishError` and `getErrorMessage`). */
  uploadErrorNoDestination?: string;
  uploadErrorHttp?: (status: number) => string;
  uploadErrorNetwork?: string;
  uploadErrorBadResponse?: string;
  /**
   * Message of the `AbortError` a cancelled default upload rejects with. The
   * component swallows that rejection by design (Cancel is not a failure), so it
   * never reaches `onPublishError`; it is visible only to `useImageUploader`
   * callers and to a custom flow that does not treat `AbortError` as a cancel.
   */
  uploadCancelled?: string;

  /** Details step (shown when `caption` or `renderPublishFields` is set). */
  detailsTitle?: string;
  detailsBack?: string;
  captionLabel?: string;
  captionPlaceholder?: string;
  /** Counter text; receives locale-formatted numbers. */
  captionCounter?: (count: string, max: string) => string;
  /** Reason shown (and read out) while Publish is disabled because a required caption is empty. */
  captionRequired?: string;
  /** Reason shown while Publish is disabled because the caption is over `maxLength`; receives the locale-formatted max. */
  captionTooLong?: (max: string) => string;

  recordingLabel?: string;

  /**
   * Nested media-editor labels, passed straight through. Story-composer's flat
   * editor keys above win on conflict.
   */
  editor?: MediaEditorLabels;
}

/** Every flat label key resolved (the nested `editor` group is optional pass-through). */
export type ResolvedStoryComposerLabels = Required<Omit<StoryComposerLabels, "editor">>;

export const DEFAULT_STORY_COMPOSER_LABELS: ResolvedStoryComposerLabels = {
  composerLabel: "Media editor",
  composerDescription:
    "Capture a photo, record a video, or compose text-only content.",

  modePhoto: "Photo",
  modeVideo: "Video",
  modeText: "Text",

  shutterPhoto: "Take photo",
  shutterVideoStart: "Start recording",
  shutterVideoStop: "Stop recording",

  galleryPicker: "Choose from gallery",
  switchCamera: "Switch camera",

  permissionDeniedTitle: "Camera access blocked",
  permissionDeniedBody:
    "We need camera permission to capture media. Enable it in your browser settings, or pick a file from your gallery.",
  permissionRetry: "Try again",
  permissionUsePicker: "Use gallery instead",
  permissionRequesting: "Requesting camera…",

  toolText: "Text",
  toolDraw: "Draw",
  toolStickers: "Stickers",
  toolFilters: "Filters",
  toolAdjust: "Adjust",
  toolCrop: "Crop",

  adjustBrightness: "Brightness",
  adjustContrast: "Contrast",
  adjustSaturation: "Saturation",
  adjustBlur: "Blur",

  drawColor: "Color",
  drawBrush: "Brush size",
  drawEraser: "Eraser",

  textPlaceholder: "Type something…",
  textFontFamily: "Font",
  textFontSize: "Size",

  publish: "Publish",
  publishing: "Publishing…",
  published: "Published",
  close: "Close",

  discardConfirmTitle: "Discard?",
  discardConfirmBody:
    "You'll lose your captured media and edits.",
  discardConfirm: "Discard",
  discardCancel: "Keep editing",

  uploadFailedTitle: "Upload failed",
  uploadFailedBody: "Something went wrong while publishing. Your story is still here.",
  uploadRetry: "Try again",
  uploadCancel: "Cancel",
  uploadErrorNoDestination: "story-composer: pass `uploadUrl` or `uploader` to publish.",
  uploadErrorHttp: (status) => `Upload failed (HTTP ${status})`,
  uploadErrorNetwork: "Upload network error",
  uploadErrorBadResponse: "Upload response was not JSON",
  uploadCancelled: "Upload cancelled",

  detailsTitle: "Add details",
  detailsBack: "Back",
  captionLabel: "Caption",
  captionPlaceholder: "Write a caption…",
  captionCounter: (count, max) => `${count} / ${max}`,
  captionRequired: "Add a caption to publish",
  captionTooLong: (max) => `Caption is too long (max ${max})`,

  recordingLabel: "Recording",

};

// ─── Public component props ─────────────────────────────────────────────

export interface StoryComposerProps {
  // Display
  isOpen: boolean;
  onClose: () => void;

  // Publish destination
  uploadUrl?: string;
  uploader?: Uploader;
  uploadFields?: Record<string, string>;
  /**
   * Called when publishing completes. `result` is the uploader's resolved value,
   * untouched (server ids, extra fields …). One-argument handlers keep working.
   */
  onPublished: (story: PublishedStory, result: PublishResult) => void;
  onPublishError?: (error: Error) => void;
  /** Message shown in the upload-error overlay. Default: `labels.uploadFailedBody`. */
  getErrorMessage?: (error: Error) => string;

  // Publish details
  /**
   * First-class caption field. Setting it makes Publish open a details step
   * (caption + `renderPublishFields` + Back / Publish) instead of publishing in one tap.
   */
  caption?: { maxLength?: number; required?: boolean; placeholder?: string };
  /** Host fields on the details step. Setting it also enables the details step. */
  renderPublishFields?: (ctx: {
    value: PublishFields;
    onChange: (next: PublishFields) => void;
    status: PublishStatus;
  }) => ReactNode;
  /** Controlled publish fields. When defined it wins on every render. */
  publishFields?: PublishFields;
  onPublishFieldsChange?: (next: PublishFields) => void;
  /**
   * Extra gate for Publish (details step, or the top bar when there is no details
   * step). Combined with the caption rules (`required`, `maxLength`) — both must pass.
   */
  canPublish?: (fields: PublishFields) => boolean;

  // Capture
  /**
   * Camera + recording extension. Omit it for an upload-only composer (the
   * default). To keep the camera, install `@ilinxa/media-editor-capture` and pass
   * `capture={mediaCapture}`.
   */
  capture?: MediaCaptureExtension;
  /** Intake sources. Default `["camera","upload"]` when `capture` is given, else `["upload"]`. */
  sources?: MediaSource[];
  /** MIME types the editor accepts (forwarded to media-editor). */
  acceptMediaTypes?: string[];
  /** Allowed video output formats (forwarded to media-editor). */
  videoOutput?: { mimeTypes?: string[] };
  /** BCP-47 locale for number formatting (progress %, caption counter); forwarded to media-editor. */
  locale?: string;
  defaultMode?: ComposerMode;
  hideModes?: ComposerMode[];
  defaultFacing?: "user" | "environment";
  maxVideoDuration?: number;
  recordAudio?: boolean;
  maxFileSizeMb?: number;
  onValidationError?: (error: ValidationError) => void;

  // Edit tools
  stickers?: StickerSet[];
  replaceBuiltinStickers?: boolean;
  fonts?: FontOption[];
  colorPresets?: string[];
  filterPresets?: FilterPreset[];
  replaceBuiltinFilters?: boolean;
  enabledTools?: EditTool[];

  // Layout + behavior
  cropAspects?: AspectRatio[];
  presentation?: "auto" | "fullscreen" | "modal";
  /**
   * @notImplemented Declared since v0.1 and never applied — StoryComposer
   * renders `MediaEditor` directly, so it has no surface of its own to paint,
   * and MediaEditor exposes no background prop to forward to. Passing it warns
   * in development. Style the editor from your own layout instead.
   */
  editorBackground?: string;
  confirmOnDiscard?: boolean;

  // Localization
  labels?: Partial<StoryComposerLabels>;

  // Permissions
  onPermissionDenied?: () => void;

  // Slots
  renderTopBar?: (ctx: ComposerCtx) => ReactNode;
  renderBottomToolbar?: (ctx: ComposerCtx) => ReactNode;
  renderPermissionDenied?: (ctx: {
    retry: () => void;
    usePicker: () => void;
  }) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderPublishingOverlay?: (ctx: {
    progress: number;
    mode: ComposerMode;
    status: PublishStatus;
    /** The failure, when `status` is "error". */
    error: Error | null;
    retry: () => void;
    /** Dismiss the overlay and return to the editor (draft intact). */
    cancel: () => void;
  }) => ReactNode;
}

// ─── Imperative handle ──────────────────────────────────────────────────

export interface StoryComposerHandle {
  // Lifecycle
  open: () => void;
  close: () => void;
  reset: () => void;
  // Capture
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  importFromGallery: () => void;
  // Edit
  addText: (text?: string) => void;
  addSticker: (sticker: StickerOption) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  applyFilter: (name: string | null) => void;
  // Publish
  publish: () => Promise<void>;
  exportBlob: () => Promise<{ blob: Blob; metadata: PublishMetadata }>;
}
