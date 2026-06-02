// media-editor-01 — public barrel.
//
// Exports grow progressively as each commit lands its surface:
//   C2  (this commit)         — main component + all editor-shaped types
//   C3                        — moved hooks (useMediaCapture + 6 internal)
//   C4                        — moved lib helpers (filters, stickers, export, composite, mime)
//   C5                        — moved parts (EditorCamera, EditorCanvas, EditorToolbar,
//                                ColorSwatchPicker, DiscardConfirmDialog)
//   C6                        — useMediaEditorState (NEW)
//   C9-C11                    — initial-source / multi-instance internal helpers (NOT re-exported)
//
// Backward-compat for story-composer-01 v0.1.5 consumers is handled in
// story-composer-01 v0.2.0's barrel via re-exports from THIS barrel
// (see plan §"Type re-export band").

// ─── Main component ────────────────────────────────────────────────────

export { MediaEditor01 } from "./media-editor-01";

// ─── Types — editor-shaped (story-composer-01 v0.2.0 re-exports these) ───

export type {
  // Modes + stage
  ComposerMode,
  ComposerStage,
  // Validation
  ValidationError,
  // Stickers
  StickerOption,
  StickerSet,
  // Filters + adjustments
  KonvaFilterSpec,
  FilterPreset,
  ImageAdjustments,
  // Overlay items
  TextOverlay,
  PlacedSticker,
  DrawingStroke,
  // Fonts
  FontOption,
  // Aspect + tools
  AspectRatio,
  EditTool,
  // Source intake
  MediaSource,
  // Crop
  CropRect,
  // Initial source
  InitialSource,
  SourceError,
  // Draft + edit-working state
  DraftMedia,
  TrimRange,
  DrawingToolConfig,
  TextOnlyState,
  // Editor state + actions
  GradientPreset,
  MediaEditorState,
  EditAction,
  // Export
  ExportImageOpts,
  ExportVideoOpts,
  ExportOpts,
  ExportMetadata,
  // Slots
  EditorCtx,
  // Labels
  MediaEditor01Labels,
  // Public component contracts
  MediaEditor01Props,
  MediaEditor01Handle,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────

export { DEFAULT_ADJUSTMENTS, DEFAULT_LABELS } from "./types";

// ─── Hooks (C3 — moved from story-composer-01 v0.1.5 via git mv) ───────

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
  useCameraPermissions,
  type CameraPermissionState,
  type UseCameraPermissionsResult,
} from "./hooks/use-camera-permissions";

export {
  useDrawingStroke,
  type UseDrawingStrokeOptions,
  type UseDrawingStrokeResult,
} from "./hooks/use-drawing-stroke";

export {
  useHistory,
  type Command,
  type UseHistoryOptions,
  type UseHistoryResult,
} from "./hooks/use-history";

export {
  useKonvaSelection,
  type SelectableKind,
  type SelectedItem,
  type UseKonvaSelectionResult,
} from "./hooks/use-konva-selection";

export {
  useKonvaStageSize,
  type StageSize,
} from "./hooks/use-konva-stage-size";

export {
  usePanZoom,
  type PanZoomTransform,
  type UsePanZoomOptions,
  type UsePanZoomResult,
} from "./hooks/use-pan-zoom";

// useMediaEditorState (C6) — written NEW; replaces story-composer-01's
// use-story-composer-state for editor-shaped concerns.
export {
  useMediaEditorState,
  type UseMediaEditorStateOptions,
  type UseMediaEditorStateResult,
} from "./hooks/use-media-editor-state";

// useMultiInstanceGuard (C11) — module-scoped counter + dev-warn for
// 2+ capture-enabled instances mounted simultaneously (Q-P5 b).
// Exported in case advanced consumers want to opt instances in/out
// explicitly when composing media-editor-01 inside other procomps.
export { useMultiInstanceGuard } from "./hooks/use-multi-instance-guard";

// ─── Lib helpers (C3 + C4 — moved from story-composer-01 v0.1.5 via git mv) ──

// mime-fallback (C3):
export {
  selectRecorderMime,
  containerFor,
  PREFERRED_RECORDER_MIME_TYPES,
  type RecorderMimeType,
} from "./lib/mime-fallback";

// konva-filters (C4):
export {
  resolveFilterPresets,
  BUILT_IN_FILTER_PRESETS,
} from "./lib/konva-filters";

// built-in-stickers (C4):
export {
  resolveStickerSets,
  BUILT_IN_STICKER_SETS,
} from "./lib/built-in-stickers";

// export-blob (C4):
export {
  exportPhotoBlob,
  exportTextOnlyBlob,
  type ExportPhotoOptions,
} from "./lib/export-blob";

// composite-video (C4):
export {
  compositeVideo,
  type CompositeVideoOptions,
  type CompositeVideoResult,
} from "./lib/composite-video";

// defaults — editor tokens (C4):
export {
  DEFAULT_TEXT_GRADIENTS,
  DEFAULT_FONTS,
  DEFAULT_COLOR_PRESETS,
} from "./lib/defaults";

// ─── Parts (C5 — moved from story-composer-01 v0.1.5 via git mv) ──────

// Renamed public parts (Composer* → Editor*):
export { EditorCamera } from "./parts/editor-camera";
export type { EditorCameraProps } from "./parts/editor-camera";

export { EditorCanvas } from "./parts/editor-canvas";
export type { EditorCanvasProps } from "./parts/editor-canvas";

export { EditorToolbar } from "./parts/editor-toolbar";
export type { EditorToolbarProps } from "./parts/editor-toolbar";

// Other public parts (per description §10):
export { ColorSwatchPicker } from "./parts/color-swatch-picker";
export type { ColorSwatchPickerProps } from "./parts/color-swatch-picker";

export { DiscardConfirmDialog } from "./parts/discard-confirm-dialog";

// Crop helpers (v0.1.5 public surface preserved):
export {
  ToolCropOverlay,
  ASPECT_RATIO_VALUES,
  fitCropToStage,
} from "./parts/tool-crop-overlay";
export type { ToolCropOverlayProps } from "./parts/tool-crop-overlay";

// Internal-by-convention parts — re-exported for sealed-folder consumers + the
// story-composer-01 v0.2.0 wrapper that still references these by name.
export { CameraPermissionPrompt } from "./parts/camera-permission-prompt";
export { ModeTogglePill } from "./parts/mode-toggle-pill";
export { ShutterButton } from "./parts/shutter-button";
export { VideoTrimBar } from "./parts/video-trim-bar";
export { TextOnlyCanvas } from "./parts/text-only-canvas";
export type {
  TextOnlyCanvasProps,
  TextOnlyCanvasState,
} from "./parts/text-only-canvas";
export { ToolAdjustSliders } from "./parts/tool-adjust-sliders";
export { ToolDrawControls } from "./parts/tool-draw-controls";
export { ToolFilterStrip } from "./parts/tool-filter-strip";
export { ToolStickerPicker } from "./parts/tool-sticker-picker";
export { ToolTextInput } from "./parts/tool-text-input";
