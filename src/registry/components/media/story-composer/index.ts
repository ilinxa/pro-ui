// ─── Main component ────────────────────────────────────────────────────

export { StoryComposer } from "./story-composer";

// ─── Types ─────────────────────────────────────────────────────────────

export type {
  StoryComposerProps,
  StoryComposerHandle,
  StoryComposerLabels,
  ComposerMode,
  ComposerStage,
  ComposerCtx,
  ValidationError,
  StickerOption,
  StickerSet,
  FontOption,
  FilterPreset,
  KonvaFilterSpec,
  ImageAdjustments,
  TextOverlay,
  PlacedSticker,
  DrawingStroke,
  AspectRatio,
  EditTool,
  PublishMetadata,
  PublishResult,
  PublishedStory,
  PublishedStoryItem,
  Uploader,
} from "./types";

export {
  DEFAULT_STORY_COMPOSER_LABELS,
  DEFAULT_ADJUSTMENTS,
} from "./types";

// ─── Exported sealed-folder parts ──────────────────────────────────────

// ComposerPublishBar STAYS in story-composer (story-shaped publish UI).
export { ComposerPublishBar } from "./parts/composer-publish-bar";
export type { ComposerPublishBarProps } from "./parts/composer-publish-bar";

// v0.1.5 ComposerCamera/ComposerEditor/ComposerToolbar/ColorSwatchPicker
// backward-compat aliases (+ their Props types). Unlike the useMediaCapture
// band (explicitly scheduled and removed at v0.3.0+), THIS band carried a bare
// @deprecated with no removal version, and the v0.1.5 export contract snapshot
// says these names must still resolve — so they stay, now with a real
// schedule. R4 restoration (2026-08-11): removal announced for v0.5.0.
// `EditorCamera` lives in the capture feature slice since the P3 split.
/** @deprecated since v0.2.0 — import from `@ilinxa/media-editor` / `@ilinxa/media-editor-capture` instead. REMOVED in v0.5.0. */
export { EditorCamera as ComposerCamera } from "../media-editor/features/capture";
/** @deprecated since v0.2.0 — import `EditorCanvas` from `@ilinxa/media-editor` instead. REMOVED in v0.5.0. */
export {
  EditorCanvas as ComposerEditor,
  EditorToolbar as ComposerToolbar,
  ColorSwatchPicker,
} from "../media-editor";
/** @deprecated since v0.2.0 — import the `Editor*Props` types from `@ilinxa/media-editor` / `@ilinxa/media-editor-capture` instead. REMOVED in v0.5.0. */
export type {
  EditorCanvasProps as ComposerEditorProps,
  EditorToolbarProps as ComposerToolbarProps,
  ColorSwatchPickerProps,
} from "../media-editor";
export type { EditorCameraProps as ComposerCameraProps } from "../media-editor/features/capture";

// ─── Exported hooks (plan §10) ─────────────────────────────────────────

export {
  useStoryComposerState,
  type UseStoryComposerStateOptions,
  type UseStoryComposerStateResult,
} from "./hooks/use-story-composer-state";

// useMediaCapture/CapturedPhoto/CapturedVideo/etc. v0.1.5 backward-compat
// re-exports — REMOVED at v0.4.0 per the v0.2.0 @deprecated schedule.
// `useMediaCapture` moved again in P3 S3: import from
// `@ilinxa/media-editor-capture`. `validateGalleryFile` stayed on
// `@ilinxa/media-editor` (generic file-intake).

export {
  useImageUploader,
  type UseImageUploaderOptions,
  type UseImageUploaderResult,
  type UploadStatus,
} from "./hooks/use-image-uploader";

// ─── Lib helpers ───────────────────────────────────────────────────────
// All lib helpers moved to media-editor in v0.2.0.
// @deprecated import from "@ilinxa/media-editor" — removed in v0.3.0.

export {
  resolveFilterPresets,
  BUILT_IN_FILTER_PRESETS,
  resolveStickerSets,
  BUILT_IN_STICKER_SETS,
  exportPhotoBlob,
  exportTextOnlyBlob,
  type ExportPhotoOptions,
  compositeVideo,
  type CompositeVideoOptions,
  type CompositeVideoResult,
  selectRecorderMime,
  containerFor,
  PREFERRED_RECORDER_MIME_TYPES,
  type RecorderMimeType,
} from "../media-editor";

// ─── Default tokens ────────────────────────────────────────────────────
// Moved to media-editor/lib/defaults.ts in v0.2.0.
// @deprecated import from "@ilinxa/media-editor" — removed in v0.3.0.

export {
  DEFAULT_TEXT_GRADIENTS,
  DEFAULT_FONTS,
  DEFAULT_COLOR_PRESETS,
  type GradientPreset,
} from "../media-editor";

// ─── Crop helpers (CropRect type lives here; helper functions too) ─────

// Crop helpers moved with tool-crop-overlay to media-editor in v0.2.0.
// @deprecated import from "@ilinxa/media-editor" — removed in v0.3.0.
export {
  fitCropToStage,
  ASPECT_RATIO_VALUES,
  type CropRect,
} from "../media-editor";
