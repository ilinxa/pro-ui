import type { ReactNode } from "react";

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

export type AspectRatio = "9:16" | "1:1" | "4:5" | "free";

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
  width: number;
  height: number;
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
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

// ─── Slot context ───────────────────────────────────────────────────────

export interface ComposerCtx {
  mode: ComposerMode;
  stage: ComposerStage;
  isDirty: boolean;
  publishing: { active: boolean; progress: number };
  setMode: (m: ComposerMode) => void;
  cancel: () => void;
  publish: () => Promise<void>;
}

// ─── Uploader ───────────────────────────────────────────────────────────

export type Uploader = (
  blob: Blob,
  metadata: PublishMetadata,
) => Promise<PublishResult>;

// ─── i18n labels ────────────────────────────────────────────────────────

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

export const DEFAULT_STORY_COMPOSER_LABELS: Required<StoryComposer01Labels> = {
  composerLabel: "Create story",
  composerDescription:
    "Create a new story by capturing a photo, recording a video, or composing a text-only message. Tap the close button to exit.",

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
    "We need camera permission to capture your story. Enable it in your browser settings, or choose a file from your gallery.",
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
  drawUndo: "Undo",
  drawRedo: "Redo",

  textPlaceholder: "Type something…",
  textFontFamily: "Font",
  textFontSize: "Size",
  textAlign: "Align",

  publish: "Publish",
  publishing: "Publishing…",
  published: "Published",
  close: "Close",

  discardConfirmTitle: "Discard story?",
  discardConfirmBody:
    "You'll lose your captured media and edits. This can't be undone.",
  discardConfirm: "Discard",
  discardCancel: "Keep editing",

  uploadFailedTitle: "Upload failed",
  uploadRetry: "Try again",

  recordingLabel: "Recording",
  trimStart: "Start",
  trimEnd: "End",
};

// ─── Public component props ─────────────────────────────────────────────

export interface StoryComposer01Props {
  // Display
  isOpen: boolean;
  onClose: () => void;

  // Publish destination
  uploadUrl?: string;
  uploader?: Uploader;
  uploadFields?: Record<string, string>;
  onPublished: (story: PublishedStory) => void;
  onPublishError?: (error: Error) => void;

  // Capture
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
  editorBackground?: string;
  confirmOnDiscard?: boolean;

  // Localization
  labels?: Partial<StoryComposer01Labels>;

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
  }) => ReactNode;
}

// ─── Imperative handle ──────────────────────────────────────────────────

export interface StoryComposer01Handle {
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
