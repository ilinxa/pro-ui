"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
  AspectRatio,
  ComposerMode,
  ComposerStage,
  CropRect,
  DraftMedia,
  DrawingToolConfig,
  EditTool,
  ImageAdjustments,
  MediaEditorState,
  PlacedSticker,
  TextOnlyState,
  TextOverlay,
  TrimRange,
} from "../types";
import { DEFAULT_ADJUSTMENTS } from "../types";
import { DEFAULT_FONTS } from "../lib/defaults";
import { DEFAULT_TEXT_GRADIENTS } from "../lib/defaults";

/**
 * Editor-shaped state machine for media-editor-01.
 *
 * Pure editor concerns only — no publish/upload state (those are consumer-owned,
 * see plan §"What media-editor-01 does NOT own"). story-composer-01 v0.2.0's
 * useStoryComposerState COMPOSES this hook and augments with publish state.
 *
 * Two state surfaces are managed here:
 *   - **`state` (MediaEditorState)** — the serializable snapshot returned by
 *     `getState()` for draft persistence. Holds mode / stage / mediaSrc /
 *     overlays / filter / adjustments / crop.
 *   - **Edit working state** (alongside `state`) — captured draft, video
 *     trim, selection ids, drawing tool config, text-only state, crop
 *     aspect. These shape ongoing edits but aren't part of the persistent
 *     snapshot.
 *
 * The split keeps the persistent snapshot clean (12 fields, all content)
 * while letting the working state grow without breaking `loadState`
 * call sites.
 */

// ─── Action surface (internal) ──────────────────────────────────────────

type Action =
  | { type: "set-mode"; mode: ComposerMode | null }
  | { type: "set-stage"; stage: ComposerStage }
  | { type: "set-image-src"; src: string | null }
  | { type: "set-video-blob"; blob: Blob | null }
  | { type: "set-text-content"; content: string | null }
  | { type: "add-text-overlay"; overlay: TextOverlay }
  | { type: "update-text-overlay"; id: string; patch: Partial<TextOverlay> }
  | { type: "remove-text-overlay"; id: string }
  | { type: "add-sticker"; placed: PlacedSticker }
  | { type: "update-sticker"; id: string; patch: Partial<PlacedSticker> }
  | { type: "remove-sticker"; id: string }
  | { type: "add-drawing-stroke"; stroke: import("../types").DrawingStroke }
  | { type: "set-filter"; name: string | null }
  | { type: "set-adjustments"; adjustments: Partial<ImageAdjustments> }
  | { type: "set-crop"; crop: CropRect | null }
  | { type: "clear-layer"; layer: "drawing" | "stickers" | "text" }
  | { type: "load-state"; state: MediaEditorState }
  | { type: "reset" };

// ─── Initial state ──────────────────────────────────────────────────────

const INITIAL_STATE: MediaEditorState = {
  mode: null,
  stage: "capture",
  imageSrc: null,
  videoBlob: null,
  textBackground: null,
  textContent: null,
  textOverlays: [],
  stickers: [],
  drawingStrokes: [],
  filter: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  crop: null,
};

const INITIAL_DRAWING_TOOL: DrawingToolConfig = {
  color: "#ffffff",
  brushSize: 8,
  mode: "draw",
};

const INITIAL_TEXT_ONLY: TextOnlyState = {
  text: "",
  fontFamily: DEFAULT_FONTS[0]?.family ?? "Onest",
  textColor: "#ffffff",
  gradientId: DEFAULT_TEXT_GRADIENTS[0]?.id ?? "midnight",
};

// ─── Reducer ────────────────────────────────────────────────────────────

