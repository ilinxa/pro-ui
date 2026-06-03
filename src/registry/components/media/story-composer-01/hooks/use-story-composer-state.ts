"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  useMediaEditorState,
  type UseMediaEditorStateResult,
} from "../../media-editor-01";
import type { ComposerMode, ComposerStage } from "../types";

/**
 * useStoryComposerState — v0.2.0.
 *
 * Composes `useMediaEditorState` (the editor-shaped state machine
 * extracted to media-editor-01 v0.1.0) and augments with story-shaped
 * publish state (publishStatus / uploadProgress / publishError).
 *
 * **Return-shape invariant.** Every v0.1.5 field is preserved with the
 * same identifier and type. New fields are additive:
 *   - All useMediaEditorState fields spread first (state / activeTool /
 *     draft / trim / overlay setters / etc.).
 *   - v0.1.5 fields override / augment: mode (non-null), stage,
 *     visibleModes, setMode (wrapped to preserve switch-during-edit-
 *     resets-stage semantics), markDirty (no-op + dev-warn — isDirty
 *     is now derived).
 *   - Publish-shaped additions tail-spread: publishStatus,
 *     uploadProgress, publishError, and their setters.
 *
 * Consumers who only read v0.1.5 fields keep working unchanged. Consumers
 * who want the new editor-shaped surface (draft, drawingTool, etc.) can
 * access them directly.
 */

const ALL_MODES: ComposerMode[] = ["photo", "video", "text"];

export type PublishStatus =
  | "idle"
  | "compositing"
  | "uploading"
  | "done"
  | "error";

export interface UseStoryComposerStateOptions {
  defaultMode?: ComposerMode;
  hideModes?: ComposerMode[];
  /** Forwarded to useMediaEditorState onDirtyChange. */
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface UseStoryComposerStateResult
  extends Omit<UseMediaEditorStateResult, "setMode"> {
  // === v0.1.5 surface preserved ===
  /** Non-null mode — defaults to first visible mode if editor state is null. */
  mode: ComposerMode;
  stage: ComposerStage;
  visibleModes: ComposerMode[];
  /** v0.1.5 setMode preserved (non-null arg). Resets stage to "capture" + drops draft on a switch-during-edit. */
  setMode: (mode: ComposerMode) => void;
  /**
   * @deprecated v0.2.0 — isDirty is now derived from useMediaEditorState.
   * markDirty(true) is a no-op + dev console.warn. Override the derivation
   * by writing to the editor state directly.
   */
  markDirty: (dirty?: boolean) => void;

  // === v0.2.0 publish-shaped additions ===
  publishStatus: PublishStatus;
  uploadProgress: number;
  publishError: Error | null;
  setPublishStatus: (status: PublishStatus) => void;
  setUploadProgress: (progress: number) => void;
  setPublishError: (error: Error | null) => void;
}

export function useStoryComposerState(
  options: UseStoryComposerStateOptions = {},
): UseStoryComposerStateResult {
  const { defaultMode = "photo", hideModes = [], onDirtyChange } = options;

  const visibleModes = useMemo(
    () => ALL_MODES.filter((m) => !hideModes.includes(m)),
    [hideModes],
  );

  // If the default mode is hidden, fall back to the first visible mode.
  const initialMode = visibleModes.includes(defaultMode)
    ? defaultMode
    : (visibleModes[0] ?? "photo");

  const editor = useMediaEditorState({
    defaultMode: initialMode,
    onDirtyChange,
  });

  // v0.1.5 semantics: switching mode while editing drops back to capture +
  // discards the draft. useMediaEditorState's bare setMode doesn't do that.
  const setMode = useCallback(
    (mode: ComposerMode) => {
      if (mode === editor.state.mode) return;
      if (editor.state.stage === "edit") {
        editor.setStage("capture");
        editor.setDraft(null);
      }
      editor.setMode(mode);
    },
    [editor],
  );

  // markDirty: v0.1.5 manually toggled an isDirty flag. v0.2.0 derives
  // isDirty from useMediaEditorState. Preserved as a no-op + dev warn so
  // existing callers compile and run; visual behavior is governed by the
  // derived value.
  const warnedRef = useRef(false);
  const markDirty = useCallback((dirty: boolean = true) => {
    if (process.env.NODE_ENV === "production") return;
    if (warnedRef.current) return;
    warnedRef.current = true;
    console.warn(
      "useStoryComposerState.markDirty(" +
        dirty +
        ") is a no-op in v0.2.0 — isDirty is derived from useMediaEditorState. " +
        "Drive dirty via setDraft / addTextOverlay / etc. instead. " +
        "Removed in v0.3.0.",
    );
  }, []);

  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishError, setPublishError] = useState<Error | null>(null);

  // Reset clears publish state alongside the editor state.
  const baseReset = editor.reset;
  const reset = useCallback(() => {
    baseReset();
    setPublishStatus("idle");
    setUploadProgress(0);
    setPublishError(null);
  }, [baseReset]);

  return {
    ...editor,
    // v0.1.5 overrides — non-null mode, custom setMode, markDirty shim
    mode: editor.state.mode ?? initialMode,
    stage: editor.state.stage,
    visibleModes,
    setMode,
    markDirty,
    reset,
    // Publish-shaped additions
    publishStatus,
    uploadProgress,
    publishError,
    setPublishStatus,
    setUploadProgress,
    setPublishError,
  };
}
