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
} from "./hooks/use-media-capture";

export {
  useImageUploader,
  type UseImageUploaderOptions,
  type UseImageUploaderResult,
  type UploadStatus,
} from "./hooks/use-image-uploader";

// ─── Lib helpers ───────────────────────────────────────────────────────

export {
  resolveFilterPresets,
  BUILT_IN_FILTER_PRESETS,
} from "./lib/konva-filters";

export {
  resolveStickerSets,
  BUILT_IN_STICKER_SETS,
} from "./lib/built-in-stickers";

export {
  exportPhotoBlob,
  exportTextOnlyBlob,
  type ExportPhotoOptions,
} from "./lib/export-blob";

export {
  compositeVideo,
  type CompositeVideoOptions,
  type CompositeVideoResult,
} from "./lib/composite-video";

export {
  selectRecorderMime,
  containerFor,
  PREFERRED_RECORDER_MIME_TYPES,
  type RecorderMimeType,
} from "./lib/mime-fallback";

// ─── Default tokens ────────────────────────────────────────────────────

export {
  DEFAULT_TEXT_GRADIENTS,
  DEFAULT_FONTS,
  DEFAULT_COLOR_PRESETS,
  type GradientPreset,
} from "./lib/defaults";

// ─── Crop helpers (CropRect type lives here; helper functions too) ─────

export {
  fitCropToStage,
  ASPECT_RATIO_VALUES,
  type CropRect,
} from "./parts/tool-crop-overlay";