function reducer(state: MediaEditorState, action: Action): MediaEditorState {
  switch (action.type) {
    case "set-mode":
      return { ...state, mode: action.mode };
    case "set-stage":
      return { ...state, stage: action.stage };
    case "set-image-src":
      return { ...state, imageSrc: action.src };
    case "set-video-blob":
      return { ...state, videoBlob: action.blob };
    case "set-text-content":
      return { ...state, textContent: action.content };
    case "add-text-overlay":
      return { ...state, textOverlays: [...state.textOverlays, action.overlay] };
    case "update-text-overlay":
      return {
        ...state,
        textOverlays: state.textOverlays.map((o) =>
          o.id === action.id ? { ...o, ...action.patch } : o,
        ),
      };
    case "remove-text-overlay":
      return {
        ...state,
        textOverlays: state.textOverlays.filter((o) => o.id !== action.id),
      };
    case "add-sticker":
      return { ...state, stickers: [...state.stickers, action.placed] };
    case "update-sticker":
      return {
        ...state,
        stickers: state.stickers.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };
    case "remove-sticker":
      return {
        ...state,
        stickers: state.stickers.filter((s) => s.id !== action.id),
      };
    case "add-drawing-stroke":
      return {
        ...state,
        drawingStrokes: [...state.drawingStrokes, action.stroke],
      };
    case "set-filter":
      return { ...state, filter: action.name };
    case "set-adjustments":
      return {
        ...state,
        adjustments: { ...state.adjustments, ...action.adjustments },
      };
    case "set-crop":
      return { ...state, crop: action.crop };
    case "clear-layer":
      if (action.layer === "drawing") {
        return { ...state, drawingStrokes: [] };
      }
      if (action.layer === "stickers") {
        return { ...state, stickers: [] };
      }
      return { ...state, textOverlays: [], textContent: null };
    case "load-state":
      return action.state;
    case "reset":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ─── Public hook ────────────────────────────────────────────────────────

export interface UseMediaEditorStateOptions {
  defaultMode?: ComposerMode;
  defaultCropAspect?: AspectRatio;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface UseMediaEditorStateResult {
  // === Persistent snapshot ===
  state: MediaEditorState;
  isDirty: boolean;

  // === Working / UI state (not in MediaEditorState snapshot) ===
  activeTool: EditTool | null;
  draft: DraftMedia | null;
  trim: TrimRange | null;
  selectedTextId: string | null;
  selectedStickerId: string | null;
  drawingTool: DrawingToolConfig;
  cropAspect: AspectRatio;
  textOnly: TextOnlyState;

  // === Persistent-snapshot actions ===
  setMode: (mode: ComposerMode | null) => void;
  setStage: (stage: ComposerStage) => void;
  setImageSrc: (src: string | null) => void;
  setVideoBlob: (blob: Blob | null) => void;
  setTextContent: (content: string | null) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, patch: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  addSticker: (placed: PlacedSticker) => void;
  updateSticker: (id: string, patch: Partial<PlacedSticker>) => void;
  removeSticker: (id: string) => void;
  addDrawingStroke: (stroke: import("../types").DrawingStroke) => void;
  setFilter: (name: string | null) => void;
  setAdjustments: (adjustments: Partial<ImageAdjustments>) => void;
  setCrop: (crop: CropRect | null) => void;
  clearLayer: (layer: "drawing" | "stickers" | "text") => void;
  loadState: (state: MediaEditorState) => void;
  reset: () => void;

  // === Working-state actions ===
  setActiveTool: (tool: EditTool | null) => void;
  setDraft: (draft: DraftMedia | null) => void;
  setTrim: (trim: TrimRange | null) => void;
  setSelectedTextId: (id: string | null) => void;
  setSelectedStickerId: (id: string | null) => void;
  setDrawingTool: (patch: Partial<DrawingToolConfig>) => void;
  setCropAspect: (aspect: AspectRatio) => void;
  setTextOnly: (patch: Partial<TextOnlyState>) => void;
}

export function useMediaEditorState(
  opts: UseMediaEditorStateOptions = {},
): UseMediaEditorStateResult {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => ({
    ...init,
    mode: opts.defaultMode ?? null,
  }));

  // Working state — not part of the persistent snapshot.
  const [activeTool, setActiveToolState] = useState<EditTool | null>(null);
  const [draft, setDraftState] = useState<DraftMedia | null>(null);
  const [trim, setTrimState] = useState<TrimRange | null>(null);
  const [selectedTextId, setSelectedTextIdState] = useState<string | null>(
    null,
  );
  const [selectedStickerId, setSelectedStickerIdState] = useState<
    string | null
  >(null);
  const [drawingTool, setDrawingToolState] = useState<DrawingToolConfig>(
    INITIAL_DRAWING_TOOL,
  );
  const [cropAspect, setCropAspectState] = useState<AspectRatio>(
    opts.defaultCropAspect ?? "9:16",
  );
  const [textOnly, setTextOnlyState] = useState<TextOnlyState>(INITIAL_TEXT_ONLY);

  // Revoke draft object URL on replacement / unmount.
  const draftUrlRef = useRef<string | null>(null);
  const setDraft = useCallback((next: DraftMedia | null) => {
    setDraftState((prev) => {
      if (prev?.url && prev.url !== next?.url) {
        URL.revokeObjectURL(prev.url);
      }
      draftUrlRef.current = next?.url ?? null;
      return next;
    });
  }, []);
  useEffect(() => {
    return () => {
      if (draftUrlRef.current) URL.revokeObjectURL(draftUrlRef.current);
    };
  }, []);

  const setActiveTool = useCallback((tool: EditTool | null) => {
    setActiveToolState(tool);
  }, []);
  const setTrim = useCallback((next: TrimRange | null) => {
    setTrimState(next);
  }, []);
  const setSelectedTextId = useCallback((id: string | null) => {
    setSelectedTextIdState(id);
  }, []);
  const setSelectedStickerId = useCallback((id: string | null) => {
    setSelectedStickerIdState(id);
  }, []);
  const setDrawingTool = useCallback((patch: Partial<DrawingToolConfig>) => {
    setDrawingToolState((prev) => ({ ...prev, ...patch }));
  }, []);
  const setCropAspect = useCallback((aspect: AspectRatio) => {
    setCropAspectState(aspect);
  }, []);
  const setTextOnly = useCallback((patch: Partial<TextOnlyState>) => {
    setTextOnlyState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Dirty derivation: any non-initial state counts as dirty. Includes draft
  // (capture-without-edit IS dirty per description §7) and text-only edits.
  const isDirty =
    state.mode !== null ||
    state.imageSrc !== null ||
    state.videoBlob !== null ||
    state.textContent !== null ||
    state.textOverlays.length > 0 ||
    state.stickers.length > 0 ||
    state.drawingStrokes.length > 0 ||
    state.filter !== null ||
    state.crop !== null ||
    draft !== null ||
    textOnly.text.length > 0;

  // Fire onDirtyChange when isDirty flips. Effect skips the initial mount.
  const prevDirtyRef = useRef<boolean | null>(null);
  const onDirtyChangeRef = useRef(opts.onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = opts.onDirtyChange;
  });
  useEffect(() => {
    if (prevDirtyRef.current !== null && prevDirtyRef.current !== isDirty) {
      onDirtyChangeRef.current?.(isDirty);
    }
    prevDirtyRef.current = isDirty;
  }, [isDirty]);

  // Reset clears BOTH the persistent snapshot AND the working state.
  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    setDraft(null);
    setTrimState(null);
    setActiveToolState(null);
    setSelectedTextIdState(null);
    setSelectedStickerIdState(null);
    setTextOnlyState(INITIAL_TEXT_ONLY);
    setDrawingToolState(INITIAL_DRAWING_TOOL);
  }, [setDraft]);

  return {
    state,
    isDirty,
    activeTool,
    draft,
    trim,
    selectedTextId,
    selectedStickerId,
    drawingTool,
    cropAspect,
    textOnly,

    setMode: (mode) => dispatch({ type: "set-mode", mode }),
    setStage: (stage) => dispatch({ type: "set-stage", stage }),
    setImageSrc: (src) => dispatch({ type: "set-image-src", src }),
    setVideoBlob: (blob) => dispatch({ type: "set-video-blob", blob }),
    setTextContent: (content) =>
      dispatch({ type: "set-text-content", content }),
    addTextOverlay: (overlay) =>
      dispatch({ type: "add-text-overlay", overlay }),
    updateTextOverlay: (id, patch) =>
      dispatch({ type: "update-text-overlay", id, patch }),
    removeTextOverlay: (id) =>
      dispatch({ type: "remove-text-overlay", id }),
    addSticker: (placed) => dispatch({ type: "add-sticker", placed }),
    updateSticker: (id, patch) =>
      dispatch({ type: "update-sticker", id, patch }),
    removeSticker: (id) => dispatch({ type: "remove-sticker", id }),
    addDrawingStroke: (stroke) =>
      dispatch({ type: "add-drawing-stroke", stroke }),
    setFilter: (name) => dispatch({ type: "set-filter", name }),
    setAdjustments: (adjustments) =>
      dispatch({ type: "set-adjustments", adjustments }),
    setCrop: (crop) => dispatch({ type: "set-crop", crop }),
    clearLayer: (layer) => dispatch({ type: "clear-layer", layer }),
    loadState: (s) => dispatch({ type: "load-state", state: s }),
    reset,

    setActiveTool,
    setDraft,
    setTrim,
    setSelectedTextId,
    setSelectedStickerId,
    setDrawingTool,
    setCropAspect,
    setTextOnly,
  };
}
