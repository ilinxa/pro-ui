import type { ReactNode } from "react";

// ─── Modes + stage ──────────────────────────────────────────────────────
// (Locked: NO renames from story-composer-01 v0.1.5 — see plan §"Type system".
// story-composer-01 v0.2.0 re-exports these for backward-compat.)

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
// v0.1.0 of media-editor-01 adds "16:9" to AspectRatio (additive — non-breaking
// for v0.1.5 consumers; they used at most "9:16" | "1:1" | "4:5" | "free").

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5" | "free";

export type EditTool =
  | "text"
  | "draw"
  | "stickers"
  | "filters"
  | "adjust"
  | "crop";

// ─── Media source intake (NEW in media-editor-01 — for capability gating) ──

export type MediaSource = "camera" | "upload";
// "library" deferred to v0.2+ — see description §"Out of scope"

// ─── Crop ───────────────────────────────────────────────────────────────
// Lifted from story-composer-01/parts/tool-crop-overlay.tsx (where v0.1.5
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

export interface MediaEditorState {
  mode: ComposerMode | null;
  stage: ComposerStage;
  imageSrc: string | null;
  videoBlob: Blob | null;
  textBackground: GradientPreset | null;
  textContent: string | null;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: DrawingStroke[];
  filter: string | null;
  adjustments: ImageAdjustments;
  crop: CropRect | null;
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
  /** Default "image/jpeg" (Q-P3 lock). */
  format?: "image/jpeg" | "image/png" | "image/webp";
  /** 0..1; default 0.9; only meaningful for jpeg/webp. */
  quality?: number;
  /** Default 2 (retina). */
  pixelRatio?: number;
  /** 0..1; fires twice (start, end) for jpeg/png; webp may fire interim. */
  onProgress?: (progress: number) => void;
}

export interface ExportVideoOpts {
  /** Default auto-pick via mime-fallback chain (vp9 → vp8 → mp4). */
  mimeType?: string;
  /** Default browser-chosen. */
  bitsPerSecond?: number;
  /** 0..1; fires ~10× during re-encode (or once if perf-shortcut applies). */
  onProgress?: (progress: number) => void;
}

export type ExportOpts = ExportImageOpts | ExportVideoOpts;

export interface ExportMetadata {
  mode: ComposerMode;
  width: number;
  height: number;
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
  crop?: CropRect;
}

// ─── Slot context (NEW — replaces ComposerCtx for editor-only consumers) ─

export interface EditorCtx {
  mode: ComposerMode | null;
  stage: ComposerStage;
  isDirty: boolean;
  isCapturing: boolean;
  isExporting: boolean;
  activeTool: EditTool | null;
  enabledTools: EditTool[];
  enabledModes: ComposerMode[];
  aspect: AspectRatio;
}

// ─── Compile-time shim for v0.1.5 part label deps (REMOVED IN C17) ──────
// Several parts (camera-permission-prompt, discard-confirm-dialog, editor-camera,
// editor-toolbar, mode-toggle-pill, text-only-canvas, tool-*) were authored
// against story-composer-01's flat StoryComposer01Labels shape. Refactoring
// each part to use MediaEditor01Labels is C17-territory (wrapper refactor).
// This temporary alias mirrors the v0.1.5 shape verbatim so the parts compile
// post-move. NOT exported via barrel — purely an internal compile shim.

/** @internal — temporary shim; refactored to MediaEditor01Labels in C17. */
export interface StoryComposer01Labels {
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
  drawUndo?: string;
  drawRedo?: string;
  textPlaceholder?: string;
  textFontFamily?: string;
  textFontSize?: string;
  textAlign?: string;
  publish?: string;
  publishing?: string;
  published?: string;
  close?: string;
  discardConfirmTitle?: string;
  discardConfirmBody?: string;
  discardConfirm?: string;
  discardCancel?: string;
  uploadFailedTitle?: string;
  uploadRetry?: string;
  recordingLabel?: string;
  trimStart?: string;
  trimEnd?: string;
}

// ─── i18n labels (NEW — full key tree per description §11) ──────────────

