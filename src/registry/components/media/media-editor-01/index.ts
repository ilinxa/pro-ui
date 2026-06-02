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

// ─── Hooks (C3 + C6) ───────────────────────────────────────────────────
// Re-exports added when the underlying files land via git mv (C3) or are
// written NEW (C6).

// ─── Lib helpers (C4) ──────────────────────────────────────────────────
// Re-exports added when lib files land via git mv.

// ─── Parts (C5) ────────────────────────────────────────────────────────
// Re-exports added when parts land via git mv + symbol renames.
