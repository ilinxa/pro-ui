// ─── Main component ────────────────────────────────────────────────────

export { StoryComposer } from "./story-composer";

// ─── Types ─────────────────────────────────────────────────────────────

export type {
  StoryComposerProps,
  StoryComposerHandle,
  StoryComposerLabels,
  ResolvedStoryComposerLabels,
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
  PublishFields,
  PublishStatus,
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

// The publish details step (caption + host fields). Mounted by StoryComposer
// through media-editor's `overlay` prop when `caption` / `renderPublishFields`
// is set; exported for hosts that build their own publish flow.
export { PublishDetailsStep } from "./parts/publish-details-step";
export type { PublishDetailsStepProps } from "./parts/publish-details-step";

// ─── Exported hooks (plan §10) ─────────────────────────────────────────

export {
  useStoryComposerState,
  type UseStoryComposerStateOptions,
  type UseStoryComposerStateResult,
} from "./hooks/use-story-composer-state";

export {
  useImageUploader,
  type UseImageUploaderOptions,
  type UseImageUploaderResult,
  type UploadStatus,
} from "./hooks/use-image-uploader";