export interface MediaEditor01Labels {
  capture: {
    requestingCamera?: string;
    cameraDenied: {
      title?: string;
      body?: string;
      retryCta?: string;
      useGalleryCta?: string;
    };
    galleryButton?: string;
    switchCamera?: string;
    modes: { photo?: string; video?: string; text?: string };
  };
  toolbar: {
    text?: string;
    draw?: string;
    stickers?: string;
    filters?: string;
    adjust?: string;
    crop?: string;
  };
  adjust: {
    brightness?: string;
    contrast?: string;
    saturation?: string;
    blur?: string;
  };
  publish: { exporting?: string; cancel?: string; ready?: string };
  discard: {
    title?: string;
    body?: string;
    cancel?: string;
    confirm?: string;
  };
  empty: { noSource?: string };
}

// ─── Public component props ─────────────────────────────────────────────

export interface MediaEditor01Props {
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

  // === Edit-tool config ===
  stickers?: StickerSet[];
  replaceBuiltinStickers?: boolean;
  fonts?: FontOption[];
  colorPresets?: string[];
  filterPresets?: FilterPreset[];
  replaceBuiltinFilters?: boolean;
  /** Overrides default crop choices. Default derivation: if aspect !== "free" → [aspect]; else all 5. */
  cropAspects?: AspectRatio[];

  // === Discard guard ===
  /** Default true. Dialog mode only — fires on Escape/backdrop click/programmatic close() when dirty. Inline mode ignores (consumer owns navigation guarding via getIsDirty() handle). */
  confirmOnDiscard?: boolean;

  // === Localization ===
  labels?: Partial<MediaEditor01Labels>;

  // === State change observability ===
  onModeChange?: (mode: ComposerMode | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onEditAction?: (action: EditAction) => void;

  // === Slots (escape hatches) ===
  renderTopBar?: (ctx: EditorCtx) => ReactNode;
  renderBottomToolbar?: (ctx: EditorCtx) => ReactNode;
  renderPermissionDenied?: (ctx: {
    retry: () => void;
    usePicker: () => void;
  }) => ReactNode;
  renderEmpty?: () => ReactNode;
}

// ─── Imperative handle (LOCKED in description §7) ──────────────────────

export interface MediaEditor01Handle {
  // === Inspect ===
  /** True iff the user has captured OR loaded OR edited something. Capture without edit IS dirty. */
  getIsDirty: () => boolean;
  getMode: () => ComposerMode | null;
  /** Serializable snapshot — for draft persistence. */
  getState: () => MediaEditorState;
  loadState: (state: MediaEditorState) => void;

  // === Capture (only if enabledModes includes capture modes; else dev-warn + no-op) ===
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  importFromGallery: () => void;

  // === Edit (gated by enabledTools — disabled tool methods dev-warn + no-op) ===
  addText: (text?: string) => void;
  addSticker: (sticker: StickerOption) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  applyFilter: (name: string | null) => void;
  clearLayer: (layer: "drawing" | "stickers" | "text") => void;
  undo: () => void;
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
  /** Dialog mode only — no-op in inline. */
  open: () => void;
  /** Dialog mode only — no-op in inline. */
  close: () => void;
}

// ─── Default labels ─────────────────────────────────────────────────────

export const DEFAULT_LABELS: MediaEditor01Labels = {
  capture: {
    requestingCamera: "Requesting camera…",
    cameraDenied: {
      title: "Camera access blocked",
      body: "We need camera permission to continue. Enable it in your browser settings, or choose a file from your gallery.",
      retryCta: "Try again",
      useGalleryCta: "Use gallery instead",
    },
    galleryButton: "Choose from gallery",
    switchCamera: "Switch camera",
    modes: { photo: "Photo", video: "Video", text: "Text" },
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
  publish: {
    exporting: "Exporting…",
    cancel: "Cancel",
    ready: "Ready",
  },
  discard: {
    title: "Discard changes?",
    body: "You'll lose your captured media and edits. This can't be undone.",
    cancel: "Keep editing",
    confirm: "Discard",
  },
  empty: {
    noSource: "No source provided.",
  },
};
