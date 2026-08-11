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

// 3 parts moved + renamed in v0.2.0; backward-compat aliases preserve v0.1.5 names.
// @deprecated import EditorCamera/EditorCanvas/EditorToolbar from "@ilinxa/media-editor".
export {
  EditorCamera as ComposerCamera,
  EditorCanvas as ComposerEditor,
  EditorToolbar as ComposerToolbar,
  ColorSwatchPicker,
} from "../media-editor";

// Props types for the renamed parts — also re-exported under old names.
export type {
  EditorCameraProps as ComposerCameraProps,
  EditorCanvasProps as ComposerEditorProps,
  EditorToolbarProps as ComposerToolbarProps,
  ColorSwatchPickerProps,
} from "../media-editor";

// ─── Exported hooks (plan §10) ─────────────────────────────────────────

export {
  useStoryComposerState,
  type UseStoryComposerStateOptions,
  type UseStoryComposerStateResult,
} from "./hooks/use-story-composer-state";

// Re-exports — useMediaCapture + utilities moved to media-editor in v0.2.0.
// Preserved here for v0.1.5 consumer backward-compat per snapshot contract.
/** @deprecated v0.2.0 — import from `@ilinxa/media-editor` directly. Removed in v0.3.0. */
export {
  useMediaCapture,
  validateGalleryFile,
  suggestedVideoFilename,
  type UseMediaCaptureOptions,
  type UseMediaCaptureResult,
  type CapturedPhoto,
  type CapturedVideo,
  type CaptureStatus,
  type FacingMode,
} from "../media-editor";

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
