"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  ComposerMode,
  ComposerStage,
  CropAspect,
  CropRect,
  DraftMedia,
  DrawingToolConfig,
  EditTool,
  GradientPreset,
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
 * Editor-shaped state machine for media-editor.
 *
 * Pure editor concerns only — no publish/upload state (those are consumer-owned,
 * see plan §"What media-editor does NOT own"). story-composer v0.2.0's
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
  | {
      type: "transform";
      fn: (state: MediaEditorState) => MediaEditorState;
    }
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
    case "load-state": {
      // `textOnly` / `frame` ride on a snapshot but are not reducer state:
      // `textOnly` lives in its own useState and `frame` in the editor shell.
      const next = { ...action.state };
      delete next.textOnly;
      delete next.frame;
      return next;
    }
    case "transform":
      return action.fn(state);
    case "reset":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ─── Public hook ────────────────────────────────────────────────────────

export interface UseMediaEditorStateOptions {
  defaultMode?: ComposerMode;
  /** Any `CropAspect` (an `AspectRatio`, `"original"` or `"W:H"`). */
  defaultCropAspect?: CropAspect;
  /**
   * Text-card backgrounds used to resolve `textOnly.gradientId` when the
   * snapshot syncs `textBackground`. Default: the built-in presets.
   */
  gradients?: GradientPreset[];
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
  cropAspect: CropAspect;
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
  /**
   * Replace the snapshot with `fn(current)`. `fn` runs inside the reducer, so
   * it always sees the latest state (use it for coordinate remaps). Returning
   * the same reference is a no-op.
   */
  transformState: (fn: (state: MediaEditorState) => MediaEditorState) => void;
  reset: () => void;

  // === Working-state actions ===
  setActiveTool: (tool: EditTool | null) => void;
  setDraft: (draft: DraftMedia | null) => void;
  setTrim: (trim: TrimRange | null) => void;
  setSelectedTextId: (id: string | null) => void;
  setSelectedStickerId: (id: string | null) => void;
  setDrawingTool: (patch: Partial<DrawingToolConfig>) => void;
  setCropAspect: (aspect: CropAspect) => void;
  setTextOnly: (patch: Partial<TextOnlyState>) => void;
}

export function useMediaEditorState(
  opts: UseMediaEditorStateOptions = {},
): UseMediaEditorStateResult {
  const [rawState, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => ({
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
  const [cropAspect, setCropAspectState] = useState<CropAspect>(
    opts.defaultCropAspect ?? "9:16",
  );
  const [textOnly, setTextOnlyState] = useState<TextOnlyState>(INITIAL_TEXT_ONLY);

  // Revoke draft object URL on replacement / unmount. The revoke runs OUTSIDE
  // the setState updater — updaters must stay pure (React 19 StrictMode
  // double-invokes them). draftUrlRef mirrors the last committed URL, and
  // every draft write goes through setDraft, so it's always current.
  const draftUrlRef = useRef<string | null>(null);
  const setDraft = useCallback((next: DraftMedia | null) => {
    const prevUrl = draftUrlRef.current;
    if (prevUrl && prevUrl !== next?.url) {
      URL.revokeObjectURL(prevUrl);
    }
    draftUrlRef.current = next?.url ?? null;
    setDraftState(next);
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
  const setCropAspect = useCallback((aspect: CropAspect) => {
    setCropAspectState(aspect);
  }, []);
  const setTextOnly = useCallback((patch: Partial<TextOnlyState>) => {
    setTextOnlyState((prev) => ({ ...prev, ...patch }));
  }, []);

  // The public snapshot: `textOnly` is always filled, and while in text mode
  // `textContent` / `textBackground` follow it (the gradient resolved by id from
  // the presets the editor uses), so a consumer reading only the 0.5 fields
  // still sees the text card.
  const gradients = opts.gradients ?? DEFAULT_TEXT_GRADIENTS;
  const state = useMemo<MediaEditorState>(() => {
    if (rawState.mode !== "text") return { ...rawState, textOnly };
    return {
      ...rawState,
      textOnly,
      textContent: textOnly.text,
      textBackground:
        gradients.find((g) => g.id === textOnly.gradientId) ?? null,
    };
  }, [rawState, textOnly, gradients]);

  // Dirty derivation: any non-initial state counts as dirty. Includes draft
  // (capture-without-edit IS dirty per description §7) and text-only edits.
  const adj = rawState.adjustments;
  const isDirty =
    rawState.mode !== null ||
    rawState.imageSrc !== null ||
    rawState.videoBlob !== null ||
    rawState.textContent !== null ||
    rawState.textOverlays.length > 0 ||
    rawState.stickers.length > 0 ||
    rawState.drawingStrokes.length > 0 ||
    rawState.filter !== null ||
    rawState.crop !== null ||
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.blur !== 0 ||
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
    loadState: (s) => {
      dispatch({ type: "load-state", state: s });
      if (s.textOnly) {
        setTextOnlyState(s.textOnly);
      } else if (
        s.mode === "text" &&
        (s.textContent !== null || s.textBackground !== null)
      ) {
        // A text-mode snapshot without `textOnly` (a 0.5 snapshot): seed the
        // card from the fields it does carry; the rest stays as it was.
        const text = s.textContent;
        const gradientId = s.textBackground?.id;
        setTextOnlyState((prev) => ({
          ...prev,
          ...(text !== null ? { text } : {}),
          ...(gradientId !== undefined ? { gradientId } : {}),
        }));
      }
    },
    transformState: (fn) => dispatch({ type: "transform", fn }),
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
