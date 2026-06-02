"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
  ComposerMode,
  ComposerStage,
  EditTool,
  ImageAdjustments,
  MediaEditorState,
  PlacedSticker,
  TextOverlay,
} from "../types";
import { DEFAULT_ADJUSTMENTS } from "../types";

/**
 * Editor-shaped state machine for media-editor-01.
 *
 * Pure editor concerns only — no publish/upload state (those are consumer-owned,
 * see plan §"What media-editor-01 does NOT own"). story-composer-01 v0.2.0's
 * useStoryComposerState COMPOSES this hook and augments with publish state.
 *
 * C6 ships the reducer + minimal action surface. Action handlers wire up
 * progressively:
 *   - C6  (this file)  — state shape, mode/stage/dirty transitions, tool focus
 *   - C8  — gating-aware actions (validate tool against enabledTools)
 *   - C9  — initialSource → loaded state transition
 *   - C10 — exporting state for ExportOpts.onProgress wiring
 */

// ─── Action surface (internal) ──────────────────────────────────────────

type Action =
  | { type: "set-mode"; mode: ComposerMode | null }
  | { type: "set-stage"; stage: ComposerStage }
  | { type: "set-active-tool"; tool: EditTool | null }
  | { type: "set-image-src"; src: string | null }
  | { type: "set-video-blob"; blob: Blob | null }
  | { type: "set-text-content"; content: string | null }
  | { type: "add-text-overlay"; overlay: TextOverlay }
  | { type: "update-text-overlay"; id: string; patch: Partial<TextOverlay> }
  | { type: "remove-text-overlay"; id: string }
  | { type: "add-sticker"; placed: PlacedSticker }
  | { type: "remove-sticker"; id: string }
  | { type: "set-filter"; name: string | null }
  | { type: "set-adjustments"; adjustments: Partial<ImageAdjustments> }
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

// ─── Reducer ────────────────────────────────────────────────────────────

function reducer(state: MediaEditorState, action: Action): MediaEditorState {
  switch (action.type) {
    case "set-mode":
      return { ...state, mode: action.mode };
    case "set-stage":
      return { ...state, stage: action.stage };
    case "set-active-tool":
      // Active tool is UI-only; stored separately from MediaEditorState shape.
      // Kept as a no-op here; the orchestrator owns activeTool ref.
      return state;
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
    case "remove-sticker":
      return {
        ...state,
        stickers: state.stickers.filter((s) => s.id !== action.id),
      };
    case "set-filter":
      return { ...state, filter: action.name };
    case "set-adjustments":
      return {
        ...state,
        adjustments: { ...state.adjustments, ...action.adjustments },
      };
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
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface UseMediaEditorStateResult {
  state: MediaEditorState;
  isDirty: boolean;
  activeTool: EditTool | null;
  setMode: (mode: ComposerMode | null) => void;
  setStage: (stage: ComposerStage) => void;
  setActiveTool: (tool: EditTool | null) => void;
  setImageSrc: (src: string | null) => void;
  setVideoBlob: (blob: Blob | null) => void;
  setTextContent: (content: string | null) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, patch: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  addSticker: (placed: PlacedSticker) => void;
  removeSticker: (id: string) => void;
  setFilter: (name: string | null) => void;
  setAdjustments: (adjustments: Partial<ImageAdjustments>) => void;
  clearLayer: (layer: "drawing" | "stickers" | "text") => void;
  loadState: (state: MediaEditorState) => void;
  reset: () => void;
}

export function useMediaEditorState(
  opts: UseMediaEditorStateOptions = {},
): UseMediaEditorStateResult {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => ({
    ...init,
    mode: opts.defaultMode ?? null,
  }));

  // Active tool is UI-only state, separate from serializable MediaEditorState.
  const [activeTool, setActiveToolState] = useState<EditTool | null>(null);

  const setActiveTool = useCallback((tool: EditTool | null) => {
    setActiveToolState(tool);
  }, []);

  // Dirty derivation: any non-initial state counts as dirty.
  const isDirty =
    state.mode !== null ||
    state.imageSrc !== null ||
    state.videoBlob !== null ||
    state.textContent !== null ||
    state.textOverlays.length > 0 ||
    state.stickers.length > 0 ||
    state.drawingStrokes.length > 0 ||
    state.filter !== null ||
    state.crop !== null;

  // Fire onDirtyChange when isDirty flips. Effect skips the initial mount
  // (only flips fire, not the "starts clean" state).
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

  return {
    state,
    isDirty,
    activeTool,
    setMode: (mode) => dispatch({ type: "set-mode", mode }),
    setStage: (stage) => dispatch({ type: "set-stage", stage }),
    setActiveTool,
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
    removeSticker: (id) => dispatch({ type: "remove-sticker", id }),
    setFilter: (name) => dispatch({ type: "set-filter", name }),
    setAdjustments: (adjustments) =>
      dispatch({ type: "set-adjustments", adjustments }),
    clearLayer: (layer) => dispatch({ type: "clear-layer", layer }),
    loadState: (s) => dispatch({ type: "load-state", state: s }),
    reset: () => dispatch({ type: "reset" }),
  };
}
