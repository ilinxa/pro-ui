"use client";

import { useCallback, useMemo, useReducer } from "react";
import type { ComposerMode, ComposerStage } from "../types";

export interface UseStoryComposerStateOptions {
  defaultMode?: ComposerMode;
  hideModes?: ComposerMode[];
}

export interface UseStoryComposerStateResult {
  mode: ComposerMode;
  stage: ComposerStage;
  isDirty: boolean;
  visibleModes: ComposerMode[];
  setMode: (mode: ComposerMode) => void;
  setStage: (stage: ComposerStage) => void;
  markDirty: (dirty?: boolean) => void;
  reset: () => void;
}

type State = {
  mode: ComposerMode;
  stage: ComposerStage;
  isDirty: boolean;
};

type Action =
  | { type: "set-mode"; mode: ComposerMode }
  | { type: "set-stage"; stage: ComposerStage }
  | { type: "mark-dirty"; dirty: boolean }
  | { type: "reset"; initialMode: ComposerMode };

const ALL_MODES: ComposerMode[] = ["photo", "video", "text"];

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-mode":
      if (state.mode === action.mode) return state;
      // Switching mode while editing resets to capture (Instagram parity).
      return {
        ...state,
        mode: action.mode,
        stage: state.stage === "edit" ? "capture" : state.stage,
        isDirty: state.stage === "edit" ? false : state.isDirty,
      };
    case "set-stage":
      if (state.stage === action.stage) return state;
      return { ...state, stage: action.stage };
    case "mark-dirty":
      if (state.isDirty === action.dirty) return state;
      return { ...state, isDirty: action.dirty };
    case "reset":
      return { mode: action.initialMode, stage: "capture", isDirty: false };
  }
}

export function useStoryComposerState(
  options: UseStoryComposerStateOptions = {},
): UseStoryComposerStateResult {
  const { defaultMode = "photo", hideModes = [] } = options;

  const visibleModes = useMemo(
    () => ALL_MODES.filter((m) => !hideModes.includes(m)),
    [hideModes],
  );

  // If the default mode is hidden, fall back to the first visible mode.
  const initialMode = visibleModes.includes(defaultMode)
    ? defaultMode
    : (visibleModes[0] ?? "photo");

  const [state, dispatch] = useReducer(reducer, {
    mode: initialMode,
    stage: "capture",
    isDirty: false,
  });

  const setMode = useCallback((mode: ComposerMode) => {
    dispatch({ type: "set-mode", mode });
  }, []);

  const setStage = useCallback((stage: ComposerStage) => {
    dispatch({ type: "set-stage", stage });
  }, []);

  const markDirty = useCallback((dirty = true) => {
    dispatch({ type: "mark-dirty", dirty });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset", initialMode });
  }, [initialMode]);

  return {
    mode: state.mode,
    stage: state.stage,
    isDirty: state.isDirty,
    visibleModes,
    setMode,
    setStage,
    markDirty,
    reset,
  };
}
