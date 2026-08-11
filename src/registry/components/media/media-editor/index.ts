// media-editor — public barrel (BASE item; capture feature slice is
// `features/capture/` — its own barrel, own registry item).
//
// Exports grow progressively as each commit lands its surface:
//   C2  (this commit)         — main component + all editor-shaped types
//   C3                        — moved hooks (useMediaCapture + 6 internal)
//   C4                        — moved lib helpers (filters, stickers, export, composite, mime)
//   C5                        — moved parts (EditorCamera, EditorCanvas, EditorToolbar,
//                                ColorSwatchPicker, DiscardConfirmDialog)
//   C6                        — useMediaEditorState (NEW)
//   C9-C11                    — initial-source / multi-instance internal helpers (NOT re-exported)
//   P3 S3 (feature-slicing)   — capture split OUT to features/capture/: useMediaCapture,
//                                useCameraPermissions, useMultiInstanceGuard, EditorCamera,
//                                CameraPermissionPrompt, ShutterButton (+ their types) no
//                                longer export from here — import from `@ilinxa/media-editor-capture`
//                                (features/capture/index.ts) instead. `validateGalleryFile` STAYS
//                                here (generic file-intake, not a capture concern) — moved to
//                                `./lib/validate-media-file`. The capture injection seam
//                                (`MediaCaptureExtension` + friends) is NEW here.
//
// Backward-compat for story-composer v0.1.5 consumers is handled in
// story-composer v0.2.0's barrel via re-exports from THIS barrel
// (see plan §"Type re-export band").

// ─── Main component ────────────────────────────────────────────────────

export { MediaEditor } from "./media-editor";

// ─── Types — editor-shaped (story-composer v0.2.0 re-exports these) ───

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
  MediaEditorLabels,
  // Public component contracts
  MediaEditorProps,
  MediaEditorHandle,
  LoadStateOpts,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────

export { DEFAULT_ADJUSTMENTS, DEFAULT_LABELS } from "./types";

// ─── Capture injection seam (P3 S3 — see hooks/use-capture-extension.ts) ─
// For consumers building a CUSTOM capture provider (not the shipped
// `@ilinxa/media-editor-capture`). Ordinary consumers just import
// `mediaCapture` from the capture feature and pass `capture={mediaCapture}`.

export {
  MediaCaptureExtensionContext,
  type MediaCaptureExtension,
  type MediaCaptureExtensionContextValue,
  type MediaCaptureSurfaceProps,
  type CapturedPhotoLike,
  type CapturedVideoLike,
} from "./hooks/use-capture-extension";

// ─── Hooks (C3 — moved from story-composer v0.1.5 via git mv) ───────

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

// useMediaEditorState (C6) — written NEW; replaces story-composer's
// use-story-composer-state for editor-shaped concerns.
export {
  useMediaEditorState,
  type UseMediaEditorStateOptions,
  type UseMediaEditorStateResult,
} from "./hooks/use-media-editor-state";

// useMultiInstanceGuard moved to features/capture/ in P3 S3 — its call site
// is now inside the feature's EditorCamera (live-camera contention is a
// capture-only concern). Advanced consumers: import from
// `@ilinxa/media-editor-capture` instead.

// ─── Lib helpers (C3 + C4 — moved from story-composer v0.1.5 via git mv) ──

// mime-fallback (C3, SHARED — capture recording + base export re-encode
// both use it):
export {
  selectRecorderMime,
  containerFor,
  PREFERRED_RECORDER_MIME_TYPES,
  type RecorderMimeType,
} from "./lib/mime-fallback";

// validate-media-file (P3 S3 — extracted from the old use-media-capture.ts;
// generic file-intake, not a capture concern, so it stayed in base):
export { validateGalleryFile } from "./lib/validate-media-file";

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

// ─── Parts (C5 — moved from story-composer v0.1.5 via git mv) ──────
// EditorCamera / CameraPermissionPrompt / ShutterButton moved to
// features/capture/ in P3 S3 — import from `@ilinxa/media-editor-capture`.

export { EditorCanvas } from "./parts/editor-canvas";
export type { EditorCanvasProps } from "./parts/editor-canvas";

// lazy-editor-canvas is an internal same-folder default-export shim for
// React.lazy() (see parts/lazy-editor-canvas.tsx) — not re-exported; use
// `EditorCanvas` above for direct/non-lazy composition.

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

// Internal-by-convention parts — re-exported for sealed-folder consumers.
export { ModeTogglePill } from "./parts/mode-toggle-pill";
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
