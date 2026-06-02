// ─── Main component ────────────────────────────────────────────────────

export { StoryComposer01 } from "./story-composer-01";

// ─── Types ─────────────────────────────────────────────────────────────

export type {
  StoryComposer01Props,
  StoryComposer01Handle,
  StoryComposer01Labels,
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

// ─── Exported sealed-folder parts (plan §11) ───────────────────────────

export { ComposerCamera } from "./parts/composer-camera";
export type { ComposerCameraProps } from "./parts/composer-camera";

export { ComposerEditor } from "./parts/composer-editor";
export type { ComposerEditorProps } from "./parts/composer-editor";

export { ComposerToolbar } from "./parts/composer-toolbar";
export type { ComposerToolbarProps } from "./parts/composer-toolbar";

export { ComposerPublishBar } from "./parts/composer-publish-bar";
export type { ComposerPublishBarProps } from "./parts/composer-publish-bar";

export { ColorSwatchPicker } from "./parts/color-swatch-picker";
export type { ColorSwatchPickerProps } from "./parts/color-swatch-picker";

// ─── Exported hooks (plan §10) ─────────────────────────────────────────

export {
  useStoryComposerState,
  type UseStoryComposerStateOptions,
  type UseStoryComposerStateResult,
} from "./hooks/use-story-composer-state";

// Re-exports — useMediaCapture + utilities moved to media-editor-01 in v0.2.0.
// Preserved here for v0.1.5 consumer backward-compat per snapshot contract.
// @deprecated import from "@ilinxa/media-editor-01" — removed in v0.3.0.
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
} from "../media-editor-01";

export {
  useImageUploader,
  type UseImageUploaderOptions,
  type UseImageUploaderResult,
  type UploadStatus,
} from "./hooks/use-image-uploader";

// ─── Lib helpers ───────────────────────────────────────────────────────
// All lib helpers moved to media-editor-01 in v0.2.0.
// @deprecated import from "@ilinxa/media-editor-01" — removed in v0.3.0.

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
} from "../media-editor-01";

// ─── Default tokens ────────────────────────────────────────────────────
// Moved to media-editor-01/lib/defaults.ts in v0.2.0.
// @deprecated import from "@ilinxa/media-editor-01" — removed in v0.3.0.

export {
  DEFAULT_TEXT_GRADIENTS,
  DEFAULT_FONTS,
  DEFAULT_COLOR_PRESETS,
  type GradientPreset,
} from "../media-editor-01";

// ─── Crop helpers (CropRect type lives here; helper functions too) ─────

export {
  fitCropToStage,
  ASPECT_RATIO_VALUES,
  type CropRect,
} from "./parts/tool-crop-overlay";
